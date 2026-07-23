<?php

if (!function_exists('formatRupiah')) {
    function formatRupiah($angka) {
        $num = (float) $angka;
        if (abs($num) >= 1e12) {
            return 'Rp ' . number_format($num / 1e12, 1, ',', '.') . ' Triliun';
        }
        if (abs($num) >= 1e9) {
            return 'Rp ' . number_format($num / 1e9, 1, ',', '.') . ' Miliar';
        }
        if (abs($num) >= 1e6) {
            return 'Rp ' . number_format($num / 1e6, 1, ',', '.') . ' Juta';
        }
        return 'Rp ' . number_format($num, 0, ',', '.');
    }
}
