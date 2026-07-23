<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\EsgMetric;

class EsgMetricSeeder extends Seeder
{
    public function run(): void
    {
        EsgMetric::insert([
            [
                'metric' => 'Total Emisi Karbon (Scope 1 & 2)',
                'value' => '14,500',
                'unit' => 'Ton CO2e',
                'status' => 'Sesuai Target',
                'trend' => 'down'
            ],
            [
                'metric' => 'Rasio Penggunaan Energi Terbarukan',
                'value' => '32.5',
                'unit' => '%',
                'status' => 'Meningkat',
                'trend' => 'up'
            ],
            [
                'metric' => 'Persentase Pekerja Perempuan',
                'value' => '35',
                'unit' => '%',
                'status' => 'Sesuai Target',
                'trend' => 'up'
            ],
            [
                'metric' => 'Skor GCG Internal',
                'value' => '92.5',
                'unit' => 'Poin',
                'status' => 'Sangat Baik',
                'trend' => 'up'
            ]
        ]);
    }
}
