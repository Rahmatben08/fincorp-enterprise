<?php
namespace App\Policies;
use App\Models\Invoice;
use App\Models\User;

class InvoicePolicy
{
    public function update(User $user, Invoice $invoice): bool {
        return in_array($user->role, ['admin_keuangan', 'manajer', 'superadmin']);
    }
}
