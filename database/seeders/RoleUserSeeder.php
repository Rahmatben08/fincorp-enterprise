<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Pastikan role sudah ada (buat jika belum)
        $roles = [
            'superadmin',
            'admin_keuangan',
            'manajer',
            'finance_staff',
            'employee',
            'investor'
        ];

        foreach ($roles as $roleName) {
            Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
        }

        // Buat Akun
        $users = [
            [
                'name' => 'Super Admin',
                'email' => 'superadmin@exprogio.com',
                'role' => 'superadmin',
                'status' => 'active'
            ],
            [
                'name' => 'Admin Keuangan',
                'email' => 'admin_keuangan@exprogio.com',
                'role' => 'admin_keuangan',
                'status' => 'active'
            ],
            [
                'name' => 'Manajer',
                'email' => 'manajer@exprogio.com',
                'role' => 'manajer',
                'status' => 'active'
            ],
            [
                'name' => 'Finance Staff',
                'email' => 'finance_staff@exprogio.com',
                'role' => 'finance_staff',
                'status' => 'active'
            ],
            [
                'name' => 'Employee',
                'email' => 'employee@exprogio.com',
                'role' => 'employee',
                'status' => 'active'
            ],
            [
                'name' => 'Investor',
                'email' => 'investor@exprogio.com',
                'role' => 'investor',
                'status' => 'active'
            ]
        ];

        foreach ($users as $userData) {
            $user = User::firstOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'password' => Hash::make('password'),
                    'status' => $userData['status'],
                ]
            );

            // Assign role Spatie
            if (!$user->hasRole($userData['role'])) {
                $user->assignRole($userData['role']);
            }
        }
    }
}
