<?php
namespace App\Http\Controllers;
use App\Models\AuditLog;
use Illuminate\Http\Request;
class AuditLogController extends Controller {
public function index() { return response()->json(AuditLog::orderBy('id', 'desc')->take(50)->get()); }
public function action(Request $request) { return response()->json(AuditLog::create(array_merge($request->all(), ['timestamp' => date('Y-m-d H:i:s'), 'user' => 'admin@exprogio.com']))); }
}
