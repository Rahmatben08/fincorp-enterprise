-- PT Expro Gio Nusantara - Enterprise Financial Database Schema (PostgreSQL)
-- Schema DDL for 9 Entities mapping Blueprint & Role Access Control Matrix

CREATE TABLE IF NOT EXISTS roles (
    role_id VARCHAR(50) PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Keycloak integration will bypass this, but needed for local fallback
    full_name VARCHAR(150) NOT NULL,
    role_id VARCHAR(50) REFERENCES roles(role_id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending', -- 'Active', 'Pending', 'Inactive'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employees (
    employee_id SERIAL PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    division VARCHAR(100) NOT NULL,
    base_salary NUMERIC(15, 2) NOT NULL,
    allowance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    kpi_target INT NOT NULL DEFAULT 100,
    kpi_achieved INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    transaction_id VARCHAR(50) PRIMARY KEY,
    transaction_date DATE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('Pendapatan', 'Pengeluaran')),
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    description TEXT,
    creator_email VARCHAR(150) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Lunas', -- 'Lunas', 'Menunggu Approval', 'Ditolak'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS approvals (
    approval_id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(50) REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    manager_email VARCHAR(150) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'Disetujui', 'Ditolak'
    notes TEXT,
    approved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices (
    invoice_id VARCHAR(50) PRIMARY KEY,
    client_name VARCHAR(150) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    balance NUMERIC(15, 2) NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Belum Lunas', -- 'Belum Lunas', 'Lunas', 'Jatuh Tempo'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
    payment_id SERIAL PRIMARY KEY,
    invoice_id VARCHAR(50) REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL,
    payment_date DATE NOT NULL,
    reference_no VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS payroll (
    payroll_id VARCHAR(50) PRIMARY KEY, -- SL-10001 format
    employee_email VARCHAR(150) REFERENCES employees(email) ON DELETE RESTRICT,
    employee_name VARCHAR(150) NOT NULL,
    division VARCHAR(100) NOT NULL,
    period VARCHAR(50) NOT NULL,
    base_salary NUMERIC(15, 2) NOT NULL,
    allowance NUMERIC(15, 2) NOT NULL,
    bonus NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    tax NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    bpjs NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    net_salary NUMERIC(15, 2) NOT NULL,
    release_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    log_id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_email VARCHAR(150) NOT NULL,
    role_name VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    ip_address VARCHAR(45) NOT NULL
);

-- ==============================================
-- DATABASE INDEXES FOR HIGH-PERFORMANCE QUERIES
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_payroll_employee ON payroll(employee_email);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);

-- ==============================================
-- SEED INITIAL DATA (DML)
-- ==============================================

-- 1. Roles
INSERT INTO roles (role_id, role_name) VALUES
('superadmin', 'Superadmin System Control'),
('admin', 'Admin Keuangan & HR'),
('manager', 'Manajer / Direktur Operasional'),
('staff', 'Staff Karyawan')
ON CONFLICT (role_id) DO NOTHING;

-- 2. Users (Seeded defaults)
INSERT INTO users (email, password_hash, full_name, role_id, status) VALUES
('superadmin@exprogio.com', 'superadmin123', 'Zulkifli Lubis', 'superadmin', 'Active'),
('admin@exprogio.com', 'admin123', 'Siti Handayani', 'admin', 'Active'),
('manager@exprogio.com', 'manager123', 'Hendra Wijaya', 'manager', 'Active'),
('staff@exprogio.com', 'staff123', 'Agus Pratama', 'staff', 'Active')
ON CONFLICT (email) DO NOTHING;

-- 3. Employees
INSERT INTO employees (email, full_name, division, base_salary, allowance, kpi_target, kpi_achieved) VALUES
('staff@exprogio.com', 'Agus Pratama', 'IT (Teknologi Informasi)', 8500000.00, 1500000.00, 100, 95),
('dewi@exprogio.com', 'Dewi Lestari', 'Layanan Elektrikal (MEP)', 7800000.00, 1200000.00, 100, 88),
('budi@exprogio.com', 'Budi Santoso', 'Pembangunan / Sipil', 6500000.00, 1000000.00, 100, 75)
ON CONFLICT (email) DO NOTHING;

-- 4. Transactions (6 Months mock history)
INSERT INTO transactions (transaction_id, transaction_date, type, category, amount, description, creator_email, status) VALUES
('TX-001', '2026-06-10', 'Pendapatan', 'Kontrak Proyek IT', 250000000.00, 'DP Proyek Pembuatan Aplikasi ERP PT Semen Nusantara', 'admin@exprogio.com', 'Lunas'),
('TX-002', '2026-06-15', 'Pendapatan', 'Instalasi Elektrikal', 180000000.00, 'Termin 1 Pemasangan Gardu Listrik Pabrik Logam Tangerang', 'admin@exprogio.com', 'Lunas'),
('TX-003', '2026-06-25', 'Pengeluaran', 'Instalasi Elektrikal', 60000000.00, 'Pembelian Kabel Tembaga NYY 4x95mm Supreme', 'staff@exprogio.com', 'Lunas'),
('TX-004', '2026-06-28', 'Pengeluaran', 'Gaji & Payroll', 45000000.00, 'Alokasi Penggajian Karyawan & Staff Periode Juni 2026', 'admin@exprogio.com', 'Lunas'),
('TX-005', '2026-07-01', 'Pendapatan', 'Kontrak Proyek IT', 120000000.00, 'Pelunasan Invoice Proyek Cloud Infrastructure PT Telkom', 'admin@exprogio.com', 'Lunas'),
('TX-006', '2026-07-02', 'Pengeluaran', 'Operasional Kantor', 8500000.00, 'Sewa Cloud Server AWS Production & Domain Perusahaan', 'staff@exprogio.com', 'Lunas'),
('TX-007', '2026-07-02', 'Pengeluaran', 'Operasional Kantor', 2400000.00, 'Klaim Reimbursement Transport Pengawasan Sipil Cikarang', 'staff@exprogio.com', 'Lunas'),
('TX-008', '2026-07-02', 'Pengeluaran', 'Instalasi Elektrikal', 75000000.00, 'Pengadaan Sub-Panel Listrik Proyek Gedung Sudirman Kav 24', 'staff@exprogio.com', 'Menunggu Approval')
ON CONFLICT (transaction_id) DO NOTHING;

-- 5. Invoices
INSERT INTO invoices (invoice_id, client_name, amount, balance, issue_date, due_date, status) VALUES
('INV-001', 'PT Telkom Indonesia', 120000000.00, 0.00, '2026-06-15', '2026-07-01', 'Lunas'),
('INV-002', 'PT PLN (Persero)', 85000000.00, 85000000.00, '2026-06-25', '2026-07-15', 'Belum Lunas'),
('INV-003', 'CV Agro Industri', 45000000.00, 45000000.00, '2026-05-20', '2026-06-28', 'Jatuh Tempo')
ON CONFLICT (invoice_id) DO NOTHING;

-- 6. Payments
INSERT INTO payments (invoice_id, amount, payment_date, reference_no) VALUES
('INV-001', 120000000.00, '2026-07-01', 'REF-TELKOM-78490')
ON CONFLICT (reference_no) DO NOTHING;

-- 7. Payroll
INSERT INTO payroll (payroll_id, employee_email, employee_name, division, period, base_salary, allowance, bonus, tax, bpjs, net_salary, release_date) VALUES
('SL-10001', 'staff@exprogio.com', 'Agus Pratama', 'IT (Teknologi Informasi)', 'Juni 2026', 8500000.00, 1500000.00, 1211250.00, 560562.00, 224225.00, 10426463.00, '2026-06-28')
ON CONFLICT (payroll_id) DO NOTHING;

-- 8. Audit Logs
INSERT INTO audit_logs (timestamp, user_email, role_name, action, description, ip_address) VALUES
(CURRENT_TIMESTAMP - INTERVAL '2 hours', 'System', 'system', 'Inisialisasi', 'Database keuangan perusahaan berhasil dimuat awal', '127.0.0.1'),
(CURRENT_TIMESTAMP - INTERVAL '1 hour', 'superadmin@exprogio.com', 'superadmin', 'Login', 'Superadmin berhasil masuk ke sistem keuangan', '192.168.1.100')
ON CONFLICT DO NOTHING;
