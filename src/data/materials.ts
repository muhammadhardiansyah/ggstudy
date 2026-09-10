import { MaterialItem } from "@/types/material";

export const materials: MaterialItem[] = [
  {
    id: "pabrik-robot",
    slug: "pabrik-robot",
    orderNumber: "01",
    title: "Pabrik Robot Pintar",
    subtitle: "Membuat Fungsi Sendiri (Custom Function)",
    description: "Mempelajari konsep dasar fungsi (def), analogi mesin input-proses-output, return value, dan latihan kode rumpang.",
    category: "Fondasi Pemrograman",
    level: "Pemula",
    slideCount: 6,
    estimatedMinutes: 20,
    fileName: "Presentasi_Pabrik_Robot.html",
    topics: ["Definisi Fungsi (def)", "Parameter Mesin", "Return Value", "Latihan Rumpang"],
    slide1: {
      emoji: "🤖",
      bgGradient: "linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)",
      borderColor: "#4dd0e1",
      titleColor: "#00838f",
      subtitleColor: "#006064",
      tagColor: "#ff8f00",
      tagText: "Belajar Kode Rumpang (Fill-in-the-blanks)",
    },
  },
  {
    id: "kasir-kantin",
    slug: "kasir-kantin",
    orderNumber: "02",
    title: "Sistem Kasir Kantin",
    subtitle: "Fungsi Python dengan Banyak Parameter",
    description: "Menerapkan fungsi modular untuk simulasi transaksi kasir dengan parameter menu, jumlah pesanan, dan kalkulasi total harga.",
    category: "Studi Kasus Transaksi",
    level: "Menengah",
    slideCount: 6,
    estimatedMinutes: 25,
    fileName: "Presentasi_Kasir_Kantin.html",
    topics: ["Multi Parameter", "Perhitungan Tagihan", "Modul Kantin", "Studi Kasus"],
    slide1: {
      emoji: "🍜",
      bgGradient: "linear-gradient(135deg, #fdfbf7 0%, #ffe8d6 100%)",
      borderColor: "#d4a373",
      titleColor: "#cc8b56",
      subtitleColor: "#a98467",
      tagColor: "#ef233c",
      tagText: "Tantangan Coding: Level Menengah",
    },
  },
  {
    id: "logika-kasir",
    slug: "logika-kasir",
    orderNumber: "03",
    title: "Sistem Kasir Anti-Rugi",
    subtitle: "Logika Percabangan (If, Elif, Else)",
    description: "Membangun sistem pencegah kerugian kasir: validasi uang pembeli, perhitungan diskon otomatis, dan penanganan kondisi error.",
    category: "Studi Kasus Transaksi",
    level: "Lanjut",
    slideCount: 7,
    estimatedMinutes: 30,
    fileName: "Presentasi_Logika_Kasir.html",
    topics: ["If-Elif-Else", "Validasi Nominal", "Diskon Belanja", "Logika Anti-Minus"],
    slide1: {
      emoji: "🛡️",
      bgGradient: "linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)",
      borderColor: "#5eead4",
      titleColor: "#0f766e",
      subtitleColor: "#115e59",
      tagColor: "#ef4444",
      tagText: "Tantangan Coding: Level Boss",
    },
  },
  {
    id: "kasir-interaktif",
    slug: "kasir-interaktif",
    orderNumber: "04",
    title: "Sistem Kasir Interaktif",
    subtitle: "Menggabungkan Fungsi (def) dengan Input User",
    description: "Menggabungkan fungsi logika dengan interaksi langsung pengguna via terminal (input dinamis, konversi tipe data int/str).",
    category: "Interaktivitas & I/O",
    level: "Lanjut",
    slideCount: 7,
    estimatedMinutes: 30,
    fileName: "Presentasi_Kasir_Interaktif.html",
    topics: ["Dynamic input()", "Type Casting int()", "Interaksi Terminal", "Simulasi Nyata"],
    slide1: {
      emoji: "🗣️",
      bgGradient: "linear-gradient(135deg, #fdfbf7 0%, #ffe8d6 100%)",
      borderColor: "#d4a373",
      titleColor: "#cc8b56",
      subtitleColor: "#a98467",
      tagColor: "#ef233c",
      tagText: "Tantangan Coding: Level Lanjut (Advanced)",
    },
  },
];

export function getMaterialBySlug(slug: string): MaterialItem | undefined {
  return materials.find((item) => item.slug === slug);
}

export function getAllCategories(): string[] {
  const cats = Array.from(new Set(materials.map((m) => m.category)));
  return cats;
}
