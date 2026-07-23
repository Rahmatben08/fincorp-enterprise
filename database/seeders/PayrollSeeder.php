<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\Payroll;
class PayrollSeeder extends Seeder {
public function run() {
Payroll::insert([
['employee'=>'Budi Santoso','period'=>'Juni 2026','amount'=>'8500000','status'=>'Selesai (Paid)'],
['employee'=>'Siti Aminah','period'=>'Juni 2026','amount'=>'7200000','status'=>'Selesai (Paid)']
]);
}
}
