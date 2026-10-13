import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { getInvoiceByToken } from "@/lib/db";
import {
  CopyAccountButton,
  InvoiceActionButtons,
} from "@/components/InvoiceClientComponents";
import {
  Calendar,
  CheckCircle2,
  Clock,
  User,
  Building2,
  BookOpen,
  ExternalLink,
  Receipt,
  ShieldCheck,
} from "lucide-react";

interface Props {
  params: {
    token: string;
  };
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getInvoiceByToken(params.token);
  if (!data) {
    return {
      title: "Tagihan Tidak Ditemukan | GG Study",
      robots: { index: false, follow: false },
    };
  }

  const formatted = formatRupiah(data.invoice.amount);
  return {
    title: `Invoice ${data.invoice.invoiceNumber} - ${data.student.name} (${formatted}) | GG Study`,
    description: `Rincian tagihan pembelajaran koding Python untuk ananda ${data.student.name} sebesar ${formatted}.`,
    robots: { index: false, follow: false },
  };
}

export default async function PublicInvoicePage({ params }: Props) {
  const data = await getInvoiceByToken(params.token);

  if (!data) {
    notFound();
  }

  const { invoice, student, sessions } = data;
  const isPaid = invoice.status === "paid";
  const formattedAmount = formatRupiah(invoice.amount);

  const issuedDate = invoice.createdAt
    ? new Date(invoice.createdAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Hari ini";

  const paidDate = invoice.paidAt
    ? new Date(invoice.paidAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Action Bar */}
      <InvoiceActionButtons
        invoiceNumber={invoice.invoiceNumber}
        studentName={student.name}
        formattedAmount={formattedAmount}
        isPaid={isPaid}
      />

      {/* Main Invoice Sheet */}
      <div className="bg-white rounded-3xl border border-[#e5e0d8] p-6 sm:p-10 shadow-xs space-y-8 relative overflow-hidden">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-[#f0eae1] pb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#d4a373] text-white font-black flex items-center justify-center text-xl shadow-xs shrink-0">
              GG
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                Tagihan Pembelajaran Koding Python
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#1c1917] tracking-tight font-mono">
                {invoice.invoiceNumber}
              </h1>
              <p className="text-xs text-[#57534e] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-700" />
                <span>Tanggal Terbit: {issuedDate}</span>
              </p>
            </div>
          </div>

          {/* Payment Status Stamp */}
          <div className="flex flex-col sm:items-end gap-1.5">
            {isPaid ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-100 border-2 border-emerald-400 text-emerald-900 font-black text-sm tracking-wide uppercase shadow-2xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                <span>LUNAS / PAID</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-100 border-2 border-amber-300 text-amber-900 font-black text-sm tracking-wide uppercase shadow-2xs">
                <Clock className="w-5 h-5 text-amber-800" />
                <span>MENUNGGU PEMBAYARAN</span>
              </div>
            )}

            {isPaid && paidDate && (
              <span className="text-xs font-medium text-emerald-800">
                Dibayar pada: {paidDate}
              </span>
            )}
          </div>
        </div>

        {/* Billing Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 rounded-2xl bg-[#fdfbf7] border border-[#e5e0d8]">
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#57534e] block">
              Ditagihkan Kepada:
            </span>
            <div className="text-base font-black text-[#1c1917]">
              {student.parentName
                ? `Bapak / Ibu ${student.parentName}`
                : `Orang Tua / Wali dari ${student.name}`}
            </div>
            <div className="text-xs text-[#57534e] flex items-center gap-1.5 pt-0.5">
              <User className="w-3.5 h-3.5 text-amber-700" />
              <span>
                Siswa: <strong className="text-[#1c1917]">{student.name}</strong>
              </span>
            </div>
          </div>

          <div className="space-y-1.5 sm:text-right">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#57534e] block">
              Diterbitkan Oleh:
            </span>
            <div className="text-base font-black text-[#1c1917]">
              GG Study - Privat Coding
            </div>
            <div className="text-xs text-[#57534e]">
              Pengajar: <strong className="text-[#1c1917]">Muhammad Hardiansyah</strong>
            </div>
          </div>
        </div>

        {/* Sessions Breakdown */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-700" />
              <h2 className="text-base sm:text-lg font-bold text-[#1c1917]">
                Rincian Pertemuan yang Ditagihkan ({sessions.length} Pertemuan)
              </h2>
            </div>
          </div>

          {sessions.length === 0 ? (
            <div className="p-6 rounded-2xl border border-[#e5e0d8] text-xs text-[#57534e] text-center">
              Paket Pembelajaran Koding Python ({invoice.reportIds.length} Pertemuan)
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session, index) => {
                const sessionDate = session.sentAt || session.createdAt
                  ? new Date(session.sentAt || session.createdAt!).toLocaleDateString(
                      "id-ID",
                      {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )
                  : `Pertemuan ${index + 1}`;

                return (
                  <div
                    key={session.id}
                    className="p-4 sm:p-5 rounded-2xl border border-[#e5e0d8] bg-white hover:border-amber-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                        #{index + 1}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                            {sessionDate}
                          </span>
                        </div>
                        <div className="text-sm sm:text-base font-bold text-[#1c1917]">
                          {session.materials.length > 0
                            ? session.materials
                                .map((m) => `Modul ${m.orderNumber}: ${m.title}`)
                                .join(" & ")
                            : `Materi: ${session.materialSlug}`}
                        </div>
                        {session.teacherNotes && (
                          <p className="text-xs text-[#57534e] line-clamp-2">
                            Catatan Sesi: {session.teacherNotes}
                          </p>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/report/${session.token}`}
                      target="_blank"
                      className="self-start sm:self-center shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#fdfbf7] border border-[#e5e0d8] hover:border-amber-400 text-xs font-semibold text-[#1c1917] transition-colors min-h-[40px] print:hidden"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                      <span>Lihat Laporan Sesi</span>
                      <ExternalLink className="w-3 h-3 text-stone-400" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Total Summary Box */}
        <div className="p-6 rounded-2xl bg-[#fdfbf7] border-2 border-[#e5e0d8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#57534e] block">
              Ringkasan Tagihan
            </span>
            <div className="text-sm font-semibold text-[#1c1917]">
              Total {sessions.length || invoice.reportIds.length} Pertemuan Sesi Belajar Koding
            </div>
            {invoice.notes && (
              <p className="text-xs text-[#57534e] italic">{invoice.notes}</p>
            )}
          </div>

          <div className="sm:text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-[#57534e] block">
              Total yang Harus Dibayarkan
            </span>
            <div className="text-3xl sm:text-4xl font-black text-[#1c1917] tracking-tight mt-0.5">
              {formattedAmount}
            </div>
          </div>
        </div>

        {/* Bank Transfer Details Card */}
        <div className="rounded-3xl border-2 border-amber-300 bg-amber-50/40 p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-2xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block">
                  Metode Pembayaran Transfer Bank
                </span>
                <h3 className="text-base sm:text-lg font-black text-[#1c1917]">
                  {invoice.bankName}
                </h3>
              </div>
            </div>

            <CopyAccountButton accountNumber={invoice.accountNumber} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-amber-200/80">
            <div>
              <span className="text-xs text-[#57534e] block">Nomor Rekening:</span>
              <span className="text-xl sm:text-2xl font-mono font-black text-[#1c1917] tracking-wider select-all">
                {invoice.accountNumber}
              </span>
            </div>

            <div>
              <span className="text-xs text-[#57534e] block">Atas Nama Pemilik Rekening:</span>
              <span className="text-base sm:text-lg font-black text-[#1c1917] uppercase">
                {invoice.accountHolder}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-2 border-t border-[#f0eae1] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#57534e]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              Terima kasih atas kepercayaan Ayah / Bunda dalam mendampingi perjalanan belajar koding ananda bersama GG Study.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

