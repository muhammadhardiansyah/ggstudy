import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  getStudentByEmail,
  createStudent,
  getSubmissionByStudentAndMaterial,
  upsertSubmission,
} from "@/lib/db";
import { put } from "@vercel/blob";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET: Ambil data submission siswa untuk modul tertentu
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    if (!slug) {
      return NextResponse.json({ error: "Slug materi wajib disertakan" }, { status: 400 });
    }

    const student = await getStudentByEmail(session.user.email);
    if (!student) {
      return NextResponse.json({ submission: null, isEnrolled: false });
    }

    const submission = await getSubmissionByStudentAndMaterial(student.id, slug);
    return NextResponse.json({
      submission,
      isEnrolled: true,
      studentId: student.id,
    });
  } catch (error: any) {
    console.error("Error fetching student submission:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data submission: " + (error?.message || "Internal error") },
      { status: 500 }
    );
  }
}

// POST: Kumpulkan atau perbarui kodingan tugas siswa
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Kamu harus masuk menggunakan akun Google terlebih dahulu." },
        { status: 401 }
      );
    }

    // Ambil atau daftarkan siswa secara otomatis jika baru pertama kali submit
    let student = await getStudentByEmail(session.user.email);
    if (!student) {
      const studentName = session.user.name || session.user.email.split("@")[0];
      const newId = `std_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      student = await createStudent({
        id: newId,
        name: studentName,
        studentEmail: session.user.email.toLowerCase(),
        parentEmail: "", // Dapat dilengkapi oleh pengajar di panel admin
        notes: "Didaftarkan otomatis melalui login Google",
      });
    }

    const contentType = req.headers.get("content-type") || "";
    let materialSlug = "";
    let codeContent = "";
    let fileName = "";
    let fileUrl = "";
    let notes = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      materialSlug = (formData.get("materialSlug") as string) || "";
      codeContent = (formData.get("codeContent") as string) || "";
      notes = (formData.get("notes") as string) || "";
      const file = formData.get("file") as File | null;

      if (file && file.size > 0) {
        fileName = file.name;
        // Baca isi kode langsung dari file jika codeContent masih kosong
        if (!codeContent.trim()) {
          codeContent = await file.text();
        }

        // Upload ke Vercel Blob jika token tersedia
        if (process.env.BLOB_READ_WRITE_TOKEN) {
          try {
            const blobName = `submissions/${student.id}/${Date.now()}_${file.name}`;
            const blob = await put(blobName, file, { access: "public" });
            fileUrl = blob.url;
          } catch (blobErr) {
            console.warn("Gagal upload file ke Vercel Blob, menyimpan isi kode ke database:", blobErr);
          }
        }
      }
    } else {
      const body = await req.json();
      materialSlug = body.materialSlug || "";
      codeContent = body.codeContent || "";
      notes = body.notes || "";
      fileName = body.fileName || "";
    }

    if (!materialSlug) {
      return NextResponse.json({ error: "Slug materi wajib disertakan." }, { status: 400 });
    }

    if (!codeContent.trim() && !fileUrl) {
      return NextResponse.json(
        { error: "Mohon ketikkan kode Python atau unggah berkas .py hasil pekerjaanmu." },
        { status: 400 }
      );
    }

    const savedSubmission = await upsertSubmission({
      studentId: student.id,
      materialSlug,
      fileName: fileName || undefined,
      fileUrl: fileUrl || undefined,
      codeContent: codeContent || undefined,
      language: "python",
      notes: notes || undefined,
    });

    return NextResponse.json({
      success: true,
      submission: savedSubmission,
      message: "Hasil kodingan berhasil dikumpulkan!",
    });
  } catch (error: any) {
    console.error("Error saving submission:", error);
    return NextResponse.json(
      { error: "Gagal mengumpulkan kodingan: " + (error?.message || "Internal error") },
      { status: 500 }
    );
  }
}

