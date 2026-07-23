<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('payrolls', function (Blueprint $table) {
            // Drop old basic columns
            $table->dropColumn(['employee', 'period', 'amount', 'status']);
            
            // Add comprehensive payroll columns matching frontend
            $table->string('payrollId')->nullable();
            $table->string('employeeName')->nullable();
            $table->string('employeeEmail')->nullable();
            $table->string('division')->nullable();
            $table->string('period')->nullable();
            $table->decimal('baseSalary', 15, 2)->nullable();
            $table->decimal('allowance', 15, 2)->nullable();
            $table->decimal('bonus', 15, 2)->nullable();
            $table->decimal('tax', 15, 2)->nullable();
            $table->decimal('bpjs', 15, 2)->nullable();
            $table->decimal('netSalary', 15, 2)->nullable();
            $table->date('releaseDate')->nullable();
            $table->string('status')->default('paid');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payrolls', function (Blueprint $table) {
            $table->dropColumn([
                'payrollId', 'employeeName', 'employeeEmail', 'division', 
                'period', 'baseSalary', 'allowance', 'bonus', 'tax', 
                'bpjs', 'netSalary', 'releaseDate', 'status'
            ]);
            $table->string('employee')->nullable();
            $table->string('period')->nullable();
            $table->string('amount')->nullable();
            $table->string('status')->nullable();
        });
    }
};
