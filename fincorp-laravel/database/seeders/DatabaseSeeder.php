<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $users = [
            ['name' => 'Superadmin', 'email' => 'superadmin@exprogio.com', 'role' => 'superadmin'],
            ['name' => 'Admin Keuangan', 'email' => 'admin.keuangan@exprogio.com', 'role' => 'admin_keuangan'],
            ['name' => 'Manager Proyek', 'email' => 'manager.proyek@exprogio.com', 'role' => 'manajer'],
            ['name' => 'Finance Staff', 'email' => 'finance.staff@exprogio.com', 'role' => 'finance_staff'],
            ['name' => 'Budi Santoso', 'email' => 'budi.santoso@exprogio.com', 'role' => 'employee'],
            ['name' => 'Siti Aminah', 'email' => 'siti.aminah@exprogio.com', 'role' => 'employee'],
            ['name' => 'Investor', 'email' => 'investor@fincorp.com', 'role' => 'investor'],
        ];

        foreach ($users as $u) {
            User::factory()->create([
                'name' => $u['name'],
                'email' => $u['email'],
                'password' => 'password',
                'role' => $u['role']
            ]);
        }
        $this->call([
            DocumentSeeder::class,
            EsgMetricSeeder::class,
            TransactionSeeder::class,
            InvoiceSeeder::class,
            PayrollSeeder::class,
            EmployeeSeeder::class,
            UserApprovalSeeder::class,
            AuditLogSeeder::class,
            VendorInvoiceSeeder::class,
            DivisionBudgetSeeder::class,
        ]);
    }
}
