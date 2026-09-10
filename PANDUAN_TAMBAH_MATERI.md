# Panduan Menambahkan Materi Baru ke GG Study

Website **GG Study** dirancang agar Anda dapat menambahkan materi presentasi interaktif baru secara mandiri hanya dalam 3 langkah sederhana, lalu otomatis di-deploy oleh **Vercel** setiap kali Anda melakukan push ke GitHub.

---

## Langkah 1: Simpan File HTML Materi
Simpan file HTML presentasi Anda ke dalam folder:
```text
public/materials/Nama_Materi_Anda.html
```
*(Catatan: Folder `material/` asli di root tetap dapat digunakan sebagai arsip cadangan).*

---

## Langkah 2: Daftarkan Materi di `src/data/materials.ts`
Buka file `src/data/materials.ts`, lalu tambahkan satu blok data materi baru ke dalam array `materials`:

```typescript
{
  id: "nama-slug-unik",             // ID unik huruf kecil dan tanda hubung
  slug: "nama-slug-unik",           // URL browser, misal: /materi/nama-slug-unik
  title: "Judul Presentasi Anda",   // Judul utama yang tampil di kartu
  subtitle: "Sub Judul Singkat",    // Penjelasan level atau fokus materi
  description: "Deskripsi 1-2 kalimat tentang apa yang dipelajari pada materi ini.",
  category: "Dasar Pemrograman",    // Kategori materi
  level: "Pemula",                  // Pilih salah satu: "Pemula" | "Menengah" | "Lanjut"
  slideCount: 6,                    // Jumlah total slide di dalam file HTML
  estimatedMinutes: 20,             // Estimasi waktu belajar dalam menit
  fileName: "Nama_Materi_Anda.html",// Nama file HTML di public/materials/
  topics: [                         // Topik-topik penting (tag)
    "Fungsi (def)",
    "Parameter",
    "Return Value"
  ],
  iconName: "code",                 // Pilih: "robot" | "coffee" | "shield" | "terminal" | "code"
},
```

---

## Langkah 3: Commit dan Push ke GitHub
Buka terminal dan jalankan:
```bash
git add .
git commit -m "Tambah materi baru: Judul Presentasi Anda"
git push origin main
```

**Selesai!** Vercel akan otomatis mendeteksi commit baru, melakukan kompilasi statis (SSG), dan materi baru Anda langsung aktif di website dalam hitungan detik.

---

## Tips Responsif untuk Pembuatan File HTML Slide Baru
Agar materi baru tampil optimal di smartphone dan laptop:
1. Pastikan tag `<meta name="viewport" content="width=device-width, initial-scale=1.0">` ada di dalam `<head>`.
2. Gunakan ukuran font yang fleksibel (`clamp(...)` atau media query `max-width: 768px`).
3. Anda bisa meniru struktur template yang ada di `public/materials/Presentasi_Pabrik_Robot.html` yang sudah dilengkapi dukungan sentuhan layar (swipe) dan komunikasi dua arah dengan portal.

