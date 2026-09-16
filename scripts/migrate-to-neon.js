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

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL tidak ditemukan di .env.local!");
    process.exit(1);
  }

  console.log("🔌 Menghubungkan ke Neon PostgreSQL...");
  const sql = neon(databaseUrl);

  const materialsFile = path.join(__dirname, "..", "src", "data", "materials.json");
  const raw = fs.readFileSync(materialsFile, "utf-8");
  const materials = JSON.parse(raw);

  console.log(`📦 Membaca ${materials.length} modul dari materials.json...`);

  for (const item of materials) {
    console.log(`   -> Menyimpan [MODUL ${item.orderNumber}] ${item.title}...`);
    await sql`
      INSERT INTO materials (
        id, slug, order_number, title, subtitle, description, category, level,
        slide_count, estimated_minutes, file_name, blob_url, topics, is_locked, slide1, updated_at
      ) VALUES (
        ${item.id},
        ${item.slug},
        ${item.orderNumber},
        ${item.title},
        ${item.subtitle},
        ${item.description},
        ${item.category},
        ${item.level},
        ${item.slideCount || 6},
        ${item.estimatedMinutes || 20},
        ${item.fileName},
        ${item.blobUrl || null},
        ${JSON.stringify(item.topics || [])}::jsonb,
        ${Boolean(item.isLocked)},
        ${JSON.stringify(item.slide1 || {})}::jsonb,
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        slug = EXCLUDED.slug,
        order_number = EXCLUDED.order_number,
        title = EXCLUDED.title,
        subtitle = EXCLUDED.subtitle,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        level = EXCLUDED.level,
        slide_count = EXCLUDED.slide_count,
        estimated_minutes = EXCLUDED.estimated_minutes,
        file_name = EXCLUDED.file_name,
        topics = EXCLUDED.topics,
        is_locked = EXCLUDED.is_locked,
        slide1 = EXCLUDED.slide1,
        updated_at = NOW()
    `;
  }

  console.log("✅ Migrasi selesai! Memverifikasi total data di Neon...");
  const count = await sql`SELECT count(*)::int as total FROM materials`;
  console.log(`🎉 Total modul tersimpan di Neon PostgreSQL: ${count[0].total}`);
}

migrate().catch((err) => {
  console.error("Gagal melakukan migrasi:", err);
  process.exit(1);
});
