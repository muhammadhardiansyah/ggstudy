# Rencana Implementasi: Portal Web Materi Pembelajaran (Vercel & Node.js Ready)

Dokumen ini adalah proposal teknis dan panduan implementasi untuk membuat website portal pembelajaran interaktif yang menampilkan seluruh materi dari folder [`material/`](./material) dan siap di-deploy langsung ke **Vercel**.

---

## 1. Ringkasan & Tujuan Proyek

- **Tujuan Utama**: Membangun web portal modern, cepat, dan responsif untuk menampilkan materi presentasi interaktif Python yang sudah dibuat di folder `material/`.
- **Target Hosting**: **Vercel** (menggunakan ekosistem **Node.js** modern).
- **Format Konten Saat Ini**: File-file materi berupa HTML mandiri (*standalone*) dengan styling slide presentasi, animasi transisi, blok kode sintaks Python, dan latihan interaktif:
  1. `Presentasi_Pabrik_Robot.html`: Pengenalan Fungsi (`def`) dasar.
  2. `Presentasi_Kasir_Kantin.html`: Fungsi dengan Banyak Parameter (Level Menengah).
  3. `Presentasi_Logika_Kasir.html`: Logika Percabangan & Diskon (Level Lanjut).
  4. `Presentasi_Kasir_Interaktif.html`: Menggabungkan Fungsi dengan Input Dinamis (Level Lanjut).

---

## 2. Pemilihan Teknologi (Tech Stack)

Untuk menjamin kompatibilitas 100% dengan Vercel, performa maksimal, dan kemudahan perawatan:

| Komponen | Pilihan Rekomendasi | Alasan & Keunggulan |
| :--- | :--- | :--- |
| **Framework** | **Next.js 14+ (App Router)** | Framework resmi Vercel. Tidak butuh konfigurasi server rumit (*zero-config*), *build* otomatis, dan dukungan *Static Site Generation* (SSG). |
| **Runtime** | **Node.js 18+ / 20+** | Versi LTS standar yang didukung penuh oleh Vercel runtime. |
| **Styling** | **Tailwind CSS** | Ringan, utility-first, performa tinggi, dan mudah disesuaikan untuk tampilan mobile hingga layar desktop proyektor. |
| **Bahasa** | **TypeScript** | Memastikan tipe data materi, route, dan komponen aman dari bug saat kompilasi di Vercel. |
| **Ikon UI** | **Lucide React** | Ikon vektor modern, ringan, dan tree-shakeable (hanya memuat ikon yang dipakai). |

---

## 3. Arsitektur & Struktur Direktori

Struktur proyek yang direncanakan:

```text
gege-study/
├── material/                         # Sumber file materi asli (tetap dipertahankan)
│   ├── Presentasi_Pabrik_Robot.html
│   ├── Presentasi_Kasir_Kantin.html
│   ├── Presentasi_Logika_Kasir.html
│   └── Presentasi_Kasir_Interaktif.html
│
├── public/
│   ├── materials/                    # Salinan materi HTML untuk static serving di Vercel
│   └── favicon.ico
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Layout utama, metadata SEO, font
│   │   ├── page.tsx                  # Halaman Utama / Katalog Modul (Dashboard)
│   │   └── materi/
│   │       └── [slug]/
│   │           └── page.tsx          # Halaman Viewer Interaktif per materi
│   │
│   ├── components/
│   │   ├── Navbar.tsx                # Header navigasi & logo portal
│   │   ├── MaterialCard.tsx          # Kartu modul belajar (level, judul, deskripsi, durasi)
│   │   ├── SlideViewer.tsx           # Komponen player materi (fullscreen, iframe wrapper, kontrol)
│   │   ├── SearchFilter.tsx          # Pencarian & filter tingkat kesulitan
│   │   └── Footer.tsx                # Footer website
│   │
│   └── data/
│       └── materials.ts              # Registry & metadata tiap materi (judul, slug, level, deskripsi, tags)
│
├── package.json                      # Dependensi Node.js & skrip build
├── tailwind.config.ts                # Konfigurasi styling Tailwind
├── tsconfig.json                     # Konfigurasi TypeScript
└── vercel.json                       # Konfigurasi opsional headers / caching Vercel
```

---

## 4. Rencana Fitur Website

### A. Halaman Beranda / Katalog Materi (Dashboard)
- **Header & Branding**: Nama portal pembelajaran (misal: *GeGe Study* / *Python Learning Lab*), navigasi sederhana.
- **Pencarian & Filter Cepat**:
  - Filter berdasarkan level: *Semua*, *Pemula (Beginner)*, *Menengah (Intermediate)*, *Lanjut (Advanced)*.
  - Filter pencarian teks instan (mencari judul / topik materi).
- **Kartu Materi (Cards)**:
  - Badge tingkat kesulitan dengan warna yang kontras & jelas.
  - Judul modul dan ringkasan isi materi.
  - Jumlah slide & estimasi waktu belajar.
  - Tombol CTA: *"Buka Materi"* atau *"Presentasikan"*.

### B. Halaman Viewer Materi Interaktif
- **Integrasi Materi Aman**: Menampilkan materi HTML di dalam kontainer responsif berkecepatan tinggi tanpa merusak script logika atau CSS yang sudah ada di file aslinya.
- **Toolbar Kontrol Presenter**:
  - Tombol kembali ke katalog modul.
  - Indikator materi yang sedang aktif.
  - Tombol **Mode Layar Penuh (Fullscreen Mode)** untuk kenyamanan mengajar di kelas atau proyektor.
  - Tombol **Buka di Tab Baru** (akses langsung file HTML murni).
- **Responsivitas**: Penyesuaian viewport otomatis agar nyaman dibuka di tablet maupun smartphone.

---

## 5. Kepatuhan Standar Kualitas (Antislop & UX)

Sesuai panduan kualitas proyek:
1. **Desain Terarah & Berkarakter**: Tidak menggunakan layout template generik yang membosankan. Pemilihan warna tema yang hangat, profesional, serta fokus pada keterbacaan teks kode Python.
2. **Aksesibilitas & Kontras (Human-friendly)**: Memastikan teks materi dan kode memiliki kontras warna yang memenuhi standar WCAG (mudah dibaca, tidak menyilaukan mata).
3. **Mobile-First Layout**: Menu dan kartu materi dapat menyesuaikan ukuran layar tanpa teks terpotong (*no overflow horizontal*).
4. **Kebersihan Kode**: Menjaga kode bersih dari komentar berulang yang tidak perlu (*antislop-code*).

---

## 6. Strategi Deployment ke Vercel

1. **Build Step Vercel**:
   - Vercel akan secara otomatis mendeteksi Next.js melalui file `package.json`.
   - Perintah build standar: `next build` (menghasilkan halaman statis yang siap didistribusikan ke Vercel Edge Network).
2. **Routing Statis**:
   - Seluruh file materi di `public/materials/` dapat diakses langsung oleh browser tanpa beban pemrosesan server.
3. **Konfigurasi Caching**:
   - Aset statis dan materi HTML diberikan header cache optimal agar akses siswa/pengguna sangat cepat.

---

## 7. Rencana Pengujian (Verification Plan)

### A. Pengujian Otomatis (Build Check)
- Jalankan `npm run build` untuk memvalidasi tidak ada error TypeScript atau kegagalan kompilasi Next.js.
- Jalankan `npm run lint` untuk menjamin konsistensi sintaksis.

### B. Pengujian Manual
1. **Navigasi & Routing**: Uji pembukaan setiap materi (`/materi/pabrik-robot`, `/materi/kasir-kantin`, dsb.).
2. **Fungsionalitas Slide**: Pastikan tombol Next/Prev di dalam slide, interaksi pengisian kode, dan tombol kembali berfungsi 100%.
3. **Uji Responsif**: Cek tampilan pada breakpoint desktop (1920x1080, 1366x768), tablet (iPad), dan mobile (iPhone/Android).
4. **Uji Fullscreen**: Pastikan fitur fullscreen dapat masuk dan keluar dengan tombol ESC atau tombol UI.

---

## 8. Pertanyaan Terbuka & Topik Diskusi

Silakan berikan tanggapan untuk poin-poin berikut sebelum implementasi dimulai:

1. **Aturan Antislop**: Kapan Anda ingin aturan antislop diterapkan?
   - **Opsi 1**: **SELAMA (DURING)** pengerjaan (aturan desain & kode langsung diterapkan sejak awal baris kode dibuat).
   - **Opsi 2**: **SETELAH (AFTER)** pengerjaan (dibuatkan laporan audit bernomor setelah website selesai, lalu diperbaiki bersama).
2. **Nama & Branding Portal**: Apakah ada nama khusus yang ingin digunakan di header website (misalnya *"GeGe Study"*, *"Python Interactive Slides"*, atau nama lain)?
3. **Apakah Anda setuju menggunakan Next.js (App Router + Tailwind CSS)** sebagai fondasi teknologinya?

