<?php
namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Carbon\Carbon;

class TransactionController extends Controller {
    public function index(Request $request) { 
        if ($request->user()->cannot('viewAny', Transaction::class)) abort(403);
        $query = Transaction::orderBy('date', 'desc');
        if ($request->user()->hasRole('finance_staff')) {
            $query->where('created_by', $request->user()->id);
        }
        return response()->json($query->get()); 
    }
    
    public function summary(\App\Services\FinancialSummaryService $summaryService) {
        return response()->json($summaryService->getSummary());
    }

    public function store(\App\Http\Requests\StoreTransactionRequest $request) { 
        $validated = $request->validated();
        
        $validated['status'] = $validated['status'] ?? 'draft';
        $validated['created_by'] = $request->user() ? $request->user()->id : null;
        
        $transaction = Transaction::create($validated);
        
        AuditLog::create([
            'user' => $request->user()->email,
            'timestamp' => \Carbon\Carbon::now()->toDateTimeString(),
            'action' => 'TRANSACTION_CREATED',
            'description' => 'Transaction ID ' . $transaction->id . ' created as draft'
        ]);

        return response()->json($transaction); 
    }
    
    public function submit($id, Request $request) {
        $t = Transaction::findOrFail($id); 
        if ($request->user()->cannot('submit', $t)) abort(403);
        
        $t->update(['status' => 'pending']); 
        
        AuditLog::create([
            'user' => $request->user()->email,
            'timestamp' => \Carbon\Carbon::now()->toDateTimeString(),
            'action' => 'TRANSACTION_SUBMITTED',
            'description' => 'Transaction ID ' . $t->id . ' submitted for verification'
        ]);

        return response()->json($t);
    }

    public function verify($id, Request $request) {
        $t = Transaction::findOrFail($id); 
        if ($request->user()->cannot('verify', $t)) abort(403);
        
        $isVerified = $request->query('verify') === 'true';
        
        if ($isVerified) {
            // Aturan threshold Rp 50 juta: otomatis disetujui (auto-approve) jika di bawah threshold
            if ($t->amount < 50000000) {
                $status = 'approved';
                $t->update([
                    'status' => $status,
                    'verified_by' => $request->user()->id,
                    'verified_at' => Carbon::now(),
                    'approved_by' => $request->user()->id,
                    'approved_at' => Carbon::now()
                ]);
            } else {
                $status = 'verified'; // Butuh approval manajer
                $t->update([
                    'status' => $status,
                    'verified_by' => $request->user()->id,
                    'verified_at' => Carbon::now()
                ]);
            }
        } else {
            $status = 'rejected';
            $t->update([
                'status' => $status,
                'verified_by' => $request->user()->id,
                'verified_at' => Carbon::now()
            ]);
        }
        
        AuditLog::create([
            'user' => $request->user()->email,
            'timestamp' => \Carbon\Carbon::now()->toDateTimeString(),
            'action' => 'TRANSACTION_' . strtoupper($status),
            'description' => 'Transaction ID ' . $t->id . ' ' . $status . ' by verifier'
        ]);

        return response()->json($t);
    }

    public function approve($id, Request $request) { 
        $t = Transaction::findOrFail($id); 
        if ($request->user()->cannot('approve', $t)) abort(403);
        
        $status = 'approved';
        
        $t->update([
            'status' => $status,
            'approved_by' => $request->user()->id,
            'approved_at' => Carbon::now()
        ]); 
        
        AuditLog::create([
            'user' => $request->user()->email,
            'timestamp' => \Carbon\Carbon::now()->toDateTimeString(),
            'action' => 'TRANSACTION_' . strtoupper($status),
            'description' => 'Transaction ID ' . $t->id . ' ' . $status . ' by approver'
        ]);

        return response()->json($t); 
    }

    public function reject($id, Request $request) {
        $t = Transaction::findOrFail($id); 
        
        // Authorize: hanya manajer atau superadmin
        if ($request->user()->cannot('approve', $t)) abort(403, 'Unauthorized action.');
        
        // Hanya bisa reject yang statusnya 'verified'
        if ($t->status !== 'verified') {
            return response()->json([
                'message' => 'Hanya transaksi berstatus verified yang dapat ditolak.'
            ], 422);
        }

        // Segregation of duties: tidak boleh reject milik sendiri
        if ($t->created_by === $request->user()->id ||
            $t->verified_by === $request->user()->id) {
            return response()->json([
                'message' => 'Tidak dapat menolak transaksi yang Anda buat atau verifikasi sendiri.'
            ], 403);
        }

        $t->update([
            'status' => 'rejected',
            'approved_by' => $request->user()->id,
            'approved_at' => Carbon::now()
        ]); 
        
        AuditLog::create([
            'user' => $request->user()->email,
            'timestamp' => Carbon::now()->toDateTimeString(),
            'action' => 'TRANSACTION_REJECTED',
            'description' => 'Transaction ID ' . $t->id . ' rejected by approver'
        ]);

        return response()->json([
            'message' => 'Transaksi berhasil ditolak.',
            'transaction' => $t->fresh()
        ]);
    }
}
