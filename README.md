# FinCorp Enterprise Portal - Panduan Setup & Troubleshooting

Arsitektur ini didesain menggunakan kontainer Docker untuk mengorkestrasi PostgreSQL database, Keycloak SSO, Java Spring Boot, Go Payroll, dan React Frontend.

---

## 🛑 Mengatasi Error: "'docker-compose' is not recognized"

Jika Anda mendapatkan error saat menjalankan `docker-compose up --build`, hal ini disebabkan karena **Docker Desktop belum terinstal** di sistem Windows Anda, atau lokasinya belum terdaftar di system Environment Variables (PATH).

### Solusi 1: Menggunakan Docker Desktop (Rekomendasi Enterprise)
Untuk menjalankan arsitektur terintegrasi ini seutuhnya:
1. Unduh dan instal **[Docker Desktop untuk Windows](https://www.docker.com/products/docker-desktop/)**.
2. Pastikan Docker Desktop sedang aktif (ikon paus hijau muncul di system tray).
3. Buka PowerShell/CMD baru di folder ini, lalu jalankan perintah Docker modern:
   ```bash
   docker compose up --build
   ```
   *(Catatan: Versi terbaru Docker menggunakan spasi `docker compose` bukan tanda hubung `docker-compose`)*.

---

## 💻 Solusi 2: Menjalankan Frontend React Secara Lokal (Tanpa Docker)
Karena Anda sudah memiliki **Node.js** (v24+) terinstal di Windows Anda, Anda dapat menjalankan dan menguji antarmuka frontend portal secara mandiri:

1. Buka terminal (PowerShell) dan arahkan ke folder frontend:
   ```powershell
   cd C:\Users\ghali\.gemini\antigravity\scratch\fincorp-enterprise\fincorp-frontend
   ```
2. Instal dependensi Node:
   ```powershell
   npm install
   ```
3. Jalankan server pengembangan lokal (Vite):
   ```powershell
   npm run dev
   ```
4. Buka browser pada alamat yang tertera (biasanya `http://localhost:5173`).
   *Catatan: Modul-modul tertentu akan memerlukan autentikasi Keycloak. Jika ingin mencoba fungsionalitas interaktif penuh tanpa login SSO/Keycloak terlebih dahulu, Anda dapat membuka sistem simulasi client-side SPA di folder `fincorp-portal`.*

---

## ☕ Solusi 3: Menjalankan Backend Java Secara Lokal
Jika Anda ingin menjalankan backend Java (Spring Boot) secara lokal tanpa Docker, Anda memerlukan database PostgreSQL lokal:
1. Instal **PostgreSQL** di Windows Anda dan buat database bernama `fincorp_enterprise_db`.
2. Sesuaikan konfigurasi username dan password database pada berkas [application.yml](file:///C:/Users/ghali/.gemini/antigravity/scratch/fincorp-enterprise/fincorp-backend/src/main/resources/application.yml).
3. Buka terminal di folder `fincorp-backend` dan jalankan menggunakan Maven Wrapper (jika Maven terinstal):
   ```powershell
   mvn spring-boot:run
   ```
