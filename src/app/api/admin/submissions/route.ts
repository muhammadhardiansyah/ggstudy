import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  getSubmissionsByStudent,
  getAllSubmissionsForMaterial,
  getAllSubmissions,
} from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isAuthenticated(): boolean {
  const cookieStore = cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "ggstudy_authenticated_admin_ok";
}

// GET: Ambil daftar pengumpulan tugas siswa untuk admin
export async function GET(req: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const materialSlug = searchParams.get("materialSlug");

    let submissions = [];

    if (studentId) {
      submissions = await getSubmissionsByStudent(studentId);
    } else if (materialSlug) {
      submissions = await getAllSubmissionsForMaterial(materialSlug);
    } else {
      submissions = await getAllSubmissions();
    }

    return NextResponse.json(
      { submissions },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    console.error("Error fetching submissions for admin:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data pengumpulan tugas: " + (error?.message || "Internal error") },
      { status: 500 }
    );
  }
}

