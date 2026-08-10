import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename:    (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// ── Pool ─────────────────────────────────────────────────────
const pool = mysql.createPool({
  host:             process.env.DB_HOST     || "localhost",
  user:             process.env.DB_USER     || "root",
  password:         process.env.DB_PASSWORD || "",
  database:         process.env.DB_DATABASE || "cash_advance_dashboard",
  waitForConnections: true,
  connectionLimit:  10,
});

(async () => {
  try {
    const c = await pool.getConnection();
    console.log("✅ Connected to MySQL");
    c.release();
  } catch (e) {
    console.error("❌ MySQL connection failed:", e.message);
    process.exit(1);
  }
})();

// ── Audit helper ─────────────────────────────────────────────
async function logAudit(caId, userId, action, field = null, oldVal = null, newVal = null, dvNum = null) {
  try {
    await pool.query(
      `INSERT INTO audit_logs
         (cash_advance_id,user_id,action,field_changed,old_value,new_value,dv_number,changed_at)
       VALUES (?,?,?,?,?,?,?,NOW())`,
      [caId, userId, action, field,
       oldVal != null ? String(oldVal) : null,
       newVal != null ? String(newVal) : null,
       dvNum]
    );
  } catch (e) { console.error("Audit error:", e.message); }
}

// ── Test ─────────────────────────────────────────────────────
app.get("/", (req, res) => res.json({ message: "NIA Cash Advance API ✅" }));

// =====================================================
// AUTH
// =====================================================
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "Username and password are required" });
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE username=?", [username]);
    if (!rows.length) return res.status(401).json({ message: "Invalid username or password" });

    const user = rows[0];
    let match = false;
    if (user.password_hash.startsWith("$2b$") || user.password_hash.startsWith("$2a$")) {
      match = await bcrypt.compare(password, user.password_hash);
    } else {
      match = password === user.password_hash;
    }
    if (!match) return res.status(401).json({ message: "Invalid username or password" });

    res.json({
      message: "Login successful",
      user: {
        id:       user.id,
        username: user.username,
        role:     user.role,
        descrip:  user.descrip,
        image:    user.image ? Buffer.from(user.image).toString("base64") : null,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

// =====================================================
// USER MANAGEMENT (Admin only enforced on frontend;
// add middleware here for production hardening)
// =====================================================

// GET all users
app.get("/api/users", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, username, role, descrip, created_at FROM users ORDER BY created_at ASC"
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST create user
app.post("/api/users", async (req, res) => {
  const { username, password, role, descrip } = req.body;
  if (!username || !password || !role)
    return res.status(400).json({ message: "Username, password, and role are required" });
  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (username, password_hash, role, descrip) VALUES (?,?,?,?)",
      [username, hash, role, descrip || null]
    );
    res.json({ message: "User created successfully", id: result.insertId });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY")
      return res.status(409).json({ message: "Username already exists" });
    res.status(500).json({ message: e.message });
  }
});

// PUT update user
app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const { username, password, role, descrip } = req.body;
  try {
    const [existing] = await pool.query("SELECT * FROM users WHERE id=?", [id]);
    if (!existing.length) return res.status(404).json({ message: "User not found" });

    let passwordHash = existing[0].password_hash;
    if (password && password.trim() !== "") {
      passwordHash = await bcrypt.hash(password, 10);
    }

    await pool.query(
      "UPDATE users SET username=?, password_hash=?, role=?, descrip=? WHERE id=?",
      [username || existing[0].username, passwordHash, role || existing[0].role, descrip ?? existing[0].descrip, id]
    );
    res.json({ message: "User updated successfully" });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY")
      return res.status(409).json({ message: "Username already exists" });
    res.status(500).json({ message: e.message });
  }
});

// DELETE user
app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const { requesting_user_id } = req.body;
  if (String(requesting_user_id) === String(id))
    return res.status(400).json({ message: "You cannot delete your own account" });
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE id=?", [id]);
    if (!rows.length) return res.status(404).json({ message: "User not found" });
    await pool.query("DELETE FROM users WHERE id=?", [id]);
    res.json({ message: "User deleted successfully" });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// =====================================================
// DASHBOARD STATS
// =====================================================
app.get("/api/stats", async (req, res) => {
  try {
    const [[total]]   = await pool.query("SELECT COUNT(*) cnt, COALESCE(SUM(amount),0) amt FROM cash_advances WHERE deleted_at IS NULL");
    const [[ongoing]] = await pool.query("SELECT COUNT(*) cnt, COALESCE(SUM(amount),0) amt FROM cash_advances WHERE status='Ongoing' AND deleted_at IS NULL");
    const [[done]]    = await pool.query("SELECT COUNT(*) cnt, COALESCE(SUM(amount),0) amt FROM cash_advances WHERE status='Done'    AND deleted_at IS NULL");
    const [[refunds]] = await pool.query("SELECT COALESCE(SUM(refund),0) amt FROM cash_advances WHERE deleted_at IS NULL");
    res.json({
      totalRecords:    total.cnt,   totalAmount:     total.amt,
      ongoingCount:    ongoing.cnt, ongoingAmount:   ongoing.amt,
      completedCount:  done.cnt,    completedAmount: done.amt,
      totalRefunds:    refunds.amt,
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// =====================================================
// CASH ADVANCES — CRUD
// =====================================================

// All fields matching the Excel layout
const CA_INSERT_FIELDS = [
  "fund","dv_date","dv_number",
  "bonded_official_id","accountable_official","description",
  "check_date","check_number",
  "amount","spent","refund",
  "collection_receipt_date","collection_receipt_number","date_deposited",
  "liquidated_date","bur_number","liquidation_report_number",
  "status","remarks","date_submitted_to_coa","created_by",
];

// GET all
app.get("/api/cash_advance_dashboard", async (req, res) => {
  try {
    const { search } = req.query;
    let sql = `
      SELECT ca.*, bo.name AS bonded_official_name, u.username AS creator
      FROM cash_advances ca
      LEFT JOIN bonded_officials bo ON ca.bonded_official_id = bo.id
      LEFT JOIN users u ON ca.created_by = u.id
      WHERE ca.deleted_at IS NULL
    `;
    const params = [];
    
    if (search) {
      sql += ` AND (
        ca.dv_number LIKE ? OR 
        ca.accountable_official LIKE ? OR 
        ca.status LIKE ? OR 
        bo.name LIKE ? OR 
        ca.description LIKE ? OR 
        ca.bur_number LIKE ? OR 
        ca.liquidation_report_number LIKE ? OR
        CAST(ca.amount AS CHAR) LIKE ? OR
        CAST(ca.spent AS CHAR) LIKE ? OR
        CAST(ca.refund AS CHAR) LIKE ? OR
        MONTHNAME(ca.dv_date) LIKE ? OR
        MONTHNAME(ca.check_date) LIKE ? OR
        MONTHNAME(ca.collection_receipt_date) LIKE ? OR
        MONTHNAME(ca.liquidated_date) LIKE ? OR
        MONTHNAME(ca.date_submitted_to_coa) LIKE ?
      )`;
      
      const q = `%${search}%`;
      params.push(q,q,q,q,q,q,q,q,q,q,q,q,q,q,q); 
    }
    
    sql += " ORDER BY ca.created_at DESC";
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) { 
    res.status(500).json({ message: e.message }); 
  }
});

// POST create
app.post("/api/cash_advance_dashboard", async (req, res) => {
  try {
    const b = req.body;
    const [result] = await pool.query(
      `INSERT INTO cash_advances
         (fund,dv_date,dv_number,bonded_official_id,accountable_official,description,
          check_date,check_number,
          amount,spent,refund,
          collection_receipt_date,collection_receipt_number,date_deposited,
          liquidated_date,bur_number,liquidation_report_number,
          status,remarks,date_submitted_to_coa,created_by,created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())`,
      [
        b.fund||null, b.dv_date, b.dv_number,
        b.bonded_official_id||null, b.accountable_official, b.description||null,
        b.check_date||null, b.check_number||null,
        b.amount||0, b.spent||0, b.refund||0,
        b.collection_receipt_date||null, b.collection_receipt_number||null, b.date_deposited||null,
        b.liquidated_date||null, b.bur_number||null, b.liquidation_report_number||null,
        b.status, b.remarks||null, b.date_submitted_to_coa||null, b.user_id||null,
      ]
    );
    const newId = result.insertId;
    if (b.bonded_official_id && b.status === "Ongoing")
      await pool.query("UPDATE bonded_officials SET is_available=0 WHERE id=?", [b.bonded_official_id]);
    await logAudit(newId, b.user_id, "Created", null, null, b.dv_number, b.dv_number);
    res.json({ message: "Created successfully", id: newId });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PUT update
app.put("/api/cash_advance_dashboard/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const b = req.body;

    const [oldRows] = await pool.query("SELECT * FROM cash_advances WHERE id=? AND deleted_at IS NULL", [id]);
    if (!oldRows.length) return res.status(404).json({ message: "Record not found" });
    const old = oldRows[0];

    await pool.query(
      `UPDATE cash_advances SET
         fund=?,dv_date=?,dv_number=?,bonded_official_id=?,accountable_official=?,description=?,
         check_date=?,check_number=?,
         amount=?,spent=?,refund=?,
         collection_receipt_date=?,collection_receipt_number=?,date_deposited=?,
         liquidated_date=?,bur_number=?,liquidation_report_number=?,
         status=?,remarks=?,date_submitted_to_coa=?,updated_at=NOW()
       WHERE id=? AND deleted_at IS NULL`,
      [
        b.fund||null, b.dv_date, b.dv_number,
        b.bonded_official_id||null, b.accountable_official, b.description||null,
        b.check_date||null, b.check_number||null,
        b.amount||0, b.spent||0, b.refund||0,
        b.collection_receipt_date||null, b.collection_receipt_number||null, b.date_deposited||null,
        b.liquidated_date||null, b.bur_number||null, b.liquidation_report_number||null,
        b.status, b.remarks||null, b.date_submitted_to_coa||null, id,
      ]
    );

    if (old.bonded_official_id && b.status === "Done")
      await pool.query("UPDATE bonded_officials SET is_available=1 WHERE id=?", [old.bonded_official_id]);
    if (b.bonded_official_id && b.status === "Ongoing")
      await pool.query("UPDATE bonded_officials SET is_available=0 WHERE id=?", [b.bonded_official_id]);

    const tracked = { dv_number: b.dv_number, amount: b.amount, spent: b.spent, refund: b.refund, status: b.status };
    for (const [f, nv] of Object.entries(tracked)) {
      if (String(old[f]??"") !== String(nv??""))
        await logAudit(id, b.user_id, "Update", f, old[f], nv, b.dv_number||old.dv_number);
    }
    res.json({ message: "Updated successfully" });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// DELETE
app.delete("/api/cash_advance_dashboard/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    const [rows] = await pool.query("SELECT * FROM cash_advances WHERE id=? AND deleted_at IS NULL", [id]);
    if (!rows.length) return res.status(404).json({ message: "Record not found" });
    const r = rows[0];
    await pool.query("UPDATE cash_advances SET deleted_at=NOW() WHERE id=?", [id]);
    if (r.bonded_official_id && r.status==="Ongoing")
      await pool.query("UPDATE bonded_officials SET is_available=1 WHERE id=?", [r.bonded_official_id]);
    await logAudit(id, user_id, "Delete", null, r.dv_number, null, r.dv_number);
    res.json({ message: "Deleted successfully" });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// =====================================================
// BONDED OFFICIALS
// =====================================================
app.get("/onlyoneBonded_Officials", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id,name,is_available FROM bonded_officials ORDER BY name ASC");
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post("/bonded_officials", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name required" });
    const [r] = await pool.query("INSERT INTO bonded_officials (name,is_available) VALUES (?,1)", [name]);
    res.json({ message: "Added", id: r.insertId });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// =====================================================
// ALL DATA (Reporting + Logs)
// =====================================================
app.get("/all", async (req, res) => {
  try {
    const [bondedOfficials] = await pool.query("SELECT id,name,is_available FROM bonded_officials ORDER BY name");
    const [cashAdvances]    = await pool.query(`
      SELECT ca.*,
             bo.name  AS bonded_official,
             u.username AS created_by_name
      FROM cash_advances ca
      LEFT JOIN bonded_officials bo ON ca.bonded_official_id = bo.id
      LEFT JOIN users u ON ca.created_by = u.id
      WHERE ca.deleted_at IS NULL
      ORDER BY ca.created_at DESC
    `);
    res.json({ bondedOfficials, cashAdvances });
  } catch (e) { res.status(500).json({ message: e.message }); }
});


// =====================================================
// AUDIT LOGS
// =====================================================
app.get("/audit_logs", async (req, res) => {
  try {
    const [logs] = await pool.query(`
      SELECT al.*, u.username
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id=u.id
      ORDER BY al.changed_at DESC LIMIT 300
    `);
    res.json({ logs });
  } catch (e) { res.status(500).json({ message: e.message }); }
});


// =====================================================
// FILE UPLOAD ROUTES
// =====================================================

// POST /api/cash_advance_dashboard/:id/upload
// Attaches a file to a specific cash advance record
app.post("/api/cash_advance_dashboard/:id/upload", upload.single("file"), async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    // Get existing record to check for old file
    const [rows] = await pool.query(
      "SELECT file_path FROM cash_advances WHERE id = ? AND deleted_at IS NULL",
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: "Record not found" });
    }

    // Delete the old file from disk if one exists
    if (rows[0].file_path) {
      const oldFilePath = path.join(uploadsDir, rows[0].file_path);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Save new file path in the database
    await pool.query(
      "UPDATE cash_advances SET file_path = ? WHERE id = ?",
      [req.file.filename, id]
    );

    res.json({
      message: "File uploaded successfully",
      file_path: req.file.filename,
    });
  } catch (e) {
    console.error("File upload error:", e);
    res.status(500).json({ message: e.message });
  }
});

// DELETE /api/cash_advance_dashboard/:id/file
// Removes the attached file from a cash advance record
app.delete("/api/cash_advance_dashboard/:id/file", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT file_path FROM cash_advances WHERE id = ? AND deleted_at IS NULL",
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: "Record not found" });
    }

    // Delete the file from disk
    if (rows[0].file_path) {
      const filePath = path.join(uploadsDir, rows[0].file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Clear file_path in the database
    await pool.query(
      "UPDATE cash_advances SET file_path = NULL WHERE id = ?",
      [id]
    );

    res.json({ message: "File removed successfully" });
  } catch (e) {
    console.error("File delete error:", e);
    res.status(500).json({ message: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server → http://localhost:${PORT}`));
