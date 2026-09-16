import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function isLocalhostRequest(request: Request): boolean {
  const host = request.headers.get("host") || "";
  return (
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.includes(".local") ||
    host.startsWith("192.168.")
  );
}

function isAuthenticated(): boolean {
  const cookieStore = cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "ggstudy_authenticated_admin_ok";
}

function cleanHtmlForAI(html: string): string {
  // Remove script and style tags and their contents
  let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  // Remove SVGs
  cleaned = cleaned.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, "");
  // Extract text and basic tags
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  // Limit to 15,000 characters
  return cleaned.slice(0, 15000);
}

export async function POST(request: Request) {
  if (!isAuthenticated()) {
    return NextResponse.json(
      { error: "Akses ditolak. Silakan login sebagai admin terlebih dahulu." },
      { status: 401 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY belum disetel di file .env.local" },
      { status: 500 }
    );
  }

  try {
    const { htmlContent, fileName } = await request.json();

    if (!htmlContent || typeof htmlContent !== "string") {
      return NextResponse.json(
        { error: "Konten HTML presentasi diperlukan untuk dianalisis oleh AI." },
        { status: 400 }
      );
    }

    // Auto-detect slides count from html
    const slideMatches = htmlContent.match(/class=["'][^"']*\bslide\b[^"']*["']/gi);
    const detectedSlides = slideMatches && slideMatches.length > 0 ? slideMatches.length : 6;

    const cleanedText = cleanHtmlForAI(htmlContent);

    const systemPrompt = `Kamu adalah kurator materi pemrograman anak dan remaja di platform 'GG Study'.
Analisis isi slide presentasi HTML berikut (nama file: ${fileName || "Presentasi.html"}), lalu hasilkan metadata kurikulum dan desain kartu yang menarik dalam format JSON valid.

Aturan Pemilihan Nilai:
1. "title": Judul materi singkat, menarik, dan ramah anak/pemula (Bahasa Indonesia, 2-5 kata, contoh: "Pabrik Robot Pintar", "Game Tebak Angka", "Detektif Waktu").
2. "subtitle": Subjudul teknis yang menjelaskan konsep pemrograman yang dipelajari (contoh: "Membuat Fungsi Sendiri (def)", "Perulangan Tanpa Henti (While True)", "Mengenal List 2 Dimensi (Grid)").
3. "description": Ringkasan 1-2 kalimat tentang misi atau apa yang akan dibuat/dipelajari siswa.
4. "category": Pilih salah satu yang paling tepat dari:
   - "Fondasi Pemrograman"
   - "Studi Kasus Transaksi"
   - "Interaktivitas & I/O"
   - "Logika & Percabangan"
   - "Perulangan & Looping"
   - "Struktur Data"
5. "level": Pilih salah satu dari: "Pemula", "Menengah", "Lanjut".
6. "estimatedMinutes": Angka durasi belajar wajar (misal 20, 25, atau 30).
7. "topics": Array berisi 3-5 topik kata kunci konsep Python (contoh: ["while loop", "library random", "input user"]).
8. "emoji": Satu emoji ikon paling cocok dan relevan dengan tema presentasi (misal: 🤖, 🍜, 🛡️, 🎮, 💻, 💡, 🐍, ⏱️, 📦, 🚀).
9. "colorPresetIndex": Angka indeks preset warna (0, 1, 2, 3, atau 4) yang paling selaras dengan nuansa materi:
   - 0: Pastel Oranye (Hangat, makanan, simulasi kasir, kantin)
   - 1: Pastel Cyan (Biru muda, robot, sains, futuristik, grid)
   - 2: Pastel Mint (Hijau toska, logika, keamanan, detektif, validasi)
   - 3: Pastel Lavender (Ungu muda, seni, animasi, kreativitas)
   - 4: Pastel Lemon (Kuning muda, algoritma, angka, waktu, energi)
10. "tagText": Label kartu singkat (contoh: "Tantangan Coding: Level Pemula" atau sesuai level).`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\n=== KONTEN HTML PRESENTASI ===\n${cleanedText}`,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData?.error?.message || `Gemini API error status ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const rawAiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawAiText) {
      return NextResponse.json(
        { error: "Gemini AI tidak memberikan respon yang valid." },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(rawAiText);
    parsed.slideCount = parsed.slideCount || detectedSlides;

    return NextResponse.json({
      success: true,
      metadata: parsed,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Gagal menghasilkan metadata via AI" },
      { status: 500 }
    );
  }
}

