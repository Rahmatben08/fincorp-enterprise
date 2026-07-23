<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Reimbursement;
use App\Models\Transaction;
use App\Models\AuditLog;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ReimbursementController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->hasRole('employee')) {
            return response()->json(Reimbursement::where('user_id', $user->id)->orderBy('id', 'desc')->get());
        } elseif ($user->hasRole(['admin_keuangan', 'superadmin', 'manajer'])) {
            return response()->json(Reimbursement::with('user')->orderBy('id', 'desc')->get());
        }
        return response()->json([], 403);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'description' => 'required|string|max:255'
        ]);

        $r = Reimbursement::create([
            'user_id' => $request->user()->id,
            'amount' => $validated['amount'],
            'description' => $validated['description'],
            'status' => 'pending'
        ]);

        AuditLog::create([
            'user' => $request->user()->email,
            'timestamp' => Carbon::now()->toDateTimeString(),
            'action' => 'REIMBURSEMENT_CREATED',
            'description' => 'Reimbursement ID ' . $r->id . ' created by employee'
        ]);

        return response()->json($r, 201);
    }

    public function verify($id, Request $request)
    {
        if (!$request->user()->hasRole('admin_keuangan')) abort(403);
        
        $r = Reimbursement::findOrFail($id);
        if ($r->status !== 'pending') abort(400, 'Only pending reimbursements can be verified');

        $verify = $request->query('verify') === 'true';
        $status = $verify ? 'verified' : 'rejected';

        $r->update([
            'status' => $status,
            'verified_by' => $request->user()->id,
            'verified_at' => Carbon::now()
        ]);

        AuditLog::create([
            'user' => $request->user()->email,
            'timestamp' => Carbon::now()->toDateTimeString(),
            'action' => 'REIMBURSEMENT_' . strtoupper($status),
            'description' => 'Reimbursement ID ' . $r->id . ' ' . $status . ' by admin_keuangan'
        ]);

        return response()->json($r);
    }

    public function approve($id, Request $request)
    {
        if (!$request->user()->hasAnyRole(['manajer', 'superadmin'])) abort(403);

        $r = Reimbursement::findOrFail($id);
        if ($r->status !== 'verified') abort(400, 'Only verified reimbursements can be approved');

        $approve = $request->query('approve') === 'true';
        $status = $approve ? 'approved' : 'rejected';

        DB::transaction(function () use ($r, $status, $request) {
            $r->update([
                'status' => $status,
                'approved_by' => $request->user()->id,
                'approved_at' => Carbon::now()
            ]);

            if ($status === 'approved') {
                $tx = Transaction::create([
                    'date' => Carbon::now()->toDateString(),
                    'description' => 'Reimbursement: ' . $r->description,
                    'type' => 'expense',
                    'amount' => $r->amount,
                    'status' => 'approved',
                    'created_by' => $r->user_id,
                    'approved_by' => $request->user()->id
                ]);
                $r->update(['transaction_id' => $tx->id]);

                AuditLog::create([
                    'user' => 'system',
                    'timestamp' => Carbon::now()->toDateTimeString(),
                    'action' => 'TRANSACTION_AUTO_CREATED',
                    'description' => 'Auto-created expense transaction ID ' . $tx->id . ' from Reimbursement ID ' . $r->id
                ]);
            }

            AuditLog::create([
                'user' => $request->user()->email,
                'timestamp' => Carbon::now()->toDateTimeString(),
                'action' => 'REIMBURSEMENT_' . strtoupper($status),
                'description' => 'Reimbursement ID ' . $r->id . ' ' . $status . ' by approver'
            ]);
        });

        return response()->json($r);
    }
}
