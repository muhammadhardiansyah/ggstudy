import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getReportByToken } from "@/lib/db";
import { ReportCodeViewer } from "@/components/ReportCodeViewer";
import { ReportMaterialSection } from "@/components/ReportMaterialSection";
import {
  Calendar,
  Camera,
  MessageSquare,
} from "lucide-react";

interface Props {
  params: {
    token: string;
  };
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getReportByToken(params.token);
  if (!data) {
    return {
      title: "Laporan Tidak Ditemukan | GG Study",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `Laporan Belajar: ${data.student.name} | GG Study`,
    description: `Laporan kemajuan pembelajaran koding Python untuk ananda ${data.student.name}.`,
    robots: { index: false, follow: false },
  };
}

export default async function StudentReportPage({ params }: Props) {
  const data = await getReportByToken(params.token);

  if (!data) {
    notFound();
  }

  const { report, student, materials, submissions } = data;
  const sessionDateFormatted = report.sentAt
    ? new Date(report.sentAt).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Hari ini";

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-[#e5e0d8] p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f0eae1] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#d4a373] text-white font-bold flex items-center justify-center text-lg shadow-xs">
              GG
            </div>
            <div>
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                Laporan Hasil Belajar Siswa
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-[#1c1917] tracking-tight">
                {student.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800">
              <Calendar className="w-3.5 h-3.5 text-amber-700" />
              {sessionDateFormatted}
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#57534e] leading-relaxed">
          Halo Ayah / Bunda dari <strong>{student.name}</strong>, berikut adalah dokumentasi serta capaian pembelajaran koding Python yang telah dipelajari ananda pada sesi pertemuan ini.
        </p>
      </div>

      {/* 1. Dokumentasi Foto Pertemuan */}
      {report.sessionPhotoUrl && (
        <div className="bg-white rounded-3xl border border-[#e5e0d8] p-5 sm:p-7 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-[#1c1917]">
            <Camera className="w-5 h-5 text-amber-700" />
            <h2 className="text-base sm:text-lg font-bold">Dokumentasi Pertemuan</h2>
          </div>
          <div className="rounded-2xl overflow-hidden border border-[#e5e0d8] bg-stone-100 max-h-[480px]">
            <img
              src={report.sessionPhotoUrl}
              alt={`Dokumentasi belajar ${student.name}`}
              className="w-full h-full object-cover max-h-[480px]"
            />
          </div>
          <p className="text-[11px] sm:text-xs text-[#57534e] text-center pt-1 italic">
            Dokumentasi ananda saat sedang aktif mempraktikkan koding Python bersama pengajar.
          </p>
        </div>
      )}

      {/* 2. Materi Pembelajaran yang Dikuasai (Dengan Modal Pratinjau Slide Opsional) */}
      <ReportMaterialSection materials={materials} />

      {/* 3. Karya Kodingan Siswa (Tampilan Khusus VS Code Dark Style) */}
      <ReportCodeViewer submissions={submissions} />

      {/* 4. Catatan & Apresiasi Pengajar */}
      {report.teacherNotes && (
        <div className="bg-white rounded-3xl border border-[#e5e0d8] p-5 sm:p-7 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-[#1c1917]">
            <MessageSquare className="w-5 h-5 text-amber-700" />
            <h2 className="text-base sm:text-lg font-bold">Catatan & Apresiasi Pengajar</h2>
          </div>
          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 text-xs sm:text-sm text-[#1c1917] leading-relaxed whitespace-pre-line">
            {report.teacherNotes}
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <div className="text-center pt-4 border-t border-[#e5e0d8] text-xs text-[#57534e] space-y-1">
        <p className="font-semibold text-[#1c1917]">GG Study &bull; Platform Pembelajaran Koding Siswa</p>
        <p className="text-[11px] text-stone-400">
          Laporan ini disusun secara privat untuk orang tua peserta didik.
        </p>
      </div>
    </div>
  );
}

