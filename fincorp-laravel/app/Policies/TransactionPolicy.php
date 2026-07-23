<?php
namespace App\Policies;

use App\Models\Transaction;
use App\Models\User;

class TransactionPolicy
{
    public function viewAny(User $user): bool {
        return $user->hasAnyRole(["superadmin", "admin_keuangan", "manajer", "finance_staff"]);
    }
    
    public function view(User $user, Transaction $transaction): bool {
        if ($user->hasAnyRole(["superadmin", "admin_keuangan", "manajer"])) return true;
        
        if ($user->hasRole("finance_staff")) {
            return $user->id === $transaction->created_by;
        }

        return false;
    }
    
    public function create(User $user): bool {
        return $user->hasAnyRole(["superadmin", "admin_keuangan", "finance_staff"]);
    }
    
    public function update(User $user, Transaction $transaction): bool {
        if ($user->hasRole("superadmin")) return true;
        
        // Finance staff can only edit their own draft or pending transactions
        if ($user->hasRole("finance_staff") && $user->id === $transaction->created_by) {
            return in_array($transaction->status, ['draft', 'pending', 'rejected']);
        }
        
        return false;
    }

    public function submit(User $user, Transaction $transaction): bool {
        // Only creator can submit their draft to pending
        return $user->id === $transaction->created_by && in_array($transaction->status, ['draft', 'rejected']);
    }

    public function verify(User $user, Transaction $transaction): bool {
        // Segregation of duties: Verifier cannot be the creator
        if ($user->id === $transaction->created_by && !$user->hasRole("superadmin")) {
            return false;
        }
        return $user->hasAnyRole(["superadmin", "admin_keuangan"]) && $transaction->status === 'pending';
    }

    public function approve(User $user, Transaction $transaction): bool {
        // Segregation of duties: Approver cannot be the verifier or creator
        if (($user->id === $transaction->created_by || $user->id === $transaction->verified_by) && !$user->hasRole("superadmin")) {
            return false;
        }
        return $user->hasAnyRole(["superadmin", "manajer"]) && $transaction->status === 'verified';
    }

    public function delete(User $user, Transaction $transaction): bool {
        return $user->hasRole("superadmin");
    }
}
