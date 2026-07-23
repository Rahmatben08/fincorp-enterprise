<?php
namespace App\Services;

use App\Models\Transaction;

class FinancialSummaryService
{
    public function getSummary()
    {
        $income = Transaction::where("type", "income")->where("status", "approved")->sum("amount");
        $expense = Transaction::where("type", "expense")->where("status", "approved")->sum("amount");
        $netCash = $income - $expense;

        $receivables = Transaction::where("type", "income")->where("status", "pending")->sum("amount");
        $payables = Transaction::where("type", "expense")->where("status", "pending")->sum("amount");

        return [
            "total_income" => (float) $income,
            "total_expense" => (float) $expense,
            "net_cash" => (float) $netCash,
            "receivables" => (float) $receivables,
            "payables" => (float) $payables,
            "monthly_chart_data" => $this->getMonthlyChartData()
        ];
    }

    public function getMonthlyChartData()
    {
        $transactions = Transaction::where("status", "approved")
            ->whereYear('date', date('Y'))
            ->get();

        $monthlyData = [];
        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        foreach ($months as $month) {
            $monthlyData[$month] = ['income' => 0, 'expense' => 0];
        }

        foreach ($transactions as $t) {
            $month = date('M', strtotime($t->date));
            if (isset($monthlyData[$month])) {
                $monthlyData[$month][$t->type] += (float) $t->amount;
            }
        }

        $labels = array_keys($monthlyData);
        $incomeData = array_column($monthlyData, 'income');
        $expenseData = array_column($monthlyData, 'expense');

        return [
            "labels" => $labels,
            "datasets" => [
                [
                    "label" => "Income",
                    "data" => $incomeData,
                    "borderColor" => "#10b981",
                    "backgroundColor" => "rgba(16, 185, 129, 0.1)",
                ],
                [
                    "label" => "Expense",
                    "data" => $expenseData,
                    "borderColor" => "#ef4444",
                    "backgroundColor" => "rgba(239, 68, 68, 0.1)",
                ]
            ]
        ];
    }
}

