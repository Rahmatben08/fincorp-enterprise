// TypeScript Type Interfaces - FinCorp Enterprise (PT Expro Gio Nusantara)
// Mapped directly to the 9 Database Entities in the SQL DDL

export type UserRole = 'superadmin' | 'admin' | 'manager' | 'staff' | 'investor';

export interface User {
  userId?: number;
  email: string;
  fullName: string;
  roleId: UserRole;
  status: 'Active' | 'Pending' | 'Inactive';
  createdAt?: string;
}

export interface Employee {
  employeeId?: number;
  email: string;
  fullName: string;
  division: string;
  baseSalary: number;
  allowance: number;
  kpiTarget: number;
  kpiAchieved: number;
  updatedAt?: string;
}

export interface Transaction {
  transactionId: string;
  transactionDate: string;
  type: 'Pendapatan' | 'Pengeluaran';
  category: string;
  amount: number;
  description: string;
  creatorEmail: string;
  status: 'Lunas' | 'Menunggu Approval' | 'Ditolak';
  createdAt?: string;
}

export interface Approval {
  approvalId?: number;
  transactionId: string;
  managerEmail: string;
  status: 'Disetujui' | 'Ditolak';
  notes?: string;
  approvedAt?: string;
}

export interface Invoice {
  invoiceId: string;
  clientName: string;
  amount: number;
  balance: number;
  issueDate: string;
  dueDate: string;
  status: 'Belum Lunas' | 'Lunas' | 'Jatuh Tempo';
  createdAt?: string;
}

export interface Payment {
  paymentId?: number;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  referenceNo: string;
}

export interface Payroll {
  payrollId: string;
  employeeEmail: string;
  employeeName: string;
  division: string;
  period: string;
  baseSalary: number;
  allowance: number;
  bonus: number;
  tax: number;
  bpjs: number;
  netSalary: number;
  releaseDate: string;
  createdAt?: string;
}

export interface AuditLog {
  logId?: number;
  timestamp: string;
  userEmail: string;
  roleName: string;
  action: string;
  description: string;
  ipAddress: string;
}
