<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\Transaction;
class TransactionSeeder extends Seeder {
    public function run() {
        Transaction::insert([
            ['date'=>'2026-06-01', 'description'=>'Pembayaran Material Proyek A', 'type'=>'expense', 'amount'=>75000000.00, 'status'=>'pending'],
            ['date'=>'2026-06-03', 'description'=>'Penerimaan Termin 1 Proyek B', 'type'=>'income', 'amount'=>150000000.00, 'status'=>'approved'],
            ['date'=>'2026-06-05', 'description'=>'Biaya Operasional Kantor', 'type'=>'expense', 'amount'=>25000000.00, 'status'=>'approved'],
            ['date'=>'2026-07-01', 'description'=>'Penerimaan Layanan Konsultasi', 'type'=>'income', 'amount'=>50000000.00, 'status'=>'approved']
        ]);
    }
}
