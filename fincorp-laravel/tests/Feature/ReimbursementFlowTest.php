<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Reimbursement;
use Spatie\Permission\Models\Role;

class ReimbursementFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        $roles = ['superadmin', 'admin_keuangan', 'manajer', 'finance_staff', 'employee', 'investor'];
        foreach ($roles as $r) {
            Role::create(['name' => $r]);
        }
    }

    public function test_full_reimbursement_flow()
    {
        $employee = User::factory()->create();
        $employee->assignRole('employee');

        $admin = User::factory()->create();
        $admin->assignRole('admin_keuangan');

        $manager = User::factory()->create();
        $manager->assignRole('manajer');

        // 1. Employee creates a reimbursement
        $response = $this->actingAs($employee)->postJson('/api/reimbursements', [
            'amount' => 500000,
            'description' => 'Makan malam klien'
        ]);
        
        $response->assertStatus(201);
        $reimbursementId = $response->json('id');
        
        $this->assertDatabaseHas('reimbursements', [
            'id' => $reimbursementId,
            'status' => 'pending'
        ]);

        // 2. Admin Keuangan verifies
        $responseVerify = $this->actingAs($admin)->postJson("/api/reimbursements/{$reimbursementId}/verify?verify=true");
        $responseVerify->assertStatus(200);

        $this->assertDatabaseHas('reimbursements', [
            'id' => $reimbursementId,
            'status' => 'verified'
        ]);

        // 3. Manager approves
        $responseApprove = $this->actingAs($manager)->postJson("/api/reimbursements/{$reimbursementId}/approve?approve=true");
        $responseApprove->assertStatus(200);

        $this->assertDatabaseHas('reimbursements', [
            'id' => $reimbursementId,
            'status' => 'approved'
        ]);

        // 4. Check if transaction was auto-created
        $this->assertDatabaseHas('transactions', [
            'amount' => 500000,
            'type' => 'expense',
            'status' => 'approved'
        ]);
        
        // 5. Check audit logs
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'REIMBURSEMENT_CREATED'
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'REIMBURSEMENT_VERIFIED'
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'REIMBURSEMENT_APPROVED'
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'TRANSACTION_AUTO_CREATED'
        ]);
    }
}
