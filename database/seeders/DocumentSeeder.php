<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Document;

class DocumentSeeder extends Seeder
{
    public function run(): void
    {
        Document::insert([
            [
                'title' => 'Laporan Tahunan 2025',
                'publishDate' => '15 Jan 2026',
                'type' => 'pdf'
            ],
            [
                'title' => 'Prospektus Emisi Obligasi Seri A',
                'publishDate' => '10 Feb 2026',
                'type' => 'pdf'
            ],
            [
                'title' => 'Laporan Keberlanjutan 2025 (ESG Report)',
                'publishDate' => '20 Feb 2026',
                'type' => 'pdf'
            ],
            [
                'title' => 'Materi Paparan Publik Q1 2026',
                'publishDate' => '05 Apr 2026',
                'type' => 'pdf'
            ],
        ]);
    }
}
