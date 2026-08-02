-- ============================================================
-- NIA Cash Advance Dashboard - Complete Database Setup
-- Run this entire file in MySQL Workbench
-- ============================================================

CREATE DATABASE IF NOT EXISTS cash_advance_dashboard;
USE cash_advance_dashboard;

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  descrip VARCHAR(100) DEFAULT NULL,
  image LONGBLOB DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: bonded_officials
-- ============================================================
CREATE TABLE IF NOT EXISTS bonded_officials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: cash_advances
-- ============================================================
CREATE TABLE IF NOT EXISTS cash_advances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fund VARCHAR(100) DEFAULT NULL,
  dv_date DATE NOT NULL,
  dv_number VARCHAR(50) NOT NULL,
  bonded_official_id INT DEFAULT NULL,
  accountable_official VARCHAR(100) NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  spent DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  refund DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  status ENUM('Ongoing','Done') NOT NULL DEFAULT 'Ongoing',
  remarks TEXT DEFAULT NULL,
  date_submitted_to_coa DATE DEFAULT NULL,
  file_path VARCHAR(255) DEFAULT NULL,
  created_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (bonded_official_id) REFERENCES bonded_officials(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- TABLE: audit_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cash_advance_id INT DEFAULT NULL,
  dv_number VARCHAR(50) DEFAULT NULL,
  user_id INT DEFAULT NULL,
  action VARCHAR(50) NOT NULL,
  field_changed VARCHAR(100) DEFAULT NULL,
  old_value VARCHAR(255) DEFAULT NULL,
  new_value VARCHAR(255) DEFAULT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- SAMPLE DATA
-- Default passwords (plain text for development):
--   admin  → admin123
--   staff1 → user123
-- ============================================================

INSERT INTO users (username, password_hash, role, descrip) VALUES
('admin',  'admin123', 'admin', 'System Administrator'),
('staff1', 'user123',  'user',  'Finance Staff')
ON DUPLICATE KEY UPDATE username = username;

INSERT INTO bonded_officials (name, is_available) VALUES
('Juan Dela Cruz', 1),
('Maria Santos',   1),
('Pedro Reyes',    0),
('Ana Garcia',     1),
('Jose Rizal',     1)
ON DUPLICATE KEY UPDATE name = name;

INSERT INTO cash_advances
  (fund, dv_date, dv_number, bonded_official_id, accountable_official, description, amount, spent, refund, status, created_by)
VALUES
('General Fund',     '2026-01-15', 'DV-2026-001', 1, 'Maria Santos',   'Travel allowance – Region IV-A coordination', 15000.00, 12000.00, 3000.00, 'Done',    1),
('Special Fund',     '2026-02-10', 'DV-2026-002', 2, 'Juan Dela Cruz', 'Office supplies procurement',                  8500.00,  7200.00,  1300.00, 'Done',    1),
('General Fund',     '2026-03-05', 'DV-2026-003', 3, 'Pedro Reyes',    'Field inspection expenses',                   25000.00, 18000.00,     0.00, 'Ongoing', 1),
('Maintenance Fund', '2026-04-12', 'DV-2026-004', 4, 'Ana Garcia',     'Vehicle maintenance and fuel',                12000.00,  9500.00,   500.00, 'Ongoing', 1),
('General Fund',     '2026-05-20', 'DV-2026-005', 5, 'Jose Rizal',     'Training seminar fees',                       30000.00, 28000.00,  2000.00, 'Done',    1),
('Capital Fund',     '2026-06-01', 'DV-2026-006', 1, 'Maria Santos',   'Equipment repair parts',                      45000.00, 40000.00,     0.00, 'Ongoing', 1);

UPDATE bonded_officials SET is_available = 0 WHERE name = 'Pedro Reyes';

SELECT '✅ Database setup complete!' AS status;
SELECT 'Login: admin / admin123  (Administrator)' AS credentials;
SELECT 'Login: staff1 / user123  (Finance Staff)' AS credentials2;
