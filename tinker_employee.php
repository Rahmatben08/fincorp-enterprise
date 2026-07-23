<?php
echo "Payroll:\n";
echo json_encode(\App\Models\Payroll::limit(1)->get());
echo "\nReimbursement:\n";
echo json_encode(\App\Models\Reimbursement::limit(1)->get());
echo "\nUser:\n";
echo json_encode(\App\Models\User::where('role', 'employee')->first());
