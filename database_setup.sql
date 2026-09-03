-- ============================================================
-- NIA CASH ADVANCE DASHBOARD
-- COMPLETE UPDATED DATABASE SETUP
-- ============================================================

CREATE DATABASE IF NOT EXISTS cash_advance_dashboard;
USE cash_advance_dashboard;

-- Temporarily disable Safe Updates to allow role-based UPDATE queries
SET SQL_SAFE_UPDATES = 0;

-- ============================================================
-- TABLE: users
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'cash_user', 'claims_user') NOT NULL DEFAULT 'cash_user',
    permissions JSON DEFAULT NULL,
    descrip VARCHAR(100),
    image LONGBLOB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Safely add permissions column if table already existed without it
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'cash_advance_dashboard' 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'permissions'
);

SET @stmt = IF(@column_exists = 0, 'ALTER TABLE users ADD COLUMN permissions JSON DEFAULT NULL AFTER role', 'SELECT "Column already exists"');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- TABLE: bonded_officials
-- ============================================================

CREATE TABLE IF NOT EXISTS bonded_officials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: cash_advances
-- ============================================================

CREATE TABLE IF NOT EXISTS cash_advances (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- DV SECTION
    fund VARCHAR(100),
    dv_date DATE NOT NULL,
    dv_number VARCHAR(50) NOT NULL,

    -- OFFICIALS
    bonded_official_id INT,
    accountable_official VARCHAR(100) NOT NULL,

    -- DESCRIPTION
    description TEXT,

    -- ORIGINAL CHECK
    check_date DATE,
    check_number VARCHAR(50),

    -- FINANCIALS
    amount DECIMAL(15,2) DEFAULT 0.00,
    spent DECIMAL(15,2) DEFAULT 0.00,
    refund DECIMAL(15,2) DEFAULT 0.00,

    -- REIMBURSEMENT
    disbursement_date DATE,
    disbursement_number VARCHAR(50),
    reimbursement_check_date DATE,
    reimbursement_check_number VARCHAR(50),

    -- COLLECTION RECEIPT
    collection_receipt_date DATE,
    collection_receipt_number VARCHAR(50),
    date_deposited DATE,

    -- LIQUIDATED
    liquidated_date DATE,
    bur_number VARCHAR(50),
    liquidation_report_number VARCHAR(50),

    -- COMPLETION / STATUS
    status ENUM('Ongoing', 'Done') DEFAULT 'Ongoing',
    remarks TEXT,
    date_submitted_to_coa DATE,

    -- META
    created_by INT,
    file_path VARCHAR(255),
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- FOREIGN KEYS
    FOREIGN KEY (bonded_official_id) REFERENCES bonded_officials(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- TABLE: audit_logs
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cash_advance_id INT,
    user_id INT,
    dv_number VARCHAR(50),
    action VARCHAR(50),
    field_changed VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (cash_advance_id) REFERENCES cash_advances(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_ca_status ON cash_advances(status);
CREATE INDEX idx_ca_deleted ON cash_advances(deleted_at);
CREATE INDEX idx_ca_dv ON cash_advances(dv_number);
CREATE INDEX idx_al_ca ON audit_logs(cash_advance_id);
CREATE INDEX idx_al_user ON audit_logs(user_id);
CREATE INDEX idx_al_date ON audit_logs(changed_at);

-- ============================================================
-- SAMPLE USERS & PERMISSIONS MIGRATION
-- ============================================================

INSERT IGNORE INTO users (username, password_hash, role, descrip)
VALUES
('admin', 'admin123', 'admin', 'System Administrator'),
('cash_user', 'cashstaff123', 'cash_user', 'Cash Advance Staff'),
('claims_user', 'claimstaff123', 'claims_user', 'Claims Staff');

-- Set default permissions for existing/sample users based on role
UPDATE users SET permissions = '{
  "general_details": true,
  "financials": true,
  "reimbursement_details": true,
  "refund_details": true,
  "liquidation": true,
  "status_completion": true
}' WHERE role = 'admin';

UPDATE users SET permissions = '{
  "general_details": true,
  "financials": true,
  "reimbursement_details": true,
  "refund_details": false,
  "liquidation": false,
  "status_completion": false
}' WHERE role = 'cash_user';

UPDATE users SET permissions = '{
  "general_details": false,
  "financials": false,
  "reimbursement_details": false,
  "refund_details": true,
  "liquidation": true,
  "status_completion": true
}' WHERE role = 'claims_user';

-- Re-enable Safe Updates
SET SQL_SAFE_UPDATES = 1;

-- ============================================================
-- SAMPLE BONDED OFFICIALS
-- ============================================================

INSERT IGNORE INTO bonded_officials (name, is_available)
VALUES
('MARINEL D. TOBIAS', 1),
('REYNARIA N. TAPIA', 1),
('ERNESTO G. CRUZ JR.', 1),
('MELODY C. CALIBAT', 1);

-- ============================================================
-- SAMPLE CASH ADVANCES
-- ============================================================

INSERT INTO cash_advances (
    fund, dv_date, dv_number,
    bonded_official_id, accountable_official,
    description,
    check_date, check_number,
    amount, spent, refund,
    disbursement_date, disbursement_number, reimbursement_check_date, reimbursement_check_number,
    collection_receipt_date, collection_receipt_number, date_deposited,
    liquidated_date, bur_number, liquidation_report_number,
    status, remarks, date_submitted_to_coa,
    created_by
)
VALUES
(
    '501LFP', '2026-01-13', '2026-01-0001',
    1, 'LARA B. JAVAN',
    'Knowledge Exchange on Enterpreneurial Practices and Innovation (KEEPI) @ NIA Region VI on January 26-30, 2026',
    '2026-01-13', '2262584',
    331200.00, 206668.00, 124532.00,
    NULL, NULL, NULL, NULL,
    '2026-03-13', '40052', '2026-03-13',
    '2026-03-13', '2026-03-00044', '2026-03-0002LFP',
    'Done', 'Completed liquidation', '2026-04-23',
    1
),
(
    '501 COB', '2026-01-09', '2026-01-0012',
    1, 'JOHN VINCE SANTOALLA',
    'Meals and Snacks for CY 2026 NIA USHERING on January 12, 2026',
    '2026-01-09', '2353356',
    26000.00, 14205.50, 11794.50,
    NULL, NULL, NULL, NULL,
    '2026-01-30', '40014', '2026-01-30',
    '2026-01-30', '2026-01-0025', '2026-01-0002',
    'Done', NULL, '2026-02-10',
    1
),
(
    '501 COB', '2026-02-03', '2026-02-0076',
    3, 'JOHN DEL C. BABAAN',
    'Web Farmland Geographic Information System (FGIS) Portal Training Per Diem: February 9-13, 2026 @ Region VI',
    '2026-02-06', '2353426',
    8100.00, 8100.00, 0.00,
    NULL, NULL, NULL, NULL,
    NULL, 'N/A', '2026-02-26',
    '2026-02-26', '2026-02-00084', '2026-02-0008',
    'Done', NULL, '2026-04-15',
    1
),
(
    '501 COB', '2026-02-05', '2026-02-0074',
    4, 'JERICO P. DE JESUS',
    'Web Farmland Geographic Information System (FGIS) Portal Training Per Diem: February 9-13, 2026 @ Region VI',
    '2026-02-06', '2353427',
    8100.00, 8100.00, 0.00,
    NULL, NULL, NULL, NULL,
    NULL, 'N/A', '2026-02-26',
    '2026-02-26', '2026-02-00083', '2026-02-0007',
    'Done', NULL, '2026-04-15',
    1
),
(
    '501 COB', '2026-02-03', '2026-02-0078',
    2, 'GLENN ANTHONY M. SAN MATEO',
    'Web Farmland Geographic Information System (FGIS) Portal Training Per Diem: February 9-13, 2026 @ Region VI',
    '2026-02-06', '2353428',
    8100.00, 8100.00, 0.00,
    NULL, NULL, NULL, NULL,
    NULL, 'N/A', '2026-02-26',
    '2026-02-26', '2026-02-00082', '2026-02-0006',
    'Ongoing', 'Pending liquidation', NULL,
    1
);

-- ============================================================
-- SAMPLE AUDIT LOGS
-- ============================================================

INSERT INTO audit_logs (cash_advance_id, user_id, dv_number, action, new_value)
VALUES
(1, 1, '2026-01-0001', 'Created', '2026-01-0001'),
(2, 1, '2026-01-0012', 'Created', '2026-01-0012'),
(3, 1, '2026-02-0076', 'Created', '2026-02-0076'),
(4, 1, '2026-02-0074', 'Created', '2026-02-0074'),
(5, 1, '2026-02-0078', 'Created', '2026-02-0078');

-- ============================================================
-- VERIFY SETUP & PERMISSIONS
-- ============================================================

SELECT 'Permissions column added & setup complete ✅' AS status;
SELECT id, username, role, permissions FROM users;
