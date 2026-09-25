import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { gradeSubmission, getSubmissionById } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isAuthenticated(): boolean {
  const cookieStore = cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "ggstudy_authenticated_admin_ok";
}

// POST: Simpan nilai tugas siswa dan terbitkan link publik mandiri
export async function POST(req: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { submissionId, score, feedback, criteria } = body;

    if (!submissionId || typeof submissionId !== "string") {
      return NextResponse.json(
        { error: "ID tugas (submissionId) wajib disertakan." },
        { status: 400 }
      );
    }

    const numScore = Number(score);
    if (isNaN(numScore) || numScore < 0 || numScore > 100) {
      return NextResponse.json(
        { error: "Skor nilai harus berupa angka antara 0 hingga 100." },
        { status: 400 }
      );
    }

    const existing = await getSubmissionById(submissionId);
    if (!existing) {
      return NextResponse.json(
        { error: "Tugas siswa tidak ditemukan." },
        { status: 404 }
      );
    }

    const updatedSubmission = await gradeSubmission(submissionId, {
      score: Math.round(numScore),
      feedback: typeof feedback === "string" ? feedback.trim() : undefined,
      criteria: criteria && typeof criteria === "object" ? criteria : undefined,
    });

    // Buat URL publik mandiri
    const origin = req.nextUrl.origin;
    const gradeUrl = `${origin}/nilai/${updatedSubmission.gradeToken}`;

    return NextResponse.json({
      success: true,
      message: "Penilaian tugas berhasil disimpan.",
      submission: updatedSubmission,
      gradeToken: updatedSubmission.gradeToken,
      gradeUrl,
    });
  } catch (error: any) {
    console.error("Error grading submission:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan penilaian: " + (error?.message || "Internal error") },
      { status: 500 }
    );
  }
}
