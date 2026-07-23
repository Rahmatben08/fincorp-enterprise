<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Transaction;
use App\Services\FinancialSummaryService;

class FinancialSummaryServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_get_summary_calculates_correct_totals()
    {
        // Income (approved)
        Transaction::create([
            'date' => date('Y-m-d'),
            'description' => 'Income 1',
            'type' => 'income',
            'amount' => 1000000,
            'status' => 'approved'
        ]);

        // Expense (approved)
        Transaction::create([
            'date' => date('Y-m-d'),
            'description' => 'Expense 1',
            'type' => 'expense',
            'amount' => 300000,
            'status' => 'approved'
        ]);

        // Receivables (pending income)
        Transaction::create([
            'date' => date('Y-m-d'),
            'description' => 'Pending Income',
            'type' => 'income',
            'amount' => 500000,
            'status' => 'pending'
        ]);

        // Payables (pending expense)
        Transaction::create([
            'date' => date('Y-m-d'),
            'description' => 'Pending Expense',
            'type' => 'expense',
            'amount' => 200000,
            'status' => 'pending'
        ]);

        $service = new FinancialSummaryService();
        $summary = $service->getSummary();

        $this->assertEquals(1000000, $summary['total_income']);
        $this->assertEquals(300000, $summary['total_expense']);
        $this->assertEquals(700000, $summary['net_cash']);
        $this->assertEquals(500000, $summary['receivables']);
        $this->assertEquals(200000, $summary['payables']);
    }
}
