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

## Cara Menambahkan & Mengelola Materi Melalui Form Admin (/admin)

Tidak perlu lagi mengedit kode atau JSON secara manual. Anda dapat mengunggah dan mengelola materi langsung melalui portal admin lokal:

1. Jalankan server lokal:
   ```bash
   npm run dev
   ```
2. Buka URL rahasia di browser:
   ```text
   http://localhost:3000/admin
   ```
3. Masuk dengan akun pengajar:
   - **Username**: `admin`
   - **Password**: `admin123`
4. Di dashboard admin, Anda dapat:
   - **Upload File HTML**: Pilih file `.html` presentasi, isi judul, kategori, tingkat kesulitan, dan topik.
   - **Deteksi Otomatis Slide**: Sistem langsung membaca jumlah slide di presentasi Anda.
   - **Kustomisasi Kartu Slide 1**: Pilih preset warna pastel dan emoji dengan pratinjau langsung sebelum disimpan.
   - **Hapus Materi**: Hapus modul lama secara instan (otomatis menghapus entri dan berkas fisik).
5. Setelah menambah atau menghapus materi di komputer lokal, lakukan deploy ke Vercel dengan menjalankan:
   ```bash
   git add .
   git commit -m "update materi"
   git push origin main
   ```
   Website Vercel akan otomatis melakukan auto-deploy!

