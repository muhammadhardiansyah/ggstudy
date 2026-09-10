# GG Study — Portal Belajar Python Interaktif

Portal web interaktif untuk menampilkan materi presentasi pemrograman Python (fungsi, parameter, if-else, input interaktif) dengan latihan kode rumpang (*fill-in-the-blanks*) dan simulasi kasir serta pabrik robot.

Dibangun dengan **Next.js (App Router)**, **TypeScript**, dan **Tailwind CSS**, dioptimalkan untuk hosting di **Vercel** dan responsif di seluruh perangkat (smartphone, tablet, maupun laptop/proyektor).

---

## Modul Pembelajaran Saat Ini

1. **MODUL 01 — Pabrik Robot Pintar** (*Pemula*)
   - Konsep dasar fungsi (`def`), parameter, analogi input-proses-output, return value, dan latihan kode rumpang.
2. **MODUL 02 — Sistem Kasir Kantin** (*Menengah*)
   - Fungsi Python dengan multi-parameter, simulasi perhitungan total belanja dan uang kembalian.
3. **MODUL 03 — Sistem Kasir Anti-Rugi** (*Lanjut*)
   - Logika percabangan (`if`, `elif`, `else`), sistem validasi nominal uang, dan kalkulasi diskon otomatis.
4. **MODUL 04 — Sistem Kasir Interaktif** (*Lanjut*)
   - Menggabungkan fungsi koding dengan interaksi input user (`input()`), konversi tipe data (`int()`), dan simulasi terminal nyata.

---

## Cara Menjalankan di Komputer Lokal

1. **Clone repositori**:
   ```bash
   git clone https://github.com/muhammadhardiansyah/ggstudy.git
   cd ggstudy
   ```
2. **Install dependensi**:
   ```bash
   npm install
   ```
3. **Jalankan server development**:
   ```bash
   npm run dev
   ```
4. Buka browser di `http://localhost:3000`.

---

## Cara Menambahkan Materi Baru

1. Letakkan file presentasi HTML baru Anda di dalam folder:
   ```text
   public/materials/Nama_Materi_Baru.html
   ```
2. Buka `src/data/materials.ts` dan tambahkan satu entri objek baru ke dalam array `materials`:
   ```typescript
   {
     id: "slug-unik",
     slug: "slug-unik",
     orderNumber: "05",
     title: "Judul Materi Anda",
     subtitle: "Sub Judul Singkat",
     description: "Deskripsi singkat mengenai topik materi.",
     category: "Kategori Materi",
     level: "Pemula", // "Pemula" | "Menengah" | "Lanjut"
     slideCount: 6,
     estimatedMinutes: 20,
     fileName: "Nama_Materi_Baru.html",
     topics: ["Topik 1", "Topik 2"],
     slide1: {
       emoji: "🚀",
       bgGradient: "linear-gradient(135deg, #fdfbf7 0%, #ffe8d6 100%)",
       borderColor: "#d4a373",
       titleColor: "#cc8b56",
       subtitleColor: "#a98467",
       tagColor: "#ef233c",
       tagText: "Tantangan Coding Baru",
     },
   }
   ```
3. Commit dan push ke GitHub:
   ```bash
   git add .
   git commit -m "feat: Tambah materi baru"
   git push origin main
   ```
   Vercel akan secara otomatis memperbarui website dalam beberapa detik!
