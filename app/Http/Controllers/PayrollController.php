<?php
namespace App\Http\Controllers;
use App\Models\Payroll;
use Illuminate\Http\Request;
class PayrollController extends Controller {
    public function index(Request $request) {
        if ($request->user() && $request->user()->hasRole('employee')) {
            return response()->json(Payroll::where('employeeEmail', $request->user()->email)->orderBy('period', 'desc')->get());
        }
        return response()->json(Payroll::all());
    }
    public function store(Request $request) {
        $payroll = Payroll::updateOrCreate(
            [
                'employeeEmail' => $request->employeeEmail,
                'period' => $request->period
            ],
            $request->all()
        );
        return response()->json($payroll);
    }
public function process(Request $request) { return response()->json(['message' => 'Processed']); }
}
