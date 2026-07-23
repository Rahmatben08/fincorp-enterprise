<?php
namespace App\Http\Controllers;
use App\Models\VendorInvoice;
use Illuminate\Http\Request;
class VendorInvoiceController extends Controller {
public function index() { return response()->json(VendorInvoice::all()); }
public function pay($id) { 
    $v = VendorInvoice::findOrFail($id); 
    if (request()->user()->cannot('update', $v)) {
        abort(403, 'Unauthorized action.');
    }
    $v->update(['status' => 'Lunas']); 
    return response()->json($v); 
}
}
