<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\EsgMetricController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\EmployeeController;

use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\VendorInvoiceController;
use App\Http\Controllers\DivisionBudgetController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\Auth\CustomRegisterController;
use App\Http\Controllers\ReimbursementController;

Route::post('/register/user', [CustomRegisterController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    
    // User info
    Route::get('/user', function (Request $request) { 
        return $request->user(); 
    });

    // User Approvals (Superadmin only)
    Route::middleware('role:superadmin')->group(function () {
        Route::get('/users/pending', [UserManagementController::class, 'getPendingUsers']);
        Route::get('/users/active', [UserManagementController::class, 'getActiveUsers']);
        Route::post('/users/{id}/approve', [UserManagementController::class, 'approve']);
        Route::post('/users/{id}/reject', [UserManagementController::class, 'reject']);
        Route::post('/users/{id}/deactivate', [UserManagementController::class, 'deactivate']);
        
        Route::get('/audit-logs', [AuditLogController::class, 'index']);
    });

    // Investor routes
    Route::middleware('role:superadmin|investor')->group(function () {
        Route::get('/investor/documents', [DocumentController::class, 'index']);
        Route::get('/investor/esg-metrics', [EsgMetricController::class, 'index']);
    });

    // General Financial Access (Superadmin, Admin Keuangan, Manajer, Finance Staff)
    Route::middleware('role:superadmin|admin_keuangan|manajer|finance_staff')->group(function () {
        Route::get('/transactions/summary', [TransactionController::class, 'summary']);
        Route::get('/transactions', [TransactionController::class, 'index']);
        Route::post('/transactions', [TransactionController::class, 'store']);
        Route::post('/transactions/{id}/submit', [TransactionController::class, 'submit']);
        
        Route::get('/invoices', [InvoiceController::class, 'index']);
        Route::post('/invoices/{id}/reminder', [InvoiceController::class, 'reminder']);

        Route::get('/payables', [VendorInvoiceController::class, 'index']);
        Route::put('/payables/{id}/pay', [VendorInvoiceController::class, 'pay']);
    });
    
    Route::patch('/invoices/{id}/mark-paid', [InvoiceController::class, 'markPaid'])->middleware('role:superadmin|admin_keuangan');

    // Strict Protections for Sensitive Transaction Actions
    Route::middleware('role:superadmin|admin_keuangan')->post('/transactions/{id}/verify', [TransactionController::class, 'verify']);
    Route::middleware('role:superadmin|manajer')->post('/transactions/{id}/approve', [TransactionController::class, 'approve']);
    Route::middleware('role:superadmin|manajer')->post('/transactions/{id}/reject', [TransactionController::class, 'reject']);

    // Payroll access
    Route::middleware('role:superadmin|admin_keuangan|manajer')->group(function () {
        Route::get('/payroll', [PayrollController::class, 'index']);
        Route::post('/payroll/process', [PayrollController::class, 'process']);
    });
    
    // Strict Protections for Payroll (POST)
    Route::middleware('role:superadmin|admin_keuangan')->post('/payroll', [PayrollController::class, 'store']);

    // Employee self-service
    Route::get('/payroll/my', [PayrollController::class, 'index']); // all authenticated can view their own

    // Reimbursement (ESS)
    Route::get('/reimbursements', [ReimbursementController::class, 'index']);
    Route::post('/reimbursements', [ReimbursementController::class, 'store']);
    
    // Strict Protections for Reimbursement Actions
    Route::middleware('role:superadmin|admin_keuangan')->post('/reimbursements/{id}/verify', [ReimbursementController::class, 'verify']);
    Route::middleware('role:superadmin|manajer')->post('/reimbursements/{id}/approve', [ReimbursementController::class, 'approve']);

    // HR / Employee Management
    Route::middleware('role:superadmin|admin_keuangan|manajer')->group(function () {
        Route::get('/employees', [EmployeeController::class, 'index']);
    });

    // Budgeting
    Route::middleware('role:superadmin|admin_keuangan|manajer')->group(function () {
        Route::get('/budgets', [DivisionBudgetController::class, 'index']);
        Route::post('/audit-logs/action', [AuditLogController::class, 'action']);
    });

});

Route::get('/reports/profit-loss', function() {
    return response()->json([
        'revenue' => 15000000000,
        'expenses' => 8500000000,
        'netProfit' => 6500000000,
        'ebitda' => 7200000000,
        'assetGrowth' => 14.5
    ]);
});
