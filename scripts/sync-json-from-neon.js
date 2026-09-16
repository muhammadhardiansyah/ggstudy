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

async function sync() {
  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`SELECT * FROM materials ORDER BY order_number ASC`;

  const materials = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    orderNumber: row.order_number,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    category: row.category,
    level: row.level,
    slideCount: Number(row.slide_count),
    estimatedMinutes: Number(row.estimated_minutes),
    fileName: row.file_name,
    blobUrl: row.blob_url || undefined,
    topics: Array.isArray(row.topics)
      ? row.topics
      : typeof row.topics === "string"
      ? JSON.parse(row.topics)
      : [],
    isLocked: Boolean(row.is_locked),
    slide1: row.slide1
      ? typeof row.slide1 === "string"
        ? JSON.parse(row.slide1)
        : row.slide1
      : undefined,
  }));

  const jsonPath = path.join(__dirname, "..", "src", "data", "materials.json");
  fs.writeFileSync(jsonPath, JSON.stringify(materials, null, 2), "utf-8");
  console.log(`✅ Synced ${materials.length} materials with blobUrl to materials.json`);
}

sync().catch(console.error);

