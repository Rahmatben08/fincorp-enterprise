<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\Employee;
class EmployeeSeeder extends Seeder {
public function run() {
Employee::insert([
['name'=>'Budi Santoso','position'=>'Staff Teknik','department'=>'Sipil & Arsitektur','status'=>'Aktif'],
['name'=>'Siti Aminah','position'=>'Akuntan','department'=>'Keuangan','status'=>'Aktif']
]);
}
}
