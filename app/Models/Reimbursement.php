<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reimbursement extends Model
{
    protected $fillable = [
        'user_id',
        'amount',
        'description',
        'status',
        'transaction_id',
        'verified_by',
        'verified_at',
        'approved_by',
        'approved_at'
    ];

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function transaction() {
        return $this->belongsTo(Transaction::class);
    }
}
