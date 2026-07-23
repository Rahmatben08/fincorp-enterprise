<?php
$pending = App\Models\User::where('status', 'pending_verification')->count();
if ($pending == 0) {
  App\Models\User::create([
    'name' => 'Test Pending Approve',
    'email' => 'test.approve@exprogio.com',
    'password' => bcrypt('password123'),
    'role' => 'finance_staff',
    'status' => 'pending_verification'
  ]);
  App\Models\User::create([
    'name' => 'Test Pending Reject',
    'email' => 'test.reject@exprogio.com',
    'password' => bcrypt('password123'),
    'role' => 'employee',
    'status' => 'pending_verification'
  ]);
  echo "Pending users created.\n";
} else {
  echo "Pending users already exist.\n";
}
echo "Total pending: " . App\Models\User::where('status', 'pending_verification')->count() . "\n";
