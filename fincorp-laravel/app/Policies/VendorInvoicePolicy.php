<?php
namespace App\Policies;
use App\Models\VendorInvoice;
use App\Models\User;

class VendorInvoicePolicy
{
    public function update(User $user, VendorInvoice $vendorInvoice): bool {
        return in_array($user->role, ['admin_keuangan', 'manajer', 'superadmin']);
    }
}
