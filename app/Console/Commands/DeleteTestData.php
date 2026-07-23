<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:delete-test-data')]
#[Description('Command description')]
class DeleteTestData extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("---- BEFORE DELETION ----");
        $this->info("Reimbursements:");
        $this->line(\App\Models\Reimbursement::where('description', 'like', '%Beli Tiket Pesawat Dinas%')->get()->toJson(JSON_PRETTY_PRINT));
        
        $this->info("Transactions:");
        $this->line(\App\Models\Transaction::where('description', 'like', '%Beli Tiket Pesawat Dinas%')->get()->toJson(JSON_PRETTY_PRINT));

        \App\Models\Reimbursement::where('description', 'like', '%Beli Tiket Pesawat Dinas%')->delete();
        \App\Models\Transaction::where('description', 'like', '%Beli Tiket Pesawat Dinas%')->delete();

        $this->info("---- AFTER DELETION ----");
        $this->info("Reimbursements:");
        $this->line(\App\Models\Reimbursement::where('description', 'like', '%Beli Tiket Pesawat Dinas%')->get()->toJson(JSON_PRETTY_PRINT));
        
        $this->info("Transactions:");
        $this->line(\App\Models\Transaction::where('description', 'like', '%Beli Tiket Pesawat Dinas%')->get()->toJson(JSON_PRETTY_PRINT));
    }
}
