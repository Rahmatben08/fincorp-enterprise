# Panduan Deployment FinCorp Enterprise

Dokumen ini berisi panduan ringkas untuk melakukan deployment (hosting) aplikasi FinCorp Enterprise ke server produksi.

## Pendekatan Deployment
Sistem ini menggunakan arsitektur Laravel (Backend) dan React via Vite (Frontend). Seluruh *source code* React telah dikompilasi secara penuh ke dalam folder `public/build/`. 
Oleh karena itu, **server Anda tidak wajib menginstal Node.js atau menjalankan `npm run build` lagi di sisi server**.

## Prasyarat Server
- PHP >= 8.2
- Ekstensi PHP: BCMath, Ctype, Fileinfo, JSON, Mbstring, OpenSSL, PDO, Tokenizer, XML (umum di cPanel/VPS)
- Composer (untuk menginstal pustaka backend)
- Database (MySQL / PostgreSQL / SQLite sesuai konfigurasi)
- Web Server (Apache / Nginx)

## Langkah Deployment
1. **Unggah File ke Server**
   - Unggah seluruh folder `fincorp-laravel` ke direktori server Anda (misal: `/var/www/fincorp` atau `public_html` jika shared hosting).
   - **TIDAK PERLU** mengunggah folder `node_modules/`.

2. **Konfigurasi Environment (.env)**
   - Salin `.env.example` menjadi `.env`.
   - Buka `.env` dan atur variabel koneksi database:
     ```env
     DB_CONNECTION=mysql (atau pgsql/sqlite)
     DB_HOST=127.0.0.1
     DB_PORT=3306
     DB_DATABASE=nama_database_anda
     DB_USERNAME=user_db
     DB_PASSWORD=password_db
     ```
   - Sesuaikan `APP_URL` dengan domain Anda (misal: `APP_URL=https://fincorp.exprogio.com`).

3. **Instalasi Dependensi Backend**
   - Jalankan perintah berikut di terminal server Anda:
     ```bash
     composer install --optimize-autoloader --no-dev
     ```

4. **Kunci Enkripsi dan Database**
   - Buat kunci enkripsi aplikasi:
     ```bash
     php artisan key:generate
     ```
   - Migrasikan skema database dan masukkan role awal (Spatie):
     ```bash
     php artisan migrate --seed
     ```
     *(Catatan: Jangan gunakan `migrate:fresh` di server produksi karena akan menghapus data lama)*.

5. **Optimasi Cache Laravel (Sangat Disarankan)**
   - Jalankan perintah optimasi untuk mempercepat loading:
     ```bash
     php artisan config:cache
     php artisan route:cache
     php artisan view:cache
     ```

6. **Pengaturan Storage (Penting)**
   - Tautkan folder *storage* ke folder *public* agar file/gambar publik bisa diakses:
     ```bash
     php artisan storage:link
     ```

7. **Konfigurasi Web Server (Virtual Host)**
   - Pastikan *Document Root* Nginx atau Apache Anda menunjuk ke folder `/public/`.
   - Contoh konfigurasi Nginx:
     ```nginx
     server {
         listen 80;
         server_name fincorp.domain.com;
         root /var/www/fincorp/public;

         index index.php index.html index.htm;

         location / {
             try_files $uri $uri/ /index.php?$query_string;
         }

         # Konfigurasi PHP FPM...
     }
     ```

## Selesai
Setelah langkah-langkah di atas dijalankan, aplikasi siap diakses dari domain produksi Anda. Tidak perlu menjalankan daemon frontend (`npm run dev`) karena file statis HTML/JS/CSS secara otomatis ditangani oleh direktori `/public/build/` yang telah di-bundle.
