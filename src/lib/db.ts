import { neon } from "@neondatabase/serverless";
import { MaterialItem } from "@/types/material";
import { Student, Submission, Report } from "@/types/student";
import rawMaterialsFallback from "@/data/materials.json";
import fs from "fs/promises";
import path from "path";

function getMaterialsJsonPath(): string {
  return path.join(process.cwd(), "src", "data", "materials.json");
}

export function getDbClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return null;
  }
  try {
    return neon(databaseUrl);
  } catch (err) {
    console.error("Gagal menginisialisasi Neon DB client:", err);
    return null;
  }
}

// Map PostgreSQL row (snake_case) to MaterialItem (camelCase)
export function mapRowToMaterial(row: any): MaterialItem {
  return {
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
  };
}

// Fallback: Read from local JSON
export async function getMaterialsFromLocalJson(): Promise<MaterialItem[]> {
  try {
    const raw = await fs.readFile(getMaterialsJsonPath(), "utf-8");
    return JSON.parse(raw);
  } catch {
    return rawMaterialsFallback as MaterialItem[];
  }
}

// Fallback: Save to local JSON (keeps local cache synced)
export async function saveMaterialsToLocalJson(items: MaterialItem[]): Promise<void> {
  try {
    await fs.writeFile(getMaterialsJsonPath(), JSON.stringify(items, null, 2), "utf-8");
  } catch (err) {
    console.error("Gagal menyimpan ke materials.json:", err);
  }
}

// 1. Get all materials (ordered by order_number)
export async function getAllMaterials(): Promise<MaterialItem[]> {
  const sql = getDbClient();
  if (!sql) {
    return getMaterialsFromLocalJson();
  }

  try {
    const rows = await sql`
      SELECT id, slug, order_number, title, subtitle, description, category, level,
             slide_count, estimated_minutes, file_name, blob_url, topics, is_locked, slide1
      FROM materials
      ORDER BY order_number ASC, created_at ASC
    `;

    if (!rows || rows.length === 0) {
      // If DB is currently empty, return fallback
      return getMaterialsFromLocalJson();
    }

    return rows.map(mapRowToMaterial);
  } catch (err) {
    console.error("Error mengambil data materi dari Neon DB, menggunakan fallback JSON:", err);
    return getMaterialsFromLocalJson();
  }
}

// 2. Get single material by slug
export async function getMaterialBySlug(slug: string): Promise<MaterialItem | null> {
  const sql = getDbClient();
  if (!sql) {
    const local = await getMaterialsFromLocalJson();
    return local.find((m) => m.slug === slug) || null;
  }

  try {
    const rows = await sql`
      SELECT id, slug, order_number, title, subtitle, description, category, level,
             slide_count, estimated_minutes, file_name, blob_url, topics, is_locked, slide1
      FROM materials
      WHERE slug = ${slug}
      LIMIT 1
    `;

    if (rows && rows.length > 0) {
      return mapRowToMaterial(rows[0]);
    }

    // Fallback search
    const local = await getMaterialsFromLocalJson();
    return local.find((m) => m.slug === slug) || null;
  } catch (err) {
    console.error("Error mengambil materi slug dari Neon DB:", err);
    const local = await getMaterialsFromLocalJson();
    return local.find((m) => m.slug === slug) || null;
  }
}

// 3. Insert or update material
export async function upsertMaterial(item: MaterialItem): Promise<void> {
  const sql = getDbClient();
  if (sql) {
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
        ${item.slideCount},
        ${item.estimatedMinutes},
        ${item.fileName},
        ${item.blobUrl || null},
        ${JSON.stringify(item.topics)}::jsonb,
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
        blob_url = COALESCE(EXCLUDED.blob_url, materials.blob_url),
        topics = EXCLUDED.topics,
        is_locked = EXCLUDED.is_locked,
        slide1 = EXCLUDED.slide1,
        updated_at = NOW()
    `;
  }

  // Also keep local JSON in sync
  const localList = await getMaterialsFromLocalJson();
  const existingIdx = localList.findIndex((m) => m.id === item.id || m.slug === item.slug);
  if (existingIdx >= 0) {
    localList[existingIdx] = item;
  } else {
    localList.push(item);
  }
  await saveMaterialsToLocalJson(localList);
}

// 3b. Update material data
export async function updateMaterial(
  id: string,
  updatedItem: Partial<MaterialItem>
): Promise<MaterialItem | null> {
  const current = await getMaterialBySlug(id);
  const localList = await getMaterialsFromLocalJson();
  const currentItem = current || localList.find((m) => m.id === id || m.slug === id);

  if (!currentItem) {
    return null;
  }

  const mergedItem: MaterialItem = {
    ...currentItem,
    ...updatedItem,
    id: currentItem.id,
    orderNumber: updatedItem.orderNumber || currentItem.orderNumber,
    slug: updatedItem.slug || currentItem.slug,
    title: updatedItem.title ?? currentItem.title,
    subtitle: updatedItem.subtitle ?? currentItem.subtitle,
    description: updatedItem.description ?? currentItem.description,
    category: updatedItem.category ?? currentItem.category,
    level: updatedItem.level ?? currentItem.level,
    slideCount: updatedItem.slideCount ?? currentItem.slideCount,
    estimatedMinutes: updatedItem.estimatedMinutes ?? currentItem.estimatedMinutes,
    fileName: updatedItem.fileName ?? currentItem.fileName,
    blobUrl: updatedItem.blobUrl !== undefined ? updatedItem.blobUrl : currentItem.blobUrl,
    topics: updatedItem.topics ?? currentItem.topics,
    isLocked: updatedItem.isLocked !== undefined ? Boolean(updatedItem.isLocked) : currentItem.isLocked,
    slide1: updatedItem.slide1 ? { ...currentItem.slide1, ...updatedItem.slide1 } : currentItem.slide1,
  };

  const sql = getDbClient();
  let result: MaterialItem | null = null;

  if (sql) {
    const rows = await sql`
      UPDATE materials SET
        slug = ${mergedItem.slug},
        order_number = ${mergedItem.orderNumber},
        title = ${mergedItem.title},
        subtitle = ${mergedItem.subtitle},
        description = ${mergedItem.description},
        category = ${mergedItem.category},
        level = ${mergedItem.level},
        slide_count = ${mergedItem.slideCount},
        estimated_minutes = ${mergedItem.estimatedMinutes},
        file_name = ${mergedItem.fileName},
        blob_url = ${mergedItem.blobUrl || null},
        topics = ${JSON.stringify(mergedItem.topics)}::jsonb,
        is_locked = ${Boolean(mergedItem.isLocked)},
        slide1 = ${JSON.stringify(mergedItem.slide1 || {})}::jsonb,
        updated_at = NOW()
      WHERE id = ${id} OR slug = ${id}
      RETURNING id, slug, order_number, title, subtitle, description, category, level,
                slide_count, estimated_minutes, file_name, blob_url, topics, is_locked, slide1
    `;
    if (rows && rows.length > 0) {
      result = mapRowToMaterial(rows[0]);
    }
  }

  // Keep local JSON in sync
  const existingIdx = localList.findIndex((m) => m.id === id || m.slug === id);
  if (existingIdx >= 0) {
    localList[existingIdx] = mergedItem;
  } else {
    localList.push(mergedItem);
  }
  await saveMaterialsToLocalJson(localList);

  if (!result) {
    result = mergedItem;
  }

  return result;
}

// 4. Update is_locked status
export async function updateMaterialLock(id: string, isLocked: boolean): Promise<MaterialItem | null> {
  const sql = getDbClient();
  let updatedItem: MaterialItem | null = null;

  if (sql) {
    const rows = await sql`
      UPDATE materials
      SET is_locked = ${isLocked}, updated_at = NOW()
      WHERE id = ${id} OR slug = ${id}
      RETURNING id, slug, order_number, title, subtitle, description, category, level,
                slide_count, estimated_minutes, file_name, blob_url, topics, is_locked, slide1
    `;
    if (rows && rows.length > 0) {
      updatedItem = mapRowToMaterial(rows[0]);
    }
  }

  // Keep local JSON in sync
  const localList = await getMaterialsFromLocalJson();
  const target = localList.find((m) => m.id === id || m.slug === id);
  if (target) {
    target.isLocked = isLocked;
    await saveMaterialsToLocalJson(localList);
    if (!updatedItem) updatedItem = target;
  }

  return updatedItem;
}

// 5. Update reorder (drag and drop)
export async function updateMaterialsOrder(orderedIds: string[]): Promise<MaterialItem[]> {
  const sql = getDbClient();

  if (sql) {
    for (let index = 0; index < orderedIds.length; index++) {
      const id = orderedIds[index];
      const nextOrderNumber = (index + 1).toString().padStart(2, "0");
      await sql`
        UPDATE materials
        SET order_number = ${nextOrderNumber}, updated_at = NOW()
        WHERE id = ${id} OR slug = ${id}
      `;
    }
  }

  // Sync local JSON
  const localList = await getMaterialsFromLocalJson();
  const materialMap = new Map(localList.map((m) => [m.id, m]));
  const updatedMaterials: MaterialItem[] = [];

  for (const id of orderedIds) {
    const item = materialMap.get(id);
    if (item) {
      updatedMaterials.push(item);
      materialMap.delete(id);
    }
  }
  materialMap.forEach((rem) => updatedMaterials.push(rem));
  updatedMaterials.forEach((item, index) => {
    item.orderNumber = (index + 1).toString().padStart(2, "0");
  });

  await saveMaterialsToLocalJson(updatedMaterials);

  return getAllMaterials();
}

// 6. Delete material
export async function deleteMaterial(id: string): Promise<MaterialItem | null> {
  const sql = getDbClient();
  let deletedItem: MaterialItem | null = null;

  if (sql) {
    const rows = await sql`
      DELETE FROM materials
      WHERE id = ${id} OR slug = ${id}
      RETURNING id, slug, order_number, title, subtitle, description, category, level,
                slide_count, estimated_minutes, file_name, blob_url, topics, is_locked, slide1
    `;
    if (rows && rows.length > 0) {
      deletedItem = mapRowToMaterial(rows[0]);
    }
  }

  // Sync local JSON & resequence
  const localList = await getMaterialsFromLocalJson();
  const target = localList.find((m) => m.id === id || m.slug === id);
  if (!deletedItem && target) deletedItem = target;

  const filtered = localList.filter((m) => m.id !== id && m.slug !== id);
  filtered.forEach((item, index) => {
    item.orderNumber = (index + 1).toString().padStart(2, "0");
  });
  await saveMaterialsToLocalJson(filtered);

  // If deleted in sql, also resequence remaining in DB
  if (sql) {
    for (let index = 0; index < filtered.length; index++) {
      const item = filtered[index];
      const nextOrderNumber = (index + 1).toString().padStart(2, "0");
      await sql`
        UPDATE materials
        SET order_number = ${nextOrderNumber}, updated_at = NOW()
        WHERE id = ${item.id}
      `;
    }
  }

  return deletedItem;
}

// ==========================================
// STUDENT MANAGEMENT FUNCTIONS
// ==========================================

export function mapRowToStudent(row: any): Student {
  return {
    id: row.id,
    name: row.name,
    studentEmail: row.student_email,
    parentName: row.parent_name || undefined,
    parentEmail: row.parent_email,
    notes: row.notes || undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}

export async function getAllStudents(): Promise<Student[]> {
  const sql = getDbClient();
  if (!sql) return [];

  try {
    const rows = await sql`
      SELECT id, name, student_email, parent_name, parent_email, notes, created_at, updated_at
      FROM students
      ORDER BY name ASC
    `;
    return (rows || []).map(mapRowToStudent);
  } catch (err) {
    console.error("Gagal mengambil data siswa dari Neon:", err);
    return [];
  }
}

export async function getStudentById(id: string): Promise<Student | null> {
  const sql = getDbClient();
  if (!sql) return null;

  try {
    const rows = await sql`
      SELECT id, name, student_email, parent_name, parent_email, notes, created_at, updated_at
      FROM students
      WHERE id = ${id}
      LIMIT 1
    `;
    if (!rows || rows.length === 0) return null;
    return mapRowToStudent(rows[0]);
  } catch (err) {
    console.error("Gagal mengambil siswa by ID:", err);
    return null;
  }
}

export async function getStudentByEmail(email: string): Promise<Student | null> {
  const sql = getDbClient();
  if (!sql) return null;

  try {
    const rows = await sql`
      SELECT id, name, student_email, parent_name, parent_email, notes, created_at, updated_at
      FROM students
      WHERE LOWER(student_email) = ${email.toLowerCase().trim()}
      LIMIT 1
    `;
    if (!rows || rows.length === 0) return null;
    return mapRowToStudent(rows[0]);
  } catch (err) {
    console.error("Gagal mengambil siswa by email:", err);
    return null;
  }
}

export async function createStudent(data: Omit<Student, "createdAt" | "updatedAt">): Promise<Student> {
  const sql = getDbClient();
  if (!sql) {
    throw new Error("Koneksi database Neon tidak tersedia");
  }

  const rows = await sql`
    INSERT INTO students (
      id, name, student_email, parent_name, parent_email, notes, created_at, updated_at
    ) VALUES (
      ${data.id},
      ${data.name.trim()},
      ${data.studentEmail.toLowerCase().trim()},
      ${data.parentName?.trim() || null},
      ${data.parentEmail.toLowerCase().trim()},
      ${data.notes?.trim() || null},
      NOW(),
      NOW()
    )
    RETURNING id, name, student_email, parent_name, parent_email, notes, created_at, updated_at
  `;

  return mapRowToStudent(rows[0]);
}

export async function updateStudent(id: string, data: Partial<Student>): Promise<Student | null> {
  const sql = getDbClient();
  if (!sql) {
    throw new Error("Koneksi database Neon tidak tersedia");
  }

  const existing = await getStudentById(id);
  if (!existing) return null;

  const updatedName = data.name !== undefined ? data.name.trim() : existing.name;
  const updatedStudentEmail = data.studentEmail !== undefined ? data.studentEmail.toLowerCase().trim() : existing.studentEmail;
  const updatedParentName = data.parentName !== undefined ? data.parentName.trim() : (existing.parentName || null);
  const updatedParentEmail = data.parentEmail !== undefined ? data.parentEmail.toLowerCase().trim() : existing.parentEmail;
  const updatedNotes = data.notes !== undefined ? data.notes.trim() : (existing.notes || null);

  const rows = await sql`
    UPDATE students
    SET
      name = ${updatedName},
      student_email = ${updatedStudentEmail},
      parent_name = ${updatedParentName},
      parent_email = ${updatedParentEmail},
      notes = ${updatedNotes},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, name, student_email, parent_name, parent_email, notes, created_at, updated_at
  `;

  if (!rows || rows.length === 0) return null;
  return mapRowToStudent(rows[0]);
}

export async function deleteStudent(id: string): Promise<boolean> {
  const sql = getDbClient();
  if (!sql) {
    throw new Error("Koneksi database Neon tidak tersedia");
  }

  await sql`
    DELETE FROM students
    WHERE id = ${id}
  `;

  return true;
}

// ==========================================
// SUBMISSION MANAGEMENT FUNCTIONS
// ==========================================

export function mapRowToSubmission(row: any): Submission {
  return {
    id: row.id,
    studentId: row.student_id,
    materialSlug: row.material_slug,
    fileName: row.file_name || undefined,
    fileUrl: row.file_url || undefined,
    codeContent: row.code_content || undefined,
    language: row.language || "python",
    notes: row.notes || undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}

export async function getSubmissionByStudentAndMaterial(
  studentId: string,
  materialSlug: string
): Promise<Submission | null> {
  const sql = getDbClient();
  if (!sql) return null;

  try {
    const rows = await sql`
      SELECT id, student_id, material_slug, file_name, file_url, code_content, language, notes, created_at, updated_at
      FROM submissions
      WHERE student_id = ${studentId} AND material_slug = ${materialSlug}
      ORDER BY updated_at DESC
      LIMIT 1
    `;
    if (!rows || rows.length === 0) return null;
    return mapRowToSubmission(rows[0]);
  } catch (err) {
    console.error("Gagal mengambil submission:", err);
    return null;
  }
}

export async function upsertSubmission(data: {
  id?: string;
  studentId: string;
  materialSlug: string;
  fileName?: string;
  fileUrl?: string;
  codeContent?: string;
  language?: string;
  notes?: string;
}): Promise<Submission> {
  const sql = getDbClient();
  if (!sql) {
    throw new Error("Koneksi database Neon tidak tersedia");
  }

  // Cek apakah sudah ada submission untuk student & material ini
  const existing = await getSubmissionByStudentAndMaterial(data.studentId, data.materialSlug);

  if (existing) {
    // Update
    const rows = await sql`
      UPDATE submissions
      SET
        file_name = ${data.fileName !== undefined ? data.fileName : existing.fileName || null},
        file_url = ${data.fileUrl !== undefined ? data.fileUrl : existing.fileUrl || null},
        code_content = ${data.codeContent !== undefined ? data.codeContent : existing.codeContent || null},
        language = ${data.language || existing.language || "python"},
        notes = ${data.notes !== undefined ? data.notes : existing.notes || null},
        updated_at = NOW()
      WHERE id = ${existing.id}
      RETURNING id, student_id, material_slug, file_name, file_url, code_content, language, notes, created_at, updated_at
    `;
    return mapRowToSubmission(rows[0]);
  } else {
    // Insert new
    const id = data.id || `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const rows = await sql`
      INSERT INTO submissions (
        id, student_id, material_slug, file_name, file_url, code_content, language, notes, created_at, updated_at
      ) VALUES (
        ${id},
        ${data.studentId},
        ${data.materialSlug},
        ${data.fileName || null},
        ${data.fileUrl || null},
        ${data.codeContent || null},
        ${data.language || "python"},
        ${data.notes || null},
        NOW(),
        NOW()
      )
      RETURNING id, student_id, material_slug, file_name, file_url, code_content, language, notes, created_at, updated_at
    `;
    return mapRowToSubmission(rows[0]);
  }
}

export async function getAllSubmissionsForMaterial(materialSlug: string): Promise<Submission[]> {
  const sql = getDbClient();
  if (!sql) return [];

  try {
    const rows = await sql`
      SELECT id, student_id, material_slug, file_name, file_url, code_content, language, notes, created_at, updated_at
      FROM submissions
      WHERE material_slug = ${materialSlug}
      ORDER BY updated_at DESC
    `;
    return (rows || []).map(mapRowToSubmission);
  } catch (err) {
    console.error("Gagal mengambil daftar submissions:", err);
    return [];
  }
}

export async function getSubmissionsByStudent(studentId: string): Promise<Submission[]> {
  const sql = getDbClient();
  if (!sql) return [];

  try {
    const rows = await sql`
      SELECT id, student_id, material_slug, file_name, file_url, code_content, language, notes, created_at, updated_at
      FROM submissions
      WHERE student_id = ${studentId}
      ORDER BY updated_at DESC
    `;
    return (rows || []).map(mapRowToSubmission);
  } catch (err) {
    console.error("Gagal mengambil submissions berdasarkan siswa:", err);
    return [];
  }
}

export async function getAllSubmissions(): Promise<Submission[]> {
  const sql = getDbClient();
  if (!sql) return [];

  try {
    const rows = await sql`
      SELECT id, student_id, material_slug, file_name, file_url, code_content, language, notes, created_at, updated_at
      FROM submissions
      ORDER BY updated_at DESC
    `;
    return (rows || []).map(mapRowToSubmission);
  } catch (err) {
    console.error("Gagal mengambil seluruh submissions:", err);
    return [];
  }
}

// ==========================================
// REPORT MANAGEMENT FUNCTIONS
// ==========================================

export function mapRowToReport(row: any): Report {
  let slugs: string[] = [];
  if (row.material_slugs) {
    try {
      slugs = typeof row.material_slugs === "string" ? JSON.parse(row.material_slugs) : row.material_slugs;
    } catch {
      slugs = [row.material_slug];
    }
  } else if (row.material_slug) {
    slugs = [row.material_slug];
  }

  return {
    id: row.id,
    token: row.token,
    studentId: row.student_id,
    materialSlug: row.material_slug,
    materialSlugs: slugs,
    sessionPhotoUrl: row.session_photo_url || undefined,
    teacherNotes: row.teacher_notes || undefined,
    submissionId: row.submission_id || undefined,
    status: row.status || "sent",
    sentAt: row.sent_at ? new Date(row.sent_at).toISOString() : undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}

export async function createReport(data: {
  id?: string;
  token: string;
  studentId: string;
  materialSlug: string;
  materialSlugs?: string[];
  sessionPhotoUrl?: string;
  teacherNotes?: string;
  submissionId?: string;
  status?: "draft" | "sent";
  sentAt?: string;
}): Promise<Report> {
  const sql = getDbClient();
  if (!sql) {
    throw new Error("Koneksi database Neon tidak tersedia");
  }

  const id = data.id || `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const slugsJson = JSON.stringify(
    data.materialSlugs && data.materialSlugs.length > 0 ? data.materialSlugs : [data.materialSlug]
  );

  const rows = await sql`
    INSERT INTO reports (
      id, token, student_id, material_slug, material_slugs, session_photo_url, teacher_notes, submission_id, status, sent_at, created_at, updated_at
    ) VALUES (
      ${id},
      ${data.token},
      ${data.studentId},
      ${data.materialSlug},
      ${slugsJson},
      ${data.sessionPhotoUrl || null},
      ${data.teacherNotes || null},
      ${data.submissionId || null},
      ${data.status || "sent"},
      ${data.sentAt ? new Date(data.sentAt) : new Date()},
      NOW(),
      NOW()
    )
    RETURNING id, token, student_id, material_slug, material_slugs, session_photo_url, teacher_notes, submission_id, status, sent_at, created_at, updated_at
  `;

  return mapRowToReport(rows[0]);
}

export async function getReportByToken(token: string) {
  const sql = getDbClient();
  if (!sql) return null;

  try {
    const rows = await sql`
      SELECT id, token, student_id, material_slug, material_slugs, session_photo_url, teacher_notes, submission_id, status, sent_at, created_at, updated_at
      FROM reports
      WHERE token = ${token}
      LIMIT 1
    `;
    if (!rows || rows.length === 0) return null;

    const report = mapRowToReport(rows[0]);
    const student = await getStudentById(report.studentId);
    if (!student) return null;

    // Ambil detail seluruh materi yang dipelajari
    const slugs =
      report.materialSlugs && report.materialSlugs.length > 0
        ? report.materialSlugs
        : [report.materialSlug];
    const materials: MaterialItem[] = [];
    const submissions: Submission[] = [];

    for (const slug of slugs) {
      const mat = await getMaterialBySlug(slug);
      if (mat) materials.push(mat);

      const sub = await getSubmissionByStudentAndMaterial(student.id, slug);
      if (sub) submissions.push(sub);
    }

    return {
      report,
      student,
      materials,
      submissions,
    };
  } catch (err) {
    console.error("Gagal mengambil data report by token:", err);
    return null;
  }
}

export async function getAllReports(): Promise<
  (Report & { studentName?: string; parentEmail?: string })[]
> {
  const sql = getDbClient();
  if (!sql) return [];

  try {
    const rows = await sql`
      SELECT r.*, s.name as student_name, s.parent_email
      FROM reports r
      LEFT JOIN students s ON r.student_id = s.id
      ORDER BY r.created_at DESC
    `;

    return (rows || []).map((row) => {
      const rep = mapRowToReport(row);
      return {
        ...rep,
        studentName: row.student_name || "Siswa",
        parentEmail: row.parent_email || "",
      };
    });
  } catch (err) {
    console.error("Gagal mengambil daftar reports:", err);
    return [];
  }
}

export async function deleteReport(id: string): Promise<boolean> {
  const sql = getDbClient();
  if (!sql) {
    throw new Error("Koneksi database Neon tidak tersedia");
  }

  await sql`
    DELETE FROM reports
    WHERE id = ${id}
  `;

  return true;
}




