<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\WithoutMiddleware;
use Tests\TestCase;
use App\Models\User;

class LoginRoleTest extends TestCase
{
    use WithoutMiddleware;

    public function test_login_admin_keuangan_via_manajemen()
    {
        $response = $this->postJson('/login', [
            'email' => 'admin.keuangan@exprogio.com',
            'password' => 'password',
            'intended_role_group' => ['superadmin', 'admin_keuangan', 'manajer']
        ]);

        $response->dump();
        $response->assertStatus(200);
    }
}
