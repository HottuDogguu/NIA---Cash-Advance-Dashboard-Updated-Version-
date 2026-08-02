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
const __dirname = path.dirname(__filename);

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(uploadsDir));

// File upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// ============================================================
// MYSQL CONNECTION POOL
// ============================================================
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_DATABASE || "cash_advance_dashboard",
  waitForConnections: true,
  connectionLimit: 10,
});

(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ Connected to MySQL");
    conn.release();
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message);
    process.exit(1);
  }
})();

// ============================================================
// AUDIT LOG HELPER
// ============================================================
async function logAudit(cashAdvanceId, userId, action, fieldChanged = null, oldValue = null, newValue = null, dvNumber = null) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (cash_advance_id, user_id, action, field_changed, old_value, new_value, dv_number, changed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [cashAdvanceId, userId, action, fieldChanged,
       oldValue != null ? String(oldValue) : null,
       newValue != null ? String(newValue) : null,
       dvNumber]
    );
  } catch (err) {
    console.error("Audit log error:", err.message);
  }
}

// ============================================================
// TEST ROUTE
// ============================================================
app.get("/", (req, res) => {
  res.json({ message: "NIA Cash Advance Dashboard API ✅" });
});

// ============================================================
// AUTH
// ============================================================
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  console.log("Username received:", username);
  console.log("Password received:", password);

  if (!username || !password)
    return res.status(400).json({ message: "Username and password are required" });

  try {
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    console.log("Rows found:", rows);

    if (rows.length === 0)
      return res.status(401).json({ message: "Invalid username or password" });

    const user = rows[0];

    let match = false;

    if (
      user.password_hash.startsWith("$2b$") ||
      user.password_hash.startsWith("$2a$")
    ) {
      match = await bcrypt.compare(password, user.password_hash);
    } else {
      match = password === user.password_hash;
    }

    console.log("Stored hash:", user.password_hash);
    console.log("Password match:", match);

    if (!match)
      return res.status(401).json({ message: "Invalid username or password" });

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        descrip: user.descrip,
        image: user.image
          ? Buffer.from(user.image).toString("base64")
          : null,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================================================
// DASHBOARD STATS
// ============================================================
app.get("/api/stats", async (req, res) => {
  try {
    const [[total]]    = await pool.query("SELECT COUNT(*) AS cnt, COALESCE(SUM(amount),0) AS amt FROM cash_advances WHERE deleted_at IS NULL");
    const [[ongoing]]  = await pool.query("SELECT COUNT(*) AS cnt, COALESCE(SUM(amount),0) AS amt FROM cash_advances WHERE status='Ongoing' AND deleted_at IS NULL");
    const [[done]]     = await pool.query("SELECT COUNT(*) AS cnt, COALESCE(SUM(amount),0) AS amt FROM cash_advances WHERE status='Done'    AND deleted_at IS NULL");
    const [[refunds]]  = await pool.query("SELECT COALESCE(SUM(refund),0) AS amt FROM cash_advances WHERE deleted_at IS NULL");

    res.json({
      totalRecords:    total.cnt,
      totalAmount:     total.amt,
      ongoingCount:    ongoing.cnt,
      ongoingAmount:   ongoing.amt,
      completedCount:  done.cnt,
      completedAmount: done.amt,
      totalRefunds:    refunds.amt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================================================
// CASH ADVANCES – CRUD
// ============================================================

// GET all (with optional search)
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
      sql += ` AND (ca.dv_number LIKE ? OR ca.accountable_official LIKE ? OR ca.status LIKE ? OR bo.name LIKE ? OR ca.description LIKE ?)`;
      const q = `%${search}%`;
      params.push(q, q, q, q, q);
    }

    sql += " ORDER BY ca.created_at DESC";
    const [results] = await pool.query(sql, params);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST create
app.post("/api/cash_advance_dashboard", async (req, res) => {
  try {
    const {
      dv_date, dv_number, accountable_official,
      amount, spent, refund, status,
      fund, bonded_official_id, description,
      remarks, date_submitted_to_coa, user_id,
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO cash_advances
         (dv_date, dv_number, accountable_official, amount, spent, refund, status,
          fund, bonded_official_id, description, remarks, date_submitted_to_coa, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [dv_date, dv_number, accountable_official,
       amount || 0, spent || 0, refund || 0, status,
       fund || null, bonded_official_id || null, description || null,
       remarks || null, date_submitted_to_coa || null, user_id || null]
    );

    const newId = result.insertId;

    // Mark bonded official as unavailable if ongoing
    if (bonded_official_id && status === "Ongoing") {
      await pool.query("UPDATE bonded_officials SET is_available = 0 WHERE id = ?", [bonded_official_id]);
    }

    await logAudit(newId, user_id, "Created", null, null, dv_number, dv_number);

    res.json({ message: "Cash advance created successfully", id: newId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT update
app.put("/api/cash_advance_dashboard/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      dv_date, dv_number, accountable_official,
      amount, spent, refund, status,
      fund, bonded_official_id, description,
      remarks, date_submitted_to_coa, user_id,
    } = req.body;

    const [oldRows] = await pool.query(
      "SELECT * FROM cash_advances WHERE id = ? AND deleted_at IS NULL", [id]
    );
    if (oldRows.length === 0)
      return res.status(404).json({ message: "Record not found" });

    const old = oldRows[0];

    await pool.query(
      `UPDATE cash_advances SET
         dv_date=?, dv_number=?, accountable_official=?,
         amount=?, spent=?, refund=?, status=?,
         fund=?, bonded_official_id=?, description=?,
         remarks=?, date_submitted_to_coa=?, updated_at=NOW()
       WHERE id=? AND deleted_at IS NULL`,
      [dv_date, dv_number, accountable_official,
       amount || 0, spent || 0, refund || 0, status,
       fund || null, bonded_official_id || null, description || null,
       remarks || null, date_submitted_to_coa || null, id]
    );

    // Handle bonded official availability on status change
    if (old.bonded_official_id && status === "Done") {
      await pool.query("UPDATE bonded_officials SET is_available = 1 WHERE id = ?", [old.bonded_official_id]);
    }
    if (bonded_official_id && status === "Ongoing") {
      await pool.query("UPDATE bonded_officials SET is_available = 0 WHERE id = ?", [bonded_official_id]);
    }

    // Log each changed field
    const tracked = { dv_date, dv_number, accountable_official, amount, spent, refund, status };
    for (const [field, newVal] of Object.entries(tracked)) {
      if (String(old[field] ?? "") !== String(newVal ?? "")) {
        await logAudit(id, user_id, "Update", field, old[field], newVal, dv_number || old.dv_number);
      }
    }

    res.json({ message: "Cash advance updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// DELETE (soft delete)
app.delete("/api/cash_advance_dashboard/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    const [rows] = await pool.query(
      "SELECT * FROM cash_advances WHERE id = ? AND deleted_at IS NULL", [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "Record not found" });

    const record = rows[0];

    await pool.query("UPDATE cash_advances SET deleted_at = NOW() WHERE id = ?", [id]);

    // Restore bonded official if their advance is deleted
    if (record.bonded_official_id && record.status === "Ongoing") {
      await pool.query("UPDATE bonded_officials SET is_available = 1 WHERE id = ?", [record.bonded_official_id]);
    }

    await logAudit(id, user_id, "Delete", null, record.dv_number, null, record.dv_number);

    res.json({ message: "Cash advance deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ============================================================
// BONDED OFFICIALS
// ============================================================
app.get("/onlyoneBonded_Officials", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, is_available FROM bonded_officials ORDER BY name ASC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/bonded_officials", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });
    const [result] = await pool.query(
      "INSERT INTO bonded_officials (name, is_available) VALUES (?, 1)", [name]
    );
    res.json({ message: "Bonded official added", id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============================================================
// ALL DATA (Reporting + Logs pages)
// ============================================================
app.get("/all", async (req, res) => {
  try {
    const [bondedOfficials] = await pool.query(
      "SELECT id, name, is_available FROM bonded_officials ORDER BY name ASC"
    );

    const [cashAdvances] = await pool.query(`
      SELECT
        ca.id, ca.fund, ca.dv_date, ca.dv_number,
        bo.name  AS bonded_official,
        ca.bonded_official_id,
        ca.accountable_official,
        ca.description,
        ca.amount, ca.spent, ca.refund, ca.status,
        ca.remarks, ca.date_submitted_to_coa,
        ca.file_path,
        u.username AS created_by,
        ca.created_at, ca.updated_at
      FROM cash_advances ca
      LEFT JOIN bonded_officials bo ON ca.bonded_official_id = bo.id
      LEFT JOIN users u             ON ca.created_by         = u.id
      WHERE ca.deleted_at IS NULL
      ORDER BY ca.created_at DESC
    `);

    res.json({ bondedOfficials, cashAdvances });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// ============================================================
// AUDIT LOGS
// ============================================================
app.get("/audit_logs", async (req, res) => {
  try {
    const [logs] = await pool.query(`
      SELECT
        al.id, al.cash_advance_id, al.dv_number,
        u.username,
        al.action, al.field_changed, al.old_value, al.new_value, al.changed_at
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.changed_at DESC
      LIMIT 300
    `);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running → http://localhost:${PORT}`);
});
