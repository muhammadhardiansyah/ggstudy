import { neon } from "@neondatabase/serverless";
import { MaterialItem } from "@/types/material";
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

