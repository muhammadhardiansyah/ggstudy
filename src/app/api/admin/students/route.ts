import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  getAllStudents,
  getStudentById,
  getStudentByEmail,
  createStudent,
  updateStudent,
  deleteStudent,
} from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isAuthenticated(): boolean {
  const cookieStore = cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "ggstudy_authenticated_admin_ok";
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 1. GET: Ambil daftar seluruh siswa
export async function GET() {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const students = await getAllStudents();
    return NextResponse.json(students, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data siswa: " + (error?.message || "Internal error") },
      { status: 500 }
    );
  }
}

// 2. POST: Tambah siswa baru
export async function POST(req: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, studentEmail, parentName, parentEmail, notes } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Nama siswa wajib diisi." }, { status: 400 });
    }

    if (!studentEmail || typeof studentEmail !== "string" || !isValidEmail(studentEmail.trim())) {
      return NextResponse.json({ error: "Format email Google siswa tidak valid." }, { status: 400 });
    }

    if (!parentEmail || typeof parentEmail !== "string" || !isValidEmail(parentEmail.trim())) {
      return NextResponse.json({ error: "Format email orang tua tidak valid." }, { status: 400 });
    }

    // Cek apakah email siswa sudah terdaftar
    const existing = await getStudentByEmail(studentEmail.trim());
    if (existing) {
      return NextResponse.json(
        { error: `Email siswa (${studentEmail.trim()}) sudah terdaftar untuk siswa "${existing.name}".` },
        { status: 400 }
      );
    }

    const id = `std_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const created = await createStudent({
      id,
      name: name.trim(),
      studentEmail: studentEmail.trim().toLowerCase(),
      parentName: parentName?.trim() || undefined,
      parentEmail: parentEmail.trim().toLowerCase(),
      notes: notes?.trim() || undefined,
    });

    return NextResponse.json({ success: true, student: created });
  } catch (error: any) {
    console.error("Error creating student:", error);
    return NextResponse.json(
      { error: "Gagal menambahkan siswa: " + (error?.message || "Internal error") },
      { status: 500 }
    );
  }
}

// 3. PUT: Perbarui data siswa
export async function PUT(req: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, name, studentEmail, parentName, parentEmail, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "ID siswa wajib disertakan." }, { status: 400 });
    }

    const existing = await getStudentById(id);
    if (!existing) {
      return NextResponse.json({ error: "Data siswa tidak ditemukan." }, { status: 404 });
    }

    if (name !== undefined && (!name || typeof name !== "string" || !name.trim())) {
      return NextResponse.json({ error: "Nama siswa tidak boleh kosong." }, { status: 400 });
    }

    if (studentEmail !== undefined && !isValidEmail(studentEmail.trim())) {
      return NextResponse.json({ error: "Format email Google siswa tidak valid." }, { status: 400 });
    }

    if (parentEmail !== undefined && !isValidEmail(parentEmail.trim())) {
      return NextResponse.json({ error: "Format email orang tua tidak valid." }, { status: 400 });
    }

    // Jika email siswa diubah, cek apakah bentrok dengan siswa lain
    if (studentEmail && studentEmail.trim().toLowerCase() !== existing.studentEmail.toLowerCase()) {
      const conflict = await getStudentByEmail(studentEmail.trim());
      if (conflict && conflict.id !== id) {
        return NextResponse.json(
          { error: `Email siswa (${studentEmail.trim()}) sudah digunakan oleh siswa "${conflict.name}".` },
          { status: 400 }
        );
      }
    }

    const updated = await updateStudent(id, {
      name: name !== undefined ? name.trim() : undefined,
      studentEmail: studentEmail !== undefined ? studentEmail.trim().toLowerCase() : undefined,
      parentName: parentName !== undefined ? parentName.trim() : undefined,
      parentEmail: parentEmail !== undefined ? parentEmail.trim().toLowerCase() : undefined,
      notes: notes !== undefined ? notes.trim() : undefined,
    });

    return NextResponse.json({ success: true, student: updated });
  } catch (error: any) {
    console.error("Error updating student:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui data siswa: " + (error?.message || "Internal error") },
      { status: 500 }
    );
  }
}

// 4. DELETE: Hapus siswa
export async function DELETE(req: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID siswa wajib disertakan." }, { status: 400 });
    }

    const existing = await getStudentById(id);
    if (!existing) {
      return NextResponse.json({ error: "Data siswa tidak ditemukan." }, { status: 404 });
    }

    await deleteStudent(id);

    return NextResponse.json({ success: true, message: `Siswa "${existing.name}" berhasil dihapus.` });
  } catch (error: any) {
    console.error("Error deleting student:", error);
    return NextResponse.json(
      { error: "Gagal menghapus siswa: " + (error?.message || "Internal error") },
      { status: 500 }
    );
  }
}

