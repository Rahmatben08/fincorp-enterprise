<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use App\Models\User;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run()
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create roles
        $roles = [
            'superadmin',
            'admin_keuangan',
            'manajer',
            'finance_staff',
            'employee',
            'investor'
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role]);
        }

        // Assign roles to existing users based on their 'role' column
        $users = User::all();
        foreach ($users as $user) {
            $roleName = $user->role;
            // Map old 'admin' to 'admin_keuangan' and 'manager' to 'manajer' to match new names
            if ($roleName === 'admin') $roleName = 'admin_keuangan';
            if ($roleName === 'manager') $roleName = 'manajer';
            
            if (in_array($roleName, $roles)) {
                if (!$user->hasRole($roleName)) {
                    $user->assignRole($roleName);
                }
            }
        }
    }
}
