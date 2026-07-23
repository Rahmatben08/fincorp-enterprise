<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\Invoice;
class InvoiceSeeder extends Seeder {
public function run() {
Invoice::insert([
['invoice_number'=>'INV-2026-001','client'=>'PT Pembangunan Jaya','amount'=>'150000000','due_date'=>'2026-07-15','status'=>'Menunggu Pembayaran'],
['invoice_number'=>'INV-2026-002','client'=>'Dinas Pekerjaan Umum','amount'=>'325000000','due_date'=>'2026-06-30','status'=>'Jatuh Tempo']
]);
}
}
