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

async function initTables() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL tidak ditemukan di .env.local!");
    process.exit(1);
  }

  console.log("🔌 Menghubungkan ke Neon PostgreSQL...");
  const sql = neon(databaseUrl);

  console.log("🛠️ Membuat tabel students...");
  await sql`
    CREATE TABLE IF NOT EXISTS students (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      student_email VARCHAR(255) NOT NULL UNIQUE,
      parent_name VARCHAR(255),
      parent_email VARCHAR(255) NOT NULL,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;

  console.log("🛠️ Membuat tabel submissions...");
  await sql`
    CREATE TABLE IF NOT EXISTS submissions (
      id VARCHAR(64) PRIMARY KEY,
      student_id VARCHAR(64) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      material_slug VARCHAR(128) NOT NULL,
      file_name VARCHAR(255),
      file_url TEXT,
      code_content TEXT,
      language VARCHAR(32) DEFAULT 'python',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;

  console.log("🛠️ Membuat tabel reports...");
  await sql`
    CREATE TABLE IF NOT EXISTS reports (
      id VARCHAR(64) PRIMARY KEY,
      token VARCHAR(128) NOT NULL UNIQUE,
      student_id VARCHAR(64) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      material_slug VARCHAR(128) NOT NULL,
      session_photo_url TEXT,
      teacher_notes TEXT,
      submission_id VARCHAR(64) REFERENCES submissions(id) ON DELETE SET NULL,
      status VARCHAR(32) DEFAULT 'draft',
      sent_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;

  console.log("✅ Sukses! Semua tabel (students, submissions, reports) siap digunakan.");
}

initTables().catch((err) => {
  console.error("❌ Gagal menginisialisasi tabel:", err);
  process.exit(1);
});

