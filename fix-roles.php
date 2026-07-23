<?php
use App\Models\User;
use Spatie\Permission\Models\Role;

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

User::all()->each(function($u) {
    $roleName = $u->role;
    $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    $u->assignRole($role);
});
echo "Roles assigned.\n";
