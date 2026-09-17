import { NextRequest } from "next/server";
import { getMaterialBySlug } from "@/lib/db";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const material = await getMaterialBySlug(slug);

    if (!material) {
      return new Response("Materi tidak ditemukan", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    if (material.isLocked) {
      return new Response("Materi ini sedang dikunci oleh pengajar", {
        status: 403,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    let htmlContent = "";

    // 1. Ambil dari Vercel Blob jika tersedia
    if (material.blobUrl) {
      try {
        const res = await fetch(material.blobUrl, {
          cache: "no-store",
        });
        if (res.ok) {
          htmlContent = await res.text();
        }
      } catch (blobErr) {
        console.error("Gagal mengambil slide dari Vercel Blob:", blobErr);
      }
    }

    // 2. Fallback baca berkas lokal jika blob belum ada atau offline
    if (!htmlContent && material.fileName) {
      try {
        const localPath = path.join(process.cwd(), "public", "materials", material.fileName);
        htmlContent = await fs.readFile(localPath, "utf-8");
      } catch (localErr) {
        console.error("Gagal membaca berkas lokal:", localErr);
      }
    }

    if (!htmlContent) {
      return new Response("Konten presentasi belum tersedia", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    return new Response(htmlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err: any) {
    console.error("Error serving slide:", err);
    return new Response("Gagal memuat modul presentasi", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

