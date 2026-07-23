<?php
namespace App\Http\Controllers;
use App\Models\Invoice;
use Illuminate\Http\Request;
class InvoiceController extends Controller {
public function index() { return response()->json(Invoice::all()); }
public function reminder($id) { return response()->json(['message' => 'Reminder sent']); }

public function markPaid(Request $request, $id) {
    $invoice = Invoice::where('invoice_number', $id)->first();
    if (!$invoice) {
        return response()->json(['message' => 'Invoice not found'], 404);
    }
    
    if ($request->user()->cannot('update', $invoice)) {
        abort(403, 'Unauthorized action.');
    }
    
    $invoice->status = 'Lunas';
    $invoice->save();

    \App\Models\AuditLog::create([
        'timestamp' => now()->toDateTimeString(),
        'user' => $request->user()->name,
        'action' => 'Tandai Lunas',
        'description' => 'Invoice ' . $invoice->invoice_number . ' ditandai lunas oleh ' . $request->user()->name,
    ]);

    return response()->json(['message' => 'Invoice marked as paid']);
}
}
