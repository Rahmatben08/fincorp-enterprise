<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\VendorInvoice;
class VendorInvoiceSeeder extends Seeder {
public function run() {
VendorInvoice::insert([
['vendor'=>'CV Baja Nusantara','invoice_number'=>'VN-26-089','amount'=>'45000000','due_date'=>'2026-07-20','status'=>'Menunggu Pembayaran']
]);
}
}
