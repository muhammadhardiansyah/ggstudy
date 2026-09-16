import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { put, del } from "@vercel/blob";
import { MaterialItem } from "@/types/material";
import {
  getAllMaterials,
  upsertMaterial,
  updateMaterialLock,
  updateMaterialsOrder,
  deleteMaterial,
} from "@/lib/db";

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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  const materials = await getAllMaterials();
  return NextResponse.json(materials);
}

export async function POST(request: Request) {
  if (!isLocalhostRequest(request) || !isAuthenticated()) {
    return NextResponse.json(
      { error: "Akses ditolak. Fitur ini hanya tersedia di komputer lokal." },
      { status: 403 }
    );
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
    const bgGradient =
      (formData.get("bgGradient") as string) ||
      "linear-gradient(135deg, #fdfbf7 0%, #ffe8d6 100%)";
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

    const currentMaterials = await getAllMaterials();

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

    // 1. Upload to Vercel Blob (if token exists)
    let blobUrl: string | undefined = undefined;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blob = await put(`materials/${targetFileName}`, fileBuffer, {
          access: "public",
          contentType: "text/html",
        });
        blobUrl = blob.url;
      } catch (blobError) {
        console.error("Peringatan: Gagal upload ke Vercel Blob:", blobError);
      }
    }

    // 2. Also save to local public/materials folder as local fallback
    try {
      const materialsDir = path.join(process.cwd(), "public", "materials");
      await fs.mkdir(materialsDir, { recursive: true });
      await fs.writeFile(path.join(materialsDir, targetFileName), fileBuffer);
    } catch (fsErr) {
      console.error("Peringatan: Gagal menyimpan file fisik lokal:", fsErr);
    }

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
      blobUrl,
      topics: topics.length > 0 ? topics : ["Python", category],
      isLocked: (formData.get("isLocked") as string) === "true",
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

    // 3. Save metadata to Neon DB (and synced to local JSON)
    await upsertMaterial(newMaterial);

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
    return NextResponse.json(
      { error: "Akses ditolak. Fitur ini hanya tersedia di komputer lokal." },
      { status: 403 }
    );
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

    // 1. Delete from Neon DB
    const deletedMaterial = await deleteMaterial(id);

    if (!deletedMaterial) {
      return NextResponse.json({ error: "Materi tidak ditemukan" }, { status: 404 });
    }

    // 2. Delete from Vercel Blob (if blobUrl and token exist)
    if (deletedMaterial.blobUrl && process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        await del(deletedMaterial.blobUrl);
      } catch (blobErr) {
        console.error("Gagal menghapus file dari Vercel Blob:", blobErr);
      }
    }

    // 3. Delete local html file from public/materials if exists
    try {
      const filePath = path.join(process.cwd(), "public", "materials", deletedMaterial.fileName);
      await fs.unlink(filePath);
    } catch {
      // Ignore if file was already missing
    }

    const updatedMaterials = await getAllMaterials();

    return NextResponse.json({
      success: true,
      message: `Materi "${deletedMaterial.title}" berhasil dihapus.`,
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
    return NextResponse.json(
      { error: "Akses ditolak. Fitur ini hanya tersedia di komputer lokal." },
      { status: 403 }
    );
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

    // Update order in Neon DB and local JSON
    const updatedMaterials = await updateMaterialsOrder(orderedIds);

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

export async function PATCH(request: Request) {
  if (!isLocalhostRequest(request) || !isAuthenticated()) {
    return NextResponse.json(
      { error: "Akses ditolak. Fitur ini hanya tersedia di komputer lokal." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { id, isLocked } = body as { id: string; isLocked?: boolean };

    if (!id) {
      return NextResponse.json({ error: "ID materi diperlukan" }, { status: 400 });
    }

    if (typeof isLocked !== "boolean") {
      return NextResponse.json({ error: "Nilai isLocked wajib boolean" }, { status: 400 });
    }

    // Update lock status in Neon DB and local JSON
    const updatedTarget = await updateMaterialLock(id, isLocked);

    if (!updatedTarget) {
      return NextResponse.json({ error: "Materi tidak ditemukan" }, { status: 404 });
    }

    const currentMaterials = await getAllMaterials();

    return NextResponse.json({
      success: true,
      message: `Status materi "${updatedTarget.title}" berhasil diubah menjadi ${
        updatedTarget.isLocked ? "Terkunci" : "Terbuka"
      }.`,
      materials: currentMaterials,
      material: updatedTarget,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Gagal memperbarui status materi" },
      { status: 500 }
    );
  }
}
