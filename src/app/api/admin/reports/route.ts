import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { Resend } from "resend";
import { put } from "@vercel/blob";
import {
  getAllReports,
  getStudentById,
  getMaterialBySlug,
  createReport,
  deleteReport,
} from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isAuthenticated(): boolean {
  const cookieStore = cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "ggstudy_authenticated_admin_ok";
}

// 1. GET: Ambil seluruh riwayat laporan
export async function GET() {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const reports = await getAllReports();
    return NextResponse.json(reports, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data laporan: " + (error?.message || "Internal error") },
      { status: 500 }
    );
  }
}

// 2. POST: Buat laporan baru & kirim notifikasi email via Resend
export async function POST(req: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    let studentId = "";
    let materialSlugs: string[] = [];
    let teacherNotes = "";
    let sessionPhotoUrl = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      studentId = (formData.get("studentId") as string) || "";
      teacherNotes = (formData.get("teacherNotes") as string) || "";

      const rawSlugs = formData.get("materialSlugs");
      if (rawSlugs) {
        try {
          materialSlugs = JSON.parse(rawSlugs as string);
        } catch {
          materialSlugs = [(rawSlugs as string).trim()];
        }
      }

      // Handle upload foto pertemuan ke Vercel Blob
      const photoFile = formData.get("photo") as File | null;
      if (photoFile && photoFile.size > 0) {
        if (process.env.BLOB_READ_WRITE_TOKEN) {
          try {
            const ext = photoFile.name.split(".").pop() || "jpg";
            const blobName = `reports/${studentId}/${Date.now()}_sesi.${ext}`;
            const blob = await put(blobName, photoFile, { access: "public" });
            sessionPhotoUrl = blob.url;
          } catch (blobErr) {
            console.error("Gagal mengunggah foto sesi ke Vercel Blob:", blobErr);
          }
        }
      } else {
        const photoUrlField = formData.get("sessionPhotoUrl") as string;
        if (photoUrlField) sessionPhotoUrl = photoUrlField.trim();
      }
    } else {
      const body = await req.json();
      studentId = body.studentId || "";
      materialSlugs = body.materialSlugs || (body.materialSlug ? [body.materialSlug] : []);
      teacherNotes = body.teacherNotes || "";
      sessionPhotoUrl = body.sessionPhotoUrl || "";
    }

    if (!studentId) {
      return NextResponse.json({ error: "Siswa wajib dipilih." }, { status: 400 });
    }

    if (!materialSlugs || materialSlugs.length === 0) {
      return NextResponse.json(
        { error: "Pilih setidaknya 1 materi pembelajaran yang dipelajari pada sesi ini." },
        { status: 400 }
      );
    }

    const student = await getStudentById(studentId);
    if (!student) {
      return NextResponse.json({ error: "Data siswa tidak ditemukan di database." }, { status: 404 });
    }

    // Ambil judul-judul materi untuk subjek dan isi laporan
    const materialTitles: string[] = [];
    for (const slug of materialSlugs) {
      const mat = await getMaterialBySlug(slug);
      if (mat) materialTitles.push(mat.title);
    }
    const materialDisplayTitle = materialTitles.length > 0 ? materialTitles.join(" & ") : "Pemrograman Python";

    // Buat token rahasia acak (Cryptographically Secure UUID)
    const token = `rep_${crypto.randomUUID().replace(/-/g, "")}`;

    // Simpan data report ke database Neon
    const report = await createReport({
      token,
      studentId: student.id,
      materialSlug: materialSlugs[0],
      materialSlugs,
      sessionPhotoUrl: sessionPhotoUrl || undefined,
      teacherNotes: teacherNotes.trim() || undefined,
      status: "sent",
      sentAt: new Date().toISOString(),
    });

    // Buat URL laporan orang tua
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      req.nextUrl.origin ||
      "http://localhost:3000";
    const reportUrl = `${baseUrl.replace(/\/$/, "")}/report/${token}`;

    // Kirim notifikasi email via Resend jika RESEND_API_KEY tersedia
    let emailSent = false;
    let emailError: string | null = null;

    if (process.env.RESEND_API_KEY && student.parentEmail) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);

        const materialsListHtml = materialTitles
          .map((t) => `<li style="margin-bottom: 4px; font-weight: 600; color: #1c1917;">${t}</li>`)
          .join("");

        const fromEmail = process.env.RESEND_FROM_EMAIL || "GG Study <onboarding@resend.dev>";
        const sendResult = await resend.emails.send({
          from: fromEmail,
          to: student.parentEmail,
          subject: `Laporan Belajar Python: ${student.name} - ${materialDisplayTitle}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; color: #1c1917; background-color: #fdfbf7; border-radius: 16px; border: 1px solid #e5e0d8;">
              <div style="border-bottom: 2px dashed #e5e0d8; padding-bottom: 16px; margin-bottom: 20px;">
                <span style="font-size: 11px; font-weight: 800; color: #b45309; text-transform: uppercase; letter-spacing: 0.05em;">Laporan Pembelajaran Siswa</span>
                <h1 style="color: #1c1917; font-size: 20px; font-weight: 800; margin: 4px 0 0 0;">GG Study</h1>
              </div>

              <p style="font-size: 14px; line-height: 1.6; margin: 0 0 12px 0;">
                Halo Ayah / Bunda dari <strong>${student.name}</strong>,
              </p>

              <p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px 0; color: #57534e;">
                Sesi pembelajaran koding Python untuk ananda pada hari ini telah selesai dilaksanakan dengan baik.
              </p>

              <div style="background-color: #ffffff; border: 1px solid #e5e0d8; border-radius: 12px; padding: 16px; margin: 20px 0;">
                <div style="font-size: 12px; font-weight: 700; color: #b45309; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
                  Materi yang Dipelajari:
                </div>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
                  ${materialsListHtml}
                </ul>
              </div>

              <p style="font-size: 13px; line-height: 1.6; color: #57534e; margin: 0 0 24px 0;">
                Bapak / Ibu dapat melihat dokumentasi foto pertemuan, rangkuman materi, dan hasil karya kodingan anak secara lengkap melalui tautan laporan di bawah ini:
              </p>

              <div style="text-align: center; margin: 28px 0;">
                <a href="${reportUrl}" style="background-color: #b45309; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 2px 8px rgba(180, 83, 9, 0.2);">
                  Buka Laporan & Kodingan Siswa &rarr;
                </a>
              </div>

              <div style="border-top: 1px solid #e5e0d8; padding-top: 16px; margin-top: 28px; font-size: 11px; color: #a8a29e; line-height: 1.5;">
                <p style="margin: 0 0 6px 0;">
                  * Tautan ini bersifat privat untuk keluarga siswa dan dapat diakses langsung tanpa memerlukan kata sandi.
                </p>
                <p style="margin: 0;">
                  Salam hangat,<br/>
                  <strong>Tim Pengajar GG Study</strong>
                </p>
              </div>
            </div>
          `,
        });

        if (sendResult.error) {
          console.error("Resend API returned error:", sendResult.error);
          emailSent = false;
          emailError = sendResult.error.message;
        } else {
          emailSent = true;
        }
      } catch (mailErr: any) {
        console.error("Gagal mengirim email via Resend:", mailErr);
        emailError = mailErr?.message || "Gagal memicu Resend API";
      }
    }

    return NextResponse.json({
      success: true,
      report,
      reportUrl,
      emailSent,
      emailError,
      message: emailSent
        ? `Laporan berhasil dibuat dan email telah dikirimkan ke ${student.parentEmail}!`
        : `Laporan berhasil dibuat! (Email belum terkirim otomatis: ${
            process.env.RESEND_API_KEY ? emailError : "RESEND_API_KEY belum diisi di .env.local"
          }). Kamu tetap dapat membagikan tautan laporan langsung ke orang tua.`,
    });
  } catch (error: any) {
    console.error("Error creating report:", error);
    return NextResponse.json(
      { error: "Gagal membuat laporan: " + (error?.message || "Internal error") },
      { status: 500 }
    );
  }
}

// 3. DELETE: Hapus laporan
export async function DELETE(req: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID laporan wajib disertakan." }, { status: 400 });
    }

    await deleteReport(id);
    return NextResponse.json({ success: true, message: "Laporan berhasil dihapus." });
  } catch (error: any) {
    console.error("Error deleting report:", error);
    return NextResponse.json(
      { error: "Gagal menghapus laporan: " + (error?.message || "Internal error") },
      { status: 500 }
    );
  }
}

