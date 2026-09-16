const { put } = require("@vercel/blob");
const { neon } = require("@neondatabase/serverless");
const fs = require("fs");
const path = require("path");

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error("❌ BLOB_READ_WRITE_TOKEN belum disetel di .env.local!");
    console.log("   Silakan buat Blob store di dashboard Vercel Storage, lalu masukkan token ke .env.local.");
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL tidak ditemukan di .env.local!");
    process.exit(1);
  }

  console.log("🔌 Menghubungkan ke Neon PostgreSQL...");
  const sql = neon(databaseUrl);

  const materialsDir = path.join(__dirname, "..", "public", "materials");
  if (!fs.existsSync(materialsDir)) {
    console.error("❌ Folder public/materials tidak ditemukan!");
    process.exit(1);
  }

  console.log("📦 Mengambil daftar materi dari database Neon...");
  const rows = await sql`SELECT id, title, file_name, blob_url FROM materials ORDER BY order_number ASC`;

  console.log(`🚀 Ditemukan ${rows.length} modul. Memulai unggah ke Vercel Blob...`);

  for (const item of rows) {
    const filePath = path.join(materialsDir, item.file_name);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ File lokal tidak ditemukan untuk ${item.file_name}, dilewati.`);
      continue;
    }

    console.log(`   -> Mengunggah ${item.file_name} (${item.title})...`);
    const fileBuffer = fs.readFileSync(filePath);

    const blob = await put(`materials/${item.file_name}`, fileBuffer, {
      access: "public",
      contentType: "text/html",
      token: token,
    });

    console.log(`      ✅ URL Blob: ${blob.url}`);

    // Update blob_url in Neon DB
    await sql`
      UPDATE materials
      SET blob_url = ${blob.url}, updated_at = NOW()
      WHERE id = ${item.id}
    `;
  }

  console.log("\n🎉 Seluruh file HTML berhasil diunggah ke Vercel Blob dan URL-nya tersimpan di Neon PostgreSQL!");
}

main().catch((err) => {
  console.error("Terjadi kesalahan:", err);
  process.exit(1);
});

