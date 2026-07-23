# FinCorp Enterprise Portal - Panduan Setup & Troubleshooting

Proyek ini adalah sistem ERP Finansial Terintegrasi (*FinCorp Enterprise Portal*) yang sebelumnya menggunakan arsitektur *microservices* (Spring Boot, Go, React, Keycloak) dan kini telah **dimigrasi sepenuhnya ke arsitektur Monolitik Laravel 11 + React + Vite + Inertia (SPA)** demi kesederhanaan *deployment*, stabilitas *state*, dan performa yang lebih optimal.

Sistem ini mendukung *Multi-role Access Control* tingkat lanjut (Superadmin, Manajer, Staf Keuangan, Karyawan, Investor) dengan *dashboard* analitik terpisah, sistem persetujuan alur kerja ganda, dan *audit trail* komprehensif.

---

## 🚀 Fitur Utama (Monolith Version)
- **Dashboard Dinamis per Role**: *Superadmin* dengan *Eagle Eye*, *Finance Staff* dengan modul operasional, *Manager* dengan persetujuan bertingkat, dsb.
- **Single Page Application (SPA)**: Navigasi mulus tanpa *reload* halaman menggunakan *React Router* yang terintegrasi di dalam Laravel Blade.
- **Sistem Modular Keuangan**: Modul Kas Bersih, Piutang (AR), Utang (AP), Penggajian (*Payroll*), Jurnal Transaksi, dan Kalkulator Pajak Otomatis.
- **Audit Trail Log**: Rekam jejak aktivitas sistem yang transparan dan *immutable* untuk standar pelaporan perusahaan.
- **Desain Modern & Interaktif**: Menggunakan *Tailwind CSS* dengan warna pastel modern dan *micro-animations*.

---

## 🛑 Persyaratan Sistem
- **PHP** >= 8.2
- **Composer** (untuk dependensi PHP)
- **Node.js** v20+ & **npm** (untuk dependensi Frontend)
- **SQLite / MySQL / PostgreSQL** (dikonfigurasi di file `.env`)

---

## 💻 Cara Menjalankan Secara Lokal (Development)

1. **Persiapan Backend (Laravel)**
   Arahkan terminal Anda ke dalam direktori aplikasi:
   ```bash
   cd fincorp-laravel
   ```
   Instal dependensi Composer dan persiapkan konfigurasi:
   ```bash
   composer install
   cp .env.example .env
   php artisan key:generate
   ```
   Jalankan migrasi dan isi database awal (*seeding*):
   ```bash
   php artisan migrate:fresh --seed
   ```
   Jalankan server PHP lokal:
   ```bash
   php artisan serve
   ```
   *(Server akan berjalan di `http://127.0.0.1:8000`)*

2. **Persiapan Frontend (Vite + React)**
   Buka *tab terminal baru*, masuk ke direktori yang sama, lalu jalankan:
   ```bash
   npm install
   npm run dev
   ```
   *(Vite akan menangani kompilasi React dan HMR di port `5173`)*

3. **Akses Aplikasi**
   Buka browser Anda dan navigasikan ke `http://127.0.0.1:8000/`. Halaman utama dan sistem autentikasi siap digunakan.

---

## 🛠️ Build untuk Production

Untuk membangun aplikasi ini di lingkungan *production* (tanpa *server Vite*), jalankan perintah:
```bash
npm run build
```
Setelah proses kompilasi selesai, Laravel akan menggunakan versi teroptimasi statis dari *React assets*. Anda hanya perlu menjalankan `php artisan serve` atau *deploy* ke Nginx/Apache.

---

## 📋 Struktur Folder Utama
- `/app/Http/Controllers`: Menyimpan seluruh *logic* API untuk berbagai modul.
- `/resources/js`: Menyimpan seluruh kode Frontend (React, Komponen, dan CSS).
  - `/resources/js/components`: Komponen modular *Dashboard* (*SuperadminPanel*, *ReimbursementPanel*, dll).
  - `/resources/js/AppOriginal.tsx`: Pintu masuk utama React Router (*Main Router*).
- `/routes/api.php`: Definisi rute *backend*.
- `/routes/web.php`: Rute *fallback* untuk SPA React.
