<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$groups = \App\Models\Payroll::all()->groupBy(function($item) {
    return $item->employeeEmail . '-' . $item->period;
});

foreach ($groups as $group) {
    $duplicates = $group->slice(1);
    foreach ($duplicates as $item) {
        $item->delete();
    }
}

echo json_encode(\App\Models\Payroll::select('payrollId', 'employeeName', 'period', 'netSalary')->get());
