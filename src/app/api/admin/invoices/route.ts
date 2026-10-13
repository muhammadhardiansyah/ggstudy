import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  getAllInvoices,
  createInvoice,
  updateInvoiceStatus,
  deleteInvoice,
} from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isAuthenticated(): boolean {
  const cookieStore = cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "ggstudy_authenticated_admin_ok";
}

// GET: Ambil seluruh daftar invoice
export async function GET() {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const invoices = await getAllInvoices();
    return NextResponse.json({ invoices });
  } catch (err: any) {
    console.error("Error GET invoices:", err);
    return NextResponse.json(
      { error: "Gagal mengambil data tagihan" },
      { status: 500 }
    );
  }
}

// POST: Buat tagihan invoice baru
export async function POST(req: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { studentId, reportIds, amount, notes } = body;

    if (!studentId || typeof studentId !== "string") {
      return NextResponse.json(
        { error: "Siswa wajib dipilih." },
        { status: 400 }
      );
    }

    if (!Array.isArray(reportIds) || reportIds.length === 0) {
      return NextResponse.json(
        { error: "Pilih minimal 1 pertemuan untuk ditagihkan." },
        { status: 400 }
      );
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      return NextResponse.json(
        { error: "Nominal tagihan tidak valid." },
        { status: 400 }
      );
    }

    const created = await createInvoice({
      studentId,
      reportIds,
      amount: Math.round(numAmount),
      notes: typeof notes === "string" && notes.trim() ? notes.trim() : undefined,
    });

    const origin = req.nextUrl.origin;
    const invoiceUrl = `${origin}/invoice/${created.token}`;

    return NextResponse.json({
      success: true,
      message: "Tagihan berhasil diterbitkan.",
      invoice: created,
      invoiceUrl,
    });
  } catch (err: any) {
    console.error("Error POST invoice:", err);
    return NextResponse.json(
      { error: err.message || "Gagal menerbitkan tagihan." },
      { status: 500 }
    );
  }
}

// PATCH: Ubah status pembayaran invoice (unpaid / paid)
export async function PATCH(req: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || (status !== "unpaid" && status !== "paid")) {
      return NextResponse.json(
        { error: "Data pembaruan status tidak valid." },
        { status: 400 }
      );
    }

    const updated = await updateInvoiceStatus(id, status);
    if (!updated) {
      return NextResponse.json(
        { error: "Tagihan tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      invoice: updated,
    });
  } catch (err: any) {
    console.error("Error PATCH invoice:", err);
    return NextResponse.json(
      { error: err.message || "Gagal memperbarui status tagihan." },
      { status: 500 }
    );
  }
}

// DELETE: Hapus invoice
export async function DELETE(req: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID tagihan wajib disertakan." },
        { status: 400 }
      );
    }

    await deleteInvoice(id);
    return NextResponse.json({
      success: true,
      message: "Tagihan berhasil dihapus.",
    });
  } catch (err: any) {
    console.error("Error DELETE invoice:", err);
    return NextResponse.json(
      { error: err.message || "Gagal menghapus tagihan." },
      { status: 500 }
    );
  }
}

