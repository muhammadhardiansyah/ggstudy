import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { MaterialItem } from "@/types/material";

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

function getMaterialsPath(): string {
  return path.join(process.cwd(), "src", "data", "materials.json");
}

async function loadMaterials(): Promise<MaterialItem[]> {
  try {
    const raw = await fs.readFile(getMaterialsPath(), "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

async function saveMaterials(items: MaterialItem[]): Promise<void> {
  await fs.writeFile(getMaterialsPath(), JSON.stringify(items, null, 2), "utf-8");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  const materials = await loadMaterials();
  return NextResponse.json(materials);
}

export async function POST(request: Request) {
  if (!isLocalhostRequest(request) || !isAuthenticated()) {
    return NextResponse.json({ error: "Akses ditolak. Fitur ini hanya tersedia di komputer lokal." }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string)?.trim() || "";
    const subtitle = (formData.get("subtitle") as string)?.trim() || "";
    const description = (formData.get("description") as string)?.trim() || "";
    const category = (formData.get("category") as string)?.trim() || "Python";
    const level = (formData.get("level") as "Pemula" | "Menengah" | "Lanjut") || "Pemula";
    const estimatedMinutes = parseInt((formData.get("estimatedMinutes") as string) || "20", 10);
    const topicsRaw = (formData.get("topics") as string) || "";
    const manualSlideCount = parseInt((formData.get("slideCount") as string) || "0", 10);

    // Slide 1 Customizer
    const emoji = (formData.get("emoji") as string)?.trim() || "📘";
    const bgGradient = (formData.get("bgGradient") as string) || "linear-gradient(135deg, #fdfbf7 0%, #ffe8d6 100%)";
    const borderColor = (formData.get("borderColor") as string) || "#d4a373";
    const titleColor = (formData.get("titleColor") as string) || "#cc8b56";
    const subtitleColor = (formData.get("subtitleColor") as string) || "#a98467";
    const tagColor = (formData.get("tagColor") as string) || "#ef233c";
    const tagText = (formData.get("tagText") as string) || `Modul ${level}`;

    if (!file || !title) {
      return NextResponse.json(
        { error: "File presentasi (.html) dan judul materi wajib diisi." },
        { status: 400 }
      );
    }

    if (!file.name.endsWith(".html")) {
      return NextResponse.json(
        { error: "Format file harus berupa .html" },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileContent = fileBuffer.toString("utf-8");

    // Auto-detect slide count from .slide classes
    let detectedSlideCount = manualSlideCount;
    if (!detectedSlideCount || detectedSlideCount <= 0) {
      const slideMatches = fileContent.match(/class=["'][^"']*\bslide\b[^"']*["']/gi);
      detectedSlideCount = slideMatches && slideMatches.length > 0 ? slideMatches.length : 6;
    }

    const currentMaterials = await loadMaterials();

    // Generate unique slug
    let baseSlug = slugify(title);
    if (!baseSlug) baseSlug = "modul";
    let finalSlug = baseSlug;
    let counter = 1;
    while (currentMaterials.some((m) => m.slug === finalSlug)) {
      counter++;
      finalSlug = `${baseSlug}-${counter}`;
    }

    // Determine target HTML file name
    const safeBaseName = file.name
      .replace(/\.html$/i, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_");
    let targetFileName = `${safeBaseName}.html`;
    if (!targetFileName.startsWith("Presentasi_")) {
      targetFileName = `Presentasi_${targetFileName}`;
    }

    // Save uploaded HTML file to public/materials
    const materialsDir = path.join(process.cwd(), "public", "materials");
    await fs.mkdir(materialsDir, { recursive: true });
    await fs.writeFile(path.join(materialsDir, targetFileName), fileBuffer);

    // Parse topics
    const topics = topicsRaw
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const nextOrderNumber = (currentMaterials.length + 1).toString().padStart(2, "0");

    const newMaterial: MaterialItem = {
      id: finalSlug,
      slug: finalSlug,
      orderNumber: nextOrderNumber,
      title,
      subtitle: subtitle || title,
      description: description || `Materi pembelajaran ${title}`,
      category,
      level,
      slideCount: detectedSlideCount,
      estimatedMinutes: isNaN(estimatedMinutes) ? 20 : estimatedMinutes,
      fileName: targetFileName,
      topics: topics.length > 0 ? topics : ["Python", category],
      slide1: {
        emoji,
        bgGradient,
        borderColor,
        titleColor,
        subtitleColor,
        tagColor,
        tagText,
      },
    };

    currentMaterials.push(newMaterial);
    await saveMaterials(currentMaterials);

    return NextResponse.json({
      success: true,
      message: "Materi berhasil ditambahkan!",
      material: newMaterial,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Gagal menyimpan materi" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  if (!isLocalhostRequest(request) || !isAuthenticated()) {
    return NextResponse.json({ error: "Akses ditolak. Fitur ini hanya tersedia di komputer lokal." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json({ error: "ID materi diperlukan" }, { status: 400 });
    }

    const currentMaterials = await loadMaterials();
    const targetMaterial = currentMaterials.find((m) => m.id === id || m.slug === id);

    if (!targetMaterial) {
      return NextResponse.json({ error: "Materi tidak ditemukan" }, { status: 404 });
    }

    // Filter out deleted material
    const updatedMaterials = currentMaterials.filter((m) => m.id !== id && m.slug !== id);

    // Re-sequence orderNumber (01, 02, ...)
    updatedMaterials.forEach((item, index) => {
      item.orderNumber = (index + 1).toString().padStart(2, "0");
    });

    // Delete html file from public/materials if exists
    try {
      const filePath = path.join(process.cwd(), "public", "materials", targetMaterial.fileName);
      await fs.unlink(filePath);
    } catch {
      // Ignore if file was already missing
    }

    await saveMaterials(updatedMaterials);

    return NextResponse.json({
      success: true,
      message: `Materi "${targetMaterial.title}" berhasil dihapus.`,
      materials: updatedMaterials,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Gagal menghapus materi" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  if (!isLocalhostRequest(request) || !isAuthenticated()) {
    return NextResponse.json({ error: "Akses ditolak. Fitur ini hanya tersedia di komputer lokal." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { orderedIds } = body as { orderedIds: string[] };

    if (!orderedIds || !Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: "Format daftar ID tidak valid" },
        { status: 400 }
      );
    }

    const currentMaterials = await loadMaterials();
    const materialMap = new Map(currentMaterials.map((m) => [m.id, m]));

    // Reconstruct list in the new order
    const updatedMaterials: MaterialItem[] = [];
    for (const id of orderedIds) {
      const item = materialMap.get(id);
      if (item) {
        updatedMaterials.push(item);
        materialMap.delete(id);
      }
    }

    // Append any items that might have been missing from orderedIds
    materialMap.forEach((remaining) => {
      updatedMaterials.push(remaining);
    });

    // Re-sequence orderNumber (01, 02, ...)
    updatedMaterials.forEach((item, index) => {
      item.orderNumber = (index + 1).toString().padStart(2, "0");
    });

    await saveMaterials(updatedMaterials);

    return NextResponse.json({
      success: true,
      message: "Urutan materi berhasil diperbarui!",
      materials: updatedMaterials,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Gagal mengubah urutan materi" },
      { status: 500 }
    );
  }
}


