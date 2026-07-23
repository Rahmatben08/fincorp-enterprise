<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\AuditLog;
class AuditLogSeeder extends Seeder {
public function run() {
AuditLog::insert([
['timestamp'=>'2026-06-10 09:15:00','user'=>'admin@exprogio.com','action'=>'APPROVE_TRANSACTION','description'=>'Admin menyetujui pengeluaran material 75 Juta']
]);
}
}
