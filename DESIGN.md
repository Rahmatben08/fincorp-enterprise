# FinCorp Enterprise - Design System & Brand Guidelines

Dokumen ini adalah "Kontrak Brand" yang menjadi acuan tunggal untuk seluruh perancangan antarmuka (UI/UX) di dalam aplikasi FinCorp Enterprise. Setiap komponen, halaman, dan elemen visual **WAJIB** merujuk pada pedoman di bawah ini.

---

## 1. Brand Identity
- **Nama Perusahaan**: PT. Expro Gio Nusantara
- **Tagline**: "Solusi Teknologi Terpadu, Mendukung bisnis Anda dengan IT dan MEP"
- **Fokus Bisnis**: Teknologi Informatika, IoT, AI, Hardware, Elektrikal, dan Pembangunan.
- **Kesan Visual (Mood)**: Profesional, Modern, Clean, Berbasis Data, dan Inovatif.

## 2. Warna (Color Palette)
Diambil dari skema warna situs web resmi perusahaan dipadukan dengan desain *dashboard* modern (pastel tones).

### Warna Brand Utama (Brand Colors)
- **Primary (Hijau Expro)**: `#1A7D47` — Digunakan untuk elemen utama, *sidebar* (jika mode gelap), atau tombol aksi utama (contoh: tombol "Simpan", "Kirim").
- **Secondary (Indigo/Biru)**: `#3949AB` — Digunakan untuk aksen sekunder, *chart*, atau elemen interaktif pilihan.
- **Accent (Hijau Terang)**: `#00A651` — Digunakan *hanya* untuk indikator *success* khusus atau elemen *highlight* (contoh: *badge* "Berhasil", notifikasi sukses, icon di kartu).

### Mode Visual (Light vs Dark Mode)
Aplikasi ini menggunakan **Light Mode (Terang)** sebagai mode _default_ (standar utama) untuk memberikan kesan korporat yang bersih dan profesional. **Dark Mode (Gelap)** tersedia sebagai mode sekunder/alternatif, yang dapat diaktifkan melalui panel pengaturan antarmuka.

### Warna Netral (Background & Text) - LIGHT MODE (DEFAULT)
- **App Background**: `#f8fafc` (Slate 50) — Warna dasar seluruh halaman aplikasi.
- **Card Background**: `#ffffff` (Putih) — Latar belakang *card*, *modal*, dan panel data.
- **Text Primary**: `#1e293b` (Slate 800) — Untuk teks utama (judul, angka metrik).
- **Text Secondary**: `#64748b` (Slate 500) — Untuk label, sub-teks, dan deskripsi tabel.
- **Border/Divider**: `#e2e8f0` (Slate 200) — Garis pemisah tabel dan *border* kartu.

### Warna Netral (Background & Text) - DARK MODE
- **App Background**: `#0f172a` (Slate 900) atau `#070708` — Warna dasar kanvas utama aplikasi.
- **Card Background**: `#1e293b` (Slate 800) dengan opacity/transparansi 50% atau warna solid `#18181b` — Latar belakang *card* dan *modal*.
- **Text Primary**: `#f8fafc` (Slate 50) atau Putih — Untuk teks utama.
- **Text Secondary**: `#94a3b8` (Slate 400) — Untuk label dan sub-teks.
- **Border/Divider**: `#334155` (Slate 700) atau `zinc-800` — Garis pemisah.

### Warna Pastel Metrik & Badge (Semantic Colors)
Terinspirasi dari desain UI 2023 yang berfokus pada kelembutan (pastel) dan kontras teks yang jelas:
- **Success / Pemasukan (Hijau)**: BG `#dcfce7`, Text `#15803d`
- **Warning / Menunggu (Kuning/Oranye)**: BG `#ffedd5`, Text `#c2410c`
- **Danger / Pengeluaran (Merah)**: BG `#fee2e2`, Text `#b91c1c`
- **Info / Pengguna (Biru)**: BG `#e0f2fe`, Text `#0369a1`
- **Analytics / Sistem (Ungu)**: BG `#f3e8ff`, Text `#7e22ce`

## 3. Tipografi
Aplikasi ini menggunakan font **Roboto** (bawaan situs resmi Expro Gio) sebagai font tunggal demi menjaga konsistensi korporat.

- **H1 (Page Title)**: 28px, Font Weight 700 (Bold)
- **H2 (Card Title / Sub-section)**: 18px, Font Weight 600 (SemiBold)
- **Metric Number (Angka Utama)**: 32px, Font Weight 700 (Bold)
- **Body Text**: 14px, Font Weight 400 (Regular)
- **Table Header / Small Label**: 12px, Font Weight 500 (Medium), *Uppercase*, Letter Spacing 0.05em.

## 4. Spacing (Sistem Jarak)
Menggunakan kelipatan 4px dan 8px untuk ritme vertikal dan horizontal yang konsisten:
- **4px** (xs) — Jarak antar ikon dan teks.
- **8px** (sm) — Jarak antar elemen dalam satu grup (misal: label dan input).
- **16px** (md) — Jarak *padding* internal standar (tombol besar, *badge*).
- **24px** (lg) — Jarak antar kartu (*gap* pada *grid*) dan *padding* dalam kartu utama.
- **32px** (xl) — Jarak antar *section* besar.

## 5. Layout & Struktur Bentuk
- **Border Radius**:
  - *Metric Cards* & *Charts*: `20px` (Lebih melengkung agar terlihat sangat modern)
  - *Table Cards* & *Modals*: `16px`
  - Tombol & *Input Field*: `8px`
  - *Badge* Status: `9999px` (Pill / Bulat penuh)
- **Drop Shadows (Bayangan)**:
  - *Card Standard*: `0 4px 15px rgba(0, 0, 0, 0.03)` (Sangat tipis dan membaur)
  - *Card Hover/Interactive*: `0 10px 25px rgba(0, 0, 0, 0.08)`
  - *Dropdown/Modal*: `0 20px 40px rgba(0, 0, 0, 0.1)`

## 6. Komponen Standar
1. **Metric Card (Kartu Statistik)**:
   - *Background* bisa putih murni atau *full pastel*.
   - Wajib menampilkan 1 ikon (dengan latar belakang bulat), Angka besar, Judul metrik, dan Tren Persentase (+/- % dengan panah) di bagian bawah.
2. **Data Table**:
   - Header tabel berwarna abu-abu muda (`#f8fafc`).
   - Baris tabel dipisah dengan garis tipis (`border-b border-slate-200`).
   - Tidak ada garis vertikal pemisah kolom (*clean look*).
3. **Tombol**:
   - *Primary*: Background `#1A7D47`, Text Putih, tanpa *border*.
   - *Secondary*: Background Transparan, Border `#e2e8f0`, Text `#1e293b`.
4. **Status Badges**:
   - Selalu berbentuk *pill* (`rounded-full`), dengan warna *background pastel* dan warna teks pekat (merujuk pada *Semantic Colors*).

## 7. Ikonografi
- Menggunakan pustaka **Lucide React**.
- Gaya konsisten: *Outline* dengan ketebalan garis (stroke width) `2px` atau `1.5px`.
- Ukuran standar: `20px` (untuk tombol/tabel), `24px` atau `32px` (untuk kartu metrik utama).

## 8. Motion & Interaksi
- **Durasi Standar**: Transisi CSS menggunakan `duration-200` atau `duration-300` (200ms - 300ms) dengan tipe `ease-in-out`.
- **Hover Effect**:
  - Tombol: Berubah warna sedikit lebih gelap.
  - Kartu Interaktif: Terangkat ke atas (`translate-y-[-4px]`) dan bayangan membesar (`shadow-lg`).

## 9. Anti-Pola (WAJIB DIHINDARI)
1. **JANGAN** menggunakan warna primer murni HTML (misal: `#FF0000`, `#00FF00`, `#0000FF`). Selalu gunakan warna *tailored/muted* dari palet.
2. **JANGAN** menggunakan HURUF KAPITAL SEMUA (ALL CAPS) pada kalimat panjang atau tombol. Gunakan hanya pada singkatan atau *Header* Tabel berukuran kecil.
3. **JANGAN** menggunakan *border* hitam pekat atau *border* tebal. Pisahkan elemen dengan *white space* (jarak) atau bayangan sangat tipis, bukan kotak kaku bersudut tajam.
4. **JANGAN** mendesain dengan informasi yang saling berdesakan (padat). Ruang kosong (*white space*) adalah bagian dari desain premium; pertahankan *padding* minimal `24px`.
5. **JANGAN** menambahkan rincian palsu/data *dummy* jika data tidak disediakan oleh backend. Desain harus beradaptasi dengan *raw data* yang sesungguhnya.
