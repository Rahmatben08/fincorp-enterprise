<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\DivisionBudget;
class DivisionBudgetSeeder extends Seeder {
public function run() {
DivisionBudget::insert([
['division'=>'Sipil & Arsitektur','allocated'=>'2500000000','used'=>'1850000000','status'=>'Aman'],
['division'=>'IT & Sistem','allocated'=>'800000000','used'=>'780000000','status'=>'Mendekati Limit']
]);
}
}
