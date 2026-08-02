# NIA Cash Advance Dashboard
### National Irrigation Administration – Region IV-A

---

## What's in This Project

```
NIA-Cash-Advance-Dashboard/
├── database_setup.sql          ← Run this first in MySQL Workbench
├── BackendCashAdvance/
│   ├── server.js               ← Express API server
│   ├── package.json            ← Backend dependencies
│   └── .env.example            ← Copy this to .env and fill in your password
└── FrontendCashAdvance/
    ├── src/
    │   ├── App.jsx             ← Routes + auth guard
    │   ├── Dashboard.jsx       ← Main page with CRUD
    │   ├── DataTable.jsx       ← Records table with pagination
    │   ├── auth/Login.jsx      ← Login page (NIA themed)
    │   ├── layout/Layout.jsx   ← Sidebar + AppBar wrapper
    │   ├── shellroute/
    │   │   ├── Sidebar.jsx     ← Nav + bonded officials list
    │   │   └── appbar.jsx      ← Top bar with search
    │   ├── navigation_direction/
    │   │   ├── Reporting.jsx   ← Summary cards + full table
    │   │   └── Logs.jsx        ← Pie charts + audit log table
    │   └── context/
    │       └── SearchContext.jsx ← Shared search state
    └── package.json
```

---

## STEP-BY-STEP SETUP

---

### STEP 1 — Set Up the Database

1. Open **MySQL Workbench**
2. Connect to your local MySQL server
3. Open the file `database_setup.sql` (File → Open SQL Script)
4. Click the **⚡ lightning bolt** button to run it
5. You should see: `✅ Database setup complete!`

**Default login credentials:**
| Username | Password  | Role          |
|----------|-----------|---------------|
| admin    | admin123  | Administrator |
| staff1   | user123   | Finance Staff |

---

### STEP 2 — Set Up the Backend

Open **VS Code**, then open a terminal inside the `BackendCashAdvance` folder.

**2a. Create the .env file**

Copy `.env.example` and rename the copy to `.env`, then fill in your MySQL password:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_actual_mysql_password
DB_DATABASE=cash_advance_dashboard
PORT=3000
```

**2b. Install backend packages**

```bash
cd BackendCashAdvance
npm install
```

**2c. Start the backend server**

```bash
npm start
```

You should see:
```
✅ Connected to MySQL
🚀 Server running → http://localhost:3000
```

**Test it** — open your browser and go to `http://localhost:3000`
You should see: `{"message":"NIA Cash Advance Dashboard API ✅"}`

---

### STEP 3 — Set Up the Frontend

Open a **second terminal** in VS Code (click the + icon in the terminal panel).

**3a. Copy your NIA logo image**

Copy your `logo.png` (and other image files: `logo bill.png`, `logo_report.png`, `logs.png`) into:
```
FrontendCashAdvance/src/assets/
```

**3b. Install frontend packages**

```bash
cd FrontendCashAdvance
npm install
```

**3c. Start the frontend dev server**

```bash
npm run dev
```

You should see:
```
VITE v6.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

---

### STEP 4 — Open the App

Go to **http://localhost:5173** in your browser.

Login with:
- **Username:** `admin`
- **Password:** `admin123`

---

## HOW TO RUN EVERY TIME

You need **two terminals running at the same time:**

**Terminal 1 — Backend:**
```bash
cd BackendCashAdvance
npm start
```

**Terminal 2 — Frontend:**
```bash
cd FrontendCashAdvance
npm run dev
```

Then open **http://localhost:5173**

---

## FEATURES

| Feature | Description |
|---------|-------------|
| ✅ Login | NIA-themed login page with show/hide password |
| ✅ Auth Guard | Redirects to login if not signed in |
| ✅ Dashboard | Stats cards + line/bar charts + records table |
| ✅ Add Record | Full form with all fields |
| ✅ Edit Record | Pre-filled form with update |
| ✅ Delete Record | Soft delete (keeps data for audit) |
| ✅ Search | Real-time search by DV#, official, status |
| ✅ Pagination | 10 records per page |
| ✅ Bonded Officials | Availability auto-updates with status changes |
| ✅ Reporting | Summary cards + comparison bar chart + full table |
| ✅ Audit Logs | Every create/update/delete is logged with who did it |
| ✅ Toast Alerts | Success/error notifications (no more alert() popups) |
| ✅ Logout | Clears session and returns to login |

---

## API ENDPOINTS

| Method | Endpoint | What it does |
|--------|----------|--------------|
| POST | `/login` | Login with username + password |
| GET | `/api/stats` | Dashboard summary numbers |
| GET | `/api/cash_advance_dashboard` | All records (supports `?search=`) |
| POST | `/api/cash_advance_dashboard` | Add new record |
| PUT | `/api/cash_advance_dashboard/:id` | Update a record |
| DELETE | `/api/cash_advance_dashboard/:id` | Soft-delete a record |
| GET | `/onlyoneBonded_Officials` | List bonded officials + availability |
| GET | `/all` | All data for Reporting and Logs pages |
| GET | `/audit_logs` | All audit log entries |

---

## COMMON ERRORS & FIXES

| Error | Fix |
|-------|-----|
| `Cannot connect to server` | Make sure `npm start` is running in BackendCashAdvance |
| `Access denied for user 'root'` | Wrong password in `.env` file |
| `Unknown database` | Run `database_setup.sql` in MySQL Workbench first |
| `npm : cannot be loaded` | Run `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` in PowerShell as admin |
| Images not showing | Copy your image files to `FrontendCashAdvance/src/assets/` |
| Port 3000 already in use | Change `PORT=3001` in `.env` and update all `localhost:3000` in frontend to `localhost:3001` |

---

## NEXT STEPS (Future Enhancements)

- [ ] Add user management page (admin only)
- [ ] Add document/file upload per cash advance
- [ ] Export records to Excel/PDF
- [ ] Email notifications when liquidation is overdue
- [ ] Password change feature
- [ ] Deploy to office server with PM2
