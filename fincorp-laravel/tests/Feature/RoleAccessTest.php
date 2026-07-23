<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use Spatie\Permission\Models\Role;

class RoleAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Setup Roles
        $roles = ['superadmin', 'admin_keuangan', 'manajer', 'finance_staff', 'employee', 'investor'];
        foreach ($roles as $r) {
            Role::create(['name' => $r]);
        }
    }

    public function test_employee_cannot_access_transactions()
    {
        $employee = User::factory()->create();
        $employee->assignRole('employee');

        $response = $this->actingAs($employee)->getJson('/api/transactions');
        $response->assertStatus(403);
    }

    public function test_employee_cannot_access_audit_logs()
    {
        $employee = User::factory()->create();
        $employee->assignRole('employee');

        $response = $this->actingAs($employee)->getJson('/api/audit-logs');
        $response->assertStatus(403);
    }

    public function test_finance_staff_can_access_transactions_but_cannot_verify_or_approve()
    {
        $staff = User::factory()->create();
        $staff->assignRole('finance_staff');
        
        $tx = \App\Models\Transaction::create([
            'date' => '2026-07-16',
            'description' => 'Test',
            'type' => 'expense',
            'amount' => 1000,
            'status' => 'pending',
            'created_by' => $staff->id
        ]);

        // Can access transactions list
        $response = $this->actingAs($staff)->getJson('/api/transactions');
        $response->assertStatus(200);

        // Cannot verify
        $responseVerify = $this->actingAs($staff)->postJson("/api/transactions/{$tx->id}/verify?verify=true");
        $responseVerify->assertStatus(403);

        // Cannot approve
        $responseApprove = $this->actingAs($staff)->postJson("/api/transactions/{$tx->id}/approve?approve=true");
        $responseApprove->assertStatus(403);
    }

    public function test_admin_keuangan_cannot_approve()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin_keuangan');
        
        $tx = \App\Models\Transaction::create([
            'date' => '2026-07-16',
            'description' => 'Test',
            'type' => 'expense',
            'amount' => 1000,
            'status' => 'verified',
            'created_by' => $admin->id
        ]);

        // Cannot approve
        $responseApprove = $this->actingAs($admin)->postJson("/api/transactions/{$tx->id}/approve?approve=true");
        $responseApprove->assertStatus(403);
    }

    public function test_manager_cannot_verify()
    {
        $manager = User::factory()->create();
        $manager->assignRole('manajer');

        $tx = \App\Models\Transaction::create([
            'date' => '2026-07-16',
            'description' => 'Test',
            'type' => 'expense',
            'amount' => 1000,
            'status' => 'pending',
            'created_by' => $manager->id
        ]);

        // Cannot verify
        $responseVerify = $this->actingAs($manager)->postJson("/api/transactions/{$tx->id}/verify?verify=true");
        $responseVerify->assertStatus(403);
    }
}
