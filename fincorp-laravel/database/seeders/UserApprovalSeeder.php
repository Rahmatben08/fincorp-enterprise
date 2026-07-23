<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\UserApproval;
class UserApprovalSeeder extends Seeder {
public function run() {
UserApproval::insert([
['email'=>'new.staff@exprogio.com','full_name'=>'Agus Pratama','division'=>'IT','status'=>'Pending']
]);
}
}
