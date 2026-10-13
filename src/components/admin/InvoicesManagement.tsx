"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Receipt,
  Plus,
  CheckCircle2,
  Clock,
  Search,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Loader2,
  Calendar,
  User,
  Wallet,
  Sparkles,
  X,
  Share2,
  AlertCircle,
  BookOpen,
  Building2,
} from "lucide-react";
import { Student, Report, Invoice } from "@/types/student";
import { MaterialItem } from "@/types/material";

type InvoiceWithStudent = Invoice & {
  studentName?: string;
  parentName?: string;
  parentEmail?: string;
};

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function InvoicesManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [reports, setReports] = useState<
    (Report & { studentName?: string; parentEmail?: string })[]
  >([]);
  const [invoices, setInvoices] = useState<InvoiceWithStudent[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [statusFilter, setStatusFilter] = useState<"all" | "unpaid" | "paid">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Create Modal / Form State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [amount, setAmount] = useState<number>(200000);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Share Modal State
  const [shareInvoiceModal, setShareInvoiceModal] = useState<{
    invoice: InvoiceWithStudent;
    url: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Action Loading States
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  async function loadAllData() {
    setLoading(true);
    try {
      const [resStudents, resMaterials, resReports, resInvoices] = await Promise.all([
        fetch("/api/admin/students"),
        fetch("/api/admin/materials"),
        fetch("/api/admin/reports"),
        fetch("/api/admin/invoices"),
      ]);

      if (resStudents.ok) {
        const stdData = await resStudents.json();
        setStudents(Array.isArray(stdData) ? stdData : stdData.students || []);
      }
      if (resMaterials.ok) {
        const matData = await resMaterials.json();
        setMaterials(Array.isArray(matData) ? matData : matData.materials || []);
      }
      if (resReports.ok) {
        const repData = await resReports.json();
        setReports(Array.isArray(repData) ? repData : repData.reports || []);
      }
      if (resInvoices.ok) {
        const invData = await resInvoices.json();
        setInvoices(Array.isArray(invData) ? invData : invData.invoices || []);
      }
    } catch (err) {
      console.error("Gagal memuat data tagihan:", err);
      setNotification({
        type: "error",
        message: "Gagal memuat data dari server.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAllData();
  }, []);

  const materialMap = useMemo(() => {
    const map = new Map<string, MaterialItem>();
    for (const m of materials) {
      map.set(m.slug, m);
    }
    return map;
  }, [materials]);

  // Map reportId -> invoiceNumber if already billed
  const billedReportMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const inv of invoices) {
      for (const rId of inv.reportIds || []) {
        map.set(rId, inv.invoiceNumber);
      }
    }
    return map;
  }, [invoices]);

  // Reports filtered by selected student (sorted oldest to newest or newest to oldest)
  const studentReports = useMemo(() => {
    if (!selectedStudentId) return [];
    return reports
      .filter((r) => r.studentId === selectedStudentId)
      .sort((a, b) => {
        const dateA = new Date(a.sentAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.sentAt || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
  }, [reports, selectedStudentId]);

  // Auto-select up to 4 unbilled reports when student is selected
  function handleStudentChange(studentId: string) {
    setSelectedStudentId(studentId);
    if (!studentId) {
      setSelectedReportIds([]);
      return;
    }
    const unbilled = reports
      .filter((r) => r.studentId === studentId && !billedReportMap.has(r.id))
      .sort((a, b) => {
        const dateA = new Date(a.sentAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.sentAt || b.createdAt || 0).getTime();
        return dateA - dateB; // ambil 4 pertemuan terlama yang belum ditagih
      })
      .slice(0, 4)
      .map((r) => r.id);

    setSelectedReportIds(unbilled);
    setAmount(200000);
  }

  function toggleReportSelection(reportId: string) {
    setSelectedReportIds((prev) =>
      prev.includes(reportId)
        ? prev.filter((id) => id !== reportId)
        : [...prev, reportId]
    );
  }

  function selectFourUnbilled() {
    const unbilled = studentReports
      .filter((r) => !billedReportMap.has(r.id))
      .reverse()
      .slice(0, 4)
      .map((r) => r.id);
    setSelectedReportIds(unbilled);
    setAmount(200000);
  }

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudentId) {
      setNotification({ type: "error", message: "Silakan pilih siswa terlebih dahulu." });
      return;
    }
    if (selectedReportIds.length === 0) {
      setNotification({
        type: "error",
        message: "Pilih minimal 1 sesi pertemuan untuk ditagihkan.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          reportIds: selectedReportIds,
          amount: Number(amount),
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menerbitkan tagihan.");
      }

      const studentObj = students.find((s) => s.id === selectedStudentId);
      const enrichedInvoice: InvoiceWithStudent = {
        ...data.invoice,
        studentName: studentObj?.name || "Siswa",
        parentName: studentObj?.parentName,
        parentEmail: studentObj?.parentEmail,
      };

      setInvoices((prev) => [enrichedInvoice, ...prev]);
      setIsCreateModalOpen(false);
      setSelectedStudentId("");
      setSelectedReportIds([]);
      setAmount(200000);
      setNotes("");

      setShareInvoiceModal({
        invoice: enrichedInvoice,
        url: data.invoiceUrl || `${window.location.origin}/invoice/${enrichedInvoice.token}`,
      });

      setNotification({
        type: "success",
        message: `Tagihan ${enrichedInvoice.invoiceNumber} berhasil diterbitkan!`,
      });
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Terjadi kesalahan saat membuat tagihan.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(inv: InvoiceWithStudent) {
    const newStatus = inv.status === "paid" ? "unpaid" : "paid";
    setUpdatingId(inv.id);
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: inv.id, status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengubah status.");
      }

      setInvoices((prev) =>
        prev.map((item) =>
          item.id === inv.id
            ? {
                ...item,
                status: data.invoice.status,
                paidAt: data.invoice.paidAt,
              }
            : item
        )
      );

      setNotification({
        type: "success",
        message:
          newStatus === "paid"
            ? `Tagihan ${inv.invoiceNumber} ditandai LUNAS!`
            : `Status tagihan ${inv.invoiceNumber} dikembalikan ke Belum Lunas.`,
      });
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Gagal memperbarui status pembayaran.",
      });
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDeleteInvoice(id: string, invoiceNumber: string) {
    if (!confirm(`Yakin ingin menghapus tagihan ${invoiceNumber}?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/invoices?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus tagihan.");
      }
      setInvoices((prev) => prev.filter((item) => item.id !== id));
      setNotification({
        type: "success",
        message: `Tagihan ${invoiceNumber} berhasil dihapus.`,
      });
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Gagal menghapus tagihan.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  function handleCopyLink(token: string, idKey: string) {
    const url = `${window.location.origin}/invoice/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(idKey);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function buildWhatsAppUrl(inv: InvoiceWithStudent) {
    const url = `${window.location.origin}/invoice/${inv.token}`;
    const greetingName = inv.parentName ? `Bapak/Ibu ${inv.parentName}` : `Orang Tua dari ${inv.studentName || "Siswa"}`;
    const sessionCount = inv.reportIds?.length || 0;
    const text = [
      `Halo ${greetingName}, semoga sehat selalu.`,
      ``,
      `Berikut kami sampaikan rincian tagihan sesi belajar koding Python untuk ananda *${inv.studentName || "Siswa"}* sebanyak *${sessionCount} pertemuan*:`,
      ``,
      `No. Tagihan: *${inv.invoiceNumber}*`,
      `Total Tagihan: *${formatRupiah(inv.amount)}*`,
      ``,
      `Rincian tanggal pertemuan, materi yang dipelajari, serta informasi nomor rekening pembayaran dapat dilihat langsung melalui tautan berikut:`,
      `${url}`,
      ``,
      `Terima kasih banyak atas kerja sama dan kepercayaannya.`,
    ].join("\n");

    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter !== "all" && inv.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchStudent = (inv.studentName || "").toLowerCase().includes(q);
        const matchNum = inv.invoiceNumber.toLowerCase().includes(q);
        const matchParent = (inv.parentName || "").toLowerCase().includes(q);
        return matchStudent || matchNum || matchParent;
      }
      return true;
    });
  }, [invoices, statusFilter, searchQuery]);

  // Metrics
  const stats = useMemo(() => {
    const totalCount = invoices.length;
    const unpaidList = invoices.filter((i) => i.status === "unpaid");
    const paidList = invoices.filter((i) => i.status === "paid");
    const unpaidAmount = unpaidList.reduce((sum, i) => sum + i.amount, 0);
    const paidAmount = paidList.reduce((sum, i) => sum + i.amount, 0);
    return {
      totalCount,
      unpaidCount: unpaidList.length,
      paidCount: paidList.length,
      unpaidAmount,
      paidAmount,
    };
  }, [invoices]);

  function getReportTitleSummary(report: Report) {
    const slugs =
      report.materialSlugs && report.materialSlugs.length > 0
        ? report.materialSlugs
        : [report.materialSlug];
    return slugs
      .map((slug) => {
        const m = materialMap.get(slug);
        return m ? `Modul ${m.orderNumber}: ${m.title}` : slug;
      })
      .join(", ");
  }

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-[#e5e0d8] p-12 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
        <p className="text-sm font-medium text-[#57534e]">
          Memuat data tagihan & riwayat pertemuan...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-xs ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="p-1 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Primary Action */}
      <div className="bg-white rounded-3xl border border-[#e5e0d8] p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-amber-800 text-xs font-bold uppercase tracking-wider">
            <Receipt className="w-4 h-4" />
            <span>Manajemen Invoicing Les Privat</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1c1917]">
            Tagihan & Pembayaran Pertemuan
          </h2>
          <p className="text-xs sm:text-sm text-[#57534e]">
            Pilih pertemuan dari riwayat laporan belajar siswa dan terbitkan link tagihan resmi untuk orang tua.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm shadow-sm transition-colors cursor-pointer shrink-0 min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Tagihan Baru</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#e5e0d8] p-5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#57534e] block">
              Menunggu Pembayaran ({stats.unpaidCount})
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-700 mt-1 block">
              {formatRupiah(stats.unpaidAmount)}
            </span>
            <span className="text-[11px] text-[#57534e] mt-0.5 block">
              Tagihan aktif belum lunas
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e0d8] p-5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#57534e] block">
              Sudah Lunas ({stats.paidCount})
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-700 mt-1 block">
              {formatRupiah(stats.paidAmount)}
            </span>
            <span className="text-[11px] text-[#57534e] mt-0.5 block">
              Total pembayaran diterima
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e0d8] p-5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#57534e] block">
              Rekening Tujuan Statis
            </span>
            <span className="text-sm sm:text-base font-black text-[#1c1917] mt-1 block">
              Mandiri: 1380018308176
            </span>
            <span className="text-[11px] font-semibold text-[#57534e] mt-0.5 block">
              a.n. MUHAMMAD HARDIANSYAH
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-stone-100 text-stone-700 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-[#e5e0d8] p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-[#fdfbf7] p-1 rounded-xl border border-[#e5e0d8]">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer min-h-[36px] ${
              statusFilter === "all"
                ? "bg-[#1c1917] text-white"
                : "text-[#57534e] hover:text-[#1c1917]"
            }`}
          >
            Semua ({invoices.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("unpaid")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer min-h-[36px] ${
              statusFilter === "unpaid"
                ? "bg-amber-600 text-white"
                : "text-[#57534e] hover:text-[#1c1917]"
            }`}
          >
            Belum Lunas ({stats.unpaidCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("paid")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer min-h-[36px] ${
              statusFilter === "paid"
                ? "bg-emerald-600 text-white"
                : "text-[#57534e] hover:text-[#1c1917]"
            }`}
          >
            Lunas ({stats.paidCount})
          </button>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama siswa atau nomor invoice..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#e5e0d8] text-xs sm:text-sm focus:outline-none focus:border-amber-500 bg-[#fdfbf7]"
          />
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-3xl border border-[#e5e0d8] overflow-hidden shadow-xs">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
              <Receipt className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#1c1917]">
                Belum Ada Data Tagihan
              </h3>
              <p className="text-xs text-[#57534e] max-w-md mx-auto">
                Klik tombol &ldquo;Buat Tagihan Baru&rdquo; di atas untuk memilih pertemuan siswa dan membuat link tagihan pembayaran.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#e5e0d8] bg-[#fdfbf7] text-[11px] font-bold uppercase tracking-wider text-[#57534e]">
                  <th className="py-3.5 px-4">No. Tagihan & Tanggal</th>
                  <th className="py-3.5 px-4">Siswa & Orang Tua</th>
                  <th className="py-3.5 px-4">Jumlah Sesi</th>
                  <th className="py-3.5 px-4">Nominal</th>
                  <th className="py-3.5 px-4">Status Pembayaran</th>
                  <th className="py-3.5 px-4 text-right">Aksi & Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0eae1] text-xs sm:text-sm">
                {filteredInvoices.map((inv) => {
                  const createdDate = inv.createdAt
                    ? new Date(inv.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "-";
                  const isPaid = inv.status === "paid";

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-[#fdfbf7]/60 transition-colors"
                    >
                      <td className="py-4 px-4 align-middle">
                        <div className="font-mono font-bold text-[#1c1917]">
                          {inv.invoiceNumber}
                        </div>
                        <div className="text-[11px] text-[#57534e] flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{createdDate}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 align-middle">
                        <div className="font-bold text-[#1c1917]">
                          {inv.studentName || "Siswa"}
                        </div>
                        {inv.parentName && (
                          <div className="text-[11px] text-[#57534e]">
                            Ortu: {inv.parentName}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 align-middle">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200 text-xs font-semibold text-[#1c1917]">
                          <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                          {inv.reportIds?.length || 0} Pertemuan
                        </span>
                      </td>

                      <td className="py-4 px-4 align-middle">
                        <div className="font-black text-[#1c1917] text-sm sm:text-base">
                          {formatRupiah(inv.amount)}
                        </div>
                        {inv.notes && (
                          <div className="text-[11px] text-[#57534e] truncate max-w-[180px]">
                            {inv.notes}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 align-middle">
                        <div className="flex flex-col items-start gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                              isPaid
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : "bg-amber-100 text-amber-900 border-amber-300"
                            }`}
                          >
                            {isPaid ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                <span>LUNAS</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3.5 h-3.5 text-amber-700" />
                                <span>BELUM LUNAS</span>
                              </>
                            )}
                          </span>

                          <button
                            type="button"
                            disabled={updatingId === inv.id}
                            onClick={() => handleToggleStatus(inv)}
                            className="text-[11px] font-semibold text-[#57534e] hover:text-[#1c1917] underline cursor-pointer disabled:opacity-50"
                          >
                            {updatingId === inv.id
                              ? "Memproses..."
                              : isPaid
                              ? "Ubah ke Belum Lunas"
                              : "Tandai Sudah Lunas"}
                          </button>
                        </div>
                      </td>

                      <td className="py-4 px-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleCopyLink(inv.token, inv.id)}
                            title="Salin Link Tagihan"
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#e5e0d8] hover:border-amber-400 text-xs font-semibold text-[#1c1917] hover:bg-amber-50/40 transition-colors cursor-pointer min-h-[38px]"
                          >
                            {copiedId === inv.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Tersalin</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-stone-500" />
                                <span>Salin Link</span>
                              </>
                            )}
                          </button>

                          <a
                            href={buildWhatsAppUrl(inv)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Kirim Tagihan via WhatsApp"
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors min-h-[38px]"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>WA</span>
                          </a>

                          <a
                            href={`/invoice/${inv.token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Buka Halaman Tagihan"
                            className="inline-flex items-center justify-center p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#1c1917] transition-colors min-h-[38px] min-w-[38px]"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>

                          <button
                            type="button"
                            disabled={deletingId === inv.id}
                            onClick={() =>
                              handleDeleteInvoice(inv.id, inv.invoiceNumber)
                            }
                            title="Hapus Tagihan"
                            className="inline-flex items-center justify-center p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer min-h-[38px] min-w-[38px]"
                          >
                            {deletingId === inv.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Buat Tagihan Baru */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#e5e0d8] w-full max-w-2xl overflow-hidden shadow-2xl my-8">
            <div className="px-6 py-5 border-b border-[#f0eae1] flex items-center justify-between bg-[#fdfbf7]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#1c1917]">
                    Buat Tagihan Pertemuan Baru
                  </h3>
                  <p className="text-xs text-[#57534e]">
                    Pilih siswa dan centang pertemuan yang akan ditagihkan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* 1. Pilih Siswa */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1c1917]">
                  1. Pilih Siswa
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleStudentChange(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#e5e0d8] bg-[#fdfbf7] text-sm font-medium text-[#1c1917] focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Pilih Siswa --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.parentName ? `(Ortu: ${s.parentName})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Pilih Pertemuan dari Riwayat Reports */}
              {selectedStudentId && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1c1917]">
                      2. Pilih Pertemuan yang Ditagihkan ({selectedReportIds.length} dipilih)
                    </label>
                    {studentReports.length > 0 && (
                      <button
                        type="button"
                        onClick={selectFourUnbilled}
                        className="text-xs font-bold text-amber-800 hover:text-amber-900 underline cursor-pointer"
                      >
                        Otomatis Pilih 4 Sesi Belum Ditagih
                      </button>
                    )}
                  </div>

                  {studentReports.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-[#57534e] text-center">
                      Belum ada riwayat laporan pertemuan (reports) untuk siswa ini.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {studentReports.map((rep, idx) => {
                        const isChecked = selectedReportIds.includes(rep.id);
                        const existingInvoiceNum = billedReportMap.get(rep.id);
                        const dateStr = rep.sentAt || rep.createdAt
                          ? new Date(rep.sentAt || rep.createdAt!).toLocaleDateString("id-ID", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "Tanpa Tanggal";

                        return (
                          <label
                            key={rep.id}
                            className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-colors cursor-pointer ${
                              isChecked
                                ? "bg-amber-50/70 border-amber-400"
                                : existingInvoiceNum
                                ? "bg-stone-50 border-stone-200 opacity-75"
                                : "bg-white border-[#e5e0d8] hover:border-stone-400"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleReportSelection(rep.id)}
                              className="mt-1 w-4 h-4 accent-amber-600 rounded cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="text-xs font-bold text-[#1c1917]">
                                  Pertemuan #{studentReports.length - idx} - {dateStr}
                                </span>
                                {existingInvoiceNum ? (
                                  <span className="px-2 py-0.5 rounded-md bg-stone-200 text-stone-700 text-[10px] font-bold">
                                    Sudah Ditagih ({existingInvoiceNum})
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                    Belum Ditagihkan
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#57534e] truncate mt-0.5">
                                {getReportTitleSummary(rep)}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 3. Nominal Tagihan (Fleksibel) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1c1917]">
                  3. Nominal Tagihan (Rp)
                </label>

                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Rp 200.000 (4 Sesi)", value: 200000 },
                    { label: "Rp 150.000 (3 Sesi)", value: 150000 },
                    { label: "Rp 100.000 (2 Sesi)", value: 100000 },
                    { label: "Rp 50.000 (1 Sesi)", value: 50000 },
                  ].map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setAmount(preset.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        Number(amount) === preset.value
                          ? "bg-amber-500 text-white border-amber-500"
                          : "bg-[#fdfbf7] text-[#1c1917] border-[#e5e0d8] hover:border-amber-400"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#57534e]">
                    Rp
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#e5e0d8] bg-[#fdfbf7] text-base font-black text-[#1c1917] focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* 4. Catatan Tambahan */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1c1917]">
                  4. Catatan Tagihan (Opsional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Tagihan les privat koding Python (Paket 4 Pertemuan)"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e5e0d8] bg-[#fdfbf7] text-xs sm:text-sm text-[#1c1917] focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Info Rekening Statis */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs text-[#57534e]">
                <div>
                  <span className="font-bold text-[#1c1917] block">
                    Rekening Tujuan Tercantum:
                  </span>
                  <span>Bank Mandiri - 1380018308176 a.n. MUHAMMAD HARDIANSYAH</span>
                </div>
                <Wallet className="w-5 h-5 text-amber-700 shrink-0" />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#f0eae1]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#e5e0d8] text-xs sm:text-sm font-semibold text-[#57534e] hover:text-[#1c1917] cursor-pointer min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedStudentId || selectedReportIds.length === 0}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer min-h-[44px]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menerbitkan...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Terbitkan Tagihan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Sukses & Bagikan Link Tagihan */}
      {shareInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#e5e0d8] w-full max-w-lg overflow-hidden shadow-2xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Tagihan Siap Dibagikan</span>
              </div>
              <button
                type="button"
                onClick={() => setShareInvoiceModal(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-[#1c1917]">
                {shareInvoiceModal.invoice.invoiceNumber}
              </h3>
              <p className="text-xs sm:text-sm text-[#57534e]">
                Tagihan untuk <strong>{shareInvoiceModal.invoice.studentName}</strong> sebesar{" "}
                <strong className="text-[#1c1917]">
                  {formatRupiah(shareInvoiceModal.invoice.amount)}
                </strong>{" "}
                ({shareInvoiceModal.invoice.reportIds.length} pertemuan).
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#fdfbf7] border border-[#e5e0d8] space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
                Tautan Khusus Halaman Invoice (Tanpa Login)
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareInvoiceModal.url}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#e5e0d8] text-xs font-mono text-[#1c1917]"
                />
                <button
                  type="button"
                  onClick={() =>
                    handleCopyLink(shareInvoiceModal.invoice.token, "modal")
                  }
                  className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1c1917] hover:bg-stone-800 text-white text-xs font-bold cursor-pointer min-h-[40px]"
                >
                  {copiedId === "modal" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <a
                href={buildWhatsAppUrl(shareInvoiceModal.invoice)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition-colors min-h-[44px]"
              >
                <Share2 className="w-4 h-4" />
                <span>Kirim via WhatsApp</span>
              </a>

              <a
                href={shareInvoiceModal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs sm:text-sm font-bold transition-colors min-h-[44px]"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Lihat Halaman Invoice</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

