import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { getSubmissionByGradeToken } from "@/lib/db";
import { GradeCodeViewer, GradeShareButton } from "@/components/GradeClientComponents";
import {
  Calendar,
  CheckCircle2,
  Award,
  Sparkles,
  BookOpen,
  ArrowRight,
  User,
  MessageSquare,
  TrendingUp,
} from "lucide-react";

interface Props {
  params: {
    token: string;
  };
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getSubmissionByGradeToken(params.token);
  if (!data || typeof data.submission.gradeScore !== "number") {
    return {
      title: "Hasil Penilaian Tidak Ditemukan | GG Study",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `Nilai Koding: ${data.student.name} (${data.submission.gradeScore}/100) | GG Study`,
    description: `Lembar hasil penilaian tugas koding materi ${data.material.title} untuk ananda ${data.student.name}.`,
    robots: { index: false, follow: false },
  };
}

function getScoreBadge(score: number) {
  if (score >= 90) {
    return {
      label: "Luar Biasa!",
      badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
      scoreClass: "text-emerald-700",
      icon: Sparkles,
      desc: "Pemahaman konsep dan implementasi koding sangat istimewa.",
    };
  }
  if (score >= 80) {
    return {
      label: "Sangat Bagus!",
      badgeClass: "bg-teal-100 text-teal-800 border-teal-300",
      scoreClass: "text-teal-700",
      icon: Award,
      desc: "Logika dan struktur kode berjalan dengan sangat baik.",
    };
  }
  if (score >= 70) {
    return {
      label: "Cukup Baik",
      badgeClass: "bg-amber-100 text-amber-900 border-amber-300",
      scoreClass: "text-amber-800",
      icon: CheckCircle2,
      desc: "Tugas selesai dengan baik, tingkatkan latihan secara berkala.",
    };
  }
  return {
    label: "Perlu Latihan Tambahan",
    badgeClass: "bg-stone-100 text-stone-800 border-stone-300",
    scoreClass: "text-stone-700",
    icon: TrendingUp,
    desc: "Perlu sedikit review dan eksplorasi kode lebih lanjut.",
  };
}

export default async function GradeShowcasePage({ params }: Props) {
  const data = await getSubmissionByGradeToken(params.token);

  if (!data) {
    notFound();
  }

  const { submission, student, material } = data;
  const score = submission.gradeScore;

  if (typeof score !== "number") {
    notFound();
  }

  const badgeInfo = getScoreBadge(score);
  const BadgeIcon = badgeInfo.icon;

  const gradedDateFormatted = submission.gradedAt
    ? new Date(submission.gradedAt).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Baru saja";

  const criteria = submission.gradeCriteria;
  const hasCriteria =
    criteria &&
    (criteria.conceptScore !== undefined ||
      criteria.cleanlinessScore !== undefined ||
      criteria.completionScore !== undefined);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-[#e5e0d8] p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f0eae1] pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#d4a373] text-white font-black flex items-center justify-center text-xl shadow-xs">
              GG
            </div>
            <div>
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                Lembar Hasil Penilaian Tugas
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-[#1c1917] tracking-tight">
                {student.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800">
              <Calendar className="w-3.5 h-3.5 text-amber-700" />
              {gradedDateFormatted}
            </span>
            <GradeShareButton
              studentName={student.name}
              materialTitle={material.title}
              score={score}
            />
          </div>
        </div>

        {/* Student & Course Info Badges */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-[#57534e]">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200 font-medium text-[#1c1917]">
            <User className="w-3.5 h-3.5 text-stone-600" />
            Siswa: <strong>{student.name}</strong>
          </span>
          {student.parentName && (
            <span className="px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200 font-medium text-[#1c1917]">
              Orang Tua: <strong>{student.parentName}</strong>
            </span>
          )}
          <span className="px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200 font-medium text-[#1c1917]">
            Tingkat: <strong>{material.level}</strong>
          </span>
        </div>
      </div>

      {/* Hero Score Showcase Card */}
      <div className="bg-white rounded-3xl border border-[#e5e0d8] p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-100/50 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
          {/* Big Score Display */}
          <div className="md:col-span-5 text-center md:text-left flex flex-col items-center md:items-start space-y-2 border-b md:border-b-0 md:border-r border-[#f0eae1] pb-6 md:pb-0 md:pr-6">
            <span className="text-xs font-bold uppercase tracking-wider text-[#57534e]">
              Nilai Akhir
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`text-6xl sm:text-7xl font-black tracking-tight ${badgeInfo.scoreClass}`}>
                {score}
              </span>
              <span className="text-2xl font-bold text-stone-400">
                / 100
              </span>
            </div>

            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold mt-2 ${badgeInfo.badgeClass}`}>
              <BadgeIcon className="w-4 h-4" />
              <span>{badgeInfo.label}</span>
            </div>

            <p className="text-xs text-[#57534e] pt-1 text-center md:text-left max-w-[260px]">
              {badgeInfo.desc}
            </p>
          </div>

          {/* Module & Criteria Detail */}
          <div className="md:col-span-7 space-y-4">
            {/* Associated Module Preview */}
            <div className="p-4 rounded-2xl bg-[#fdfbf7] border border-[#e5e0d8] space-y-2">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                Materi Modul Pembelajaran
              </span>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#1c1917] leading-snug">
                    Modul {material.orderNumber}: {material.title}
                  </h2>
                  <p className="text-xs text-[#57534e] line-clamp-2 mt-0.5">
                    {material.subtitle}
                  </p>
                </div>
                <Link
                  href={`/materi/${material.slug}`}
                  target="_blank"
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#e5e0d8] hover:border-amber-400 text-xs font-semibold text-[#1c1917] hover:bg-amber-50/50 transition-colors shadow-2xs min-h-[44px]"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                  <span>Lihat Materi</span>
                  <ArrowRight className="w-3 h-3 text-stone-400" />
                </Link>
              </div>
            </div>

            {/* Rubric / Criteria Breakdown */}
            {hasCriteria && (
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-[#1c1917] block">
                  Rincian Penilaian Aspek:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {criteria?.conceptScore !== undefined && (
                    <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                      <div className="text-[11px] text-stone-600 font-medium">Pemahaman Logika</div>
                      <div className="text-sm font-bold text-[#1c1917] mt-0.5">{criteria.conceptScore} / 100</div>
                    </div>
                  )}
                  {criteria?.cleanlinessScore !== undefined && (
                    <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                      <div className="text-[11px] text-stone-600 font-medium">Kerapian Kode</div>
                      <div className="text-sm font-bold text-[#1c1917] mt-0.5">{criteria.cleanlinessScore} / 100</div>
                    </div>
                  )}
                  {criteria?.completionScore !== undefined && (
                    <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                      <div className="text-[11px] text-stone-600 font-medium">Penyelesaian Masalah</div>
                      <div className="text-sm font-bold text-[#1c1917] mt-0.5">{criteria.completionScore} / 100</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Teacher Review & Feedback Card */}
      {submission.gradeFeedback && (
        <div className="bg-white rounded-3xl border border-[#e5e0d8] p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-[#1c1917]">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Catatan & Ulasan Pengajar</h2>
              <p className="text-[11px] text-[#57534e]">
                Evaluasi komprehensif atas pengerjaan kode siswa
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/80 text-sm sm:text-[15px] text-[#1c1917] leading-relaxed whitespace-pre-line">
            {submission.gradeFeedback}
          </div>
        </div>
      )}

      {/* Student's Code Submission */}
      {submission.codeContent && (
        <GradeCodeViewer
          fileName={submission.fileName}
          codeContent={submission.codeContent}
          studentNotes={submission.notes}
        />
      )}

      {/* Bottom Action Footer */}
      <div className="rounded-2xl bg-white border border-[#e5e0d8] p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-[#1c1917]">
            Ingin mengulang atau mempelajari kembali konsep materi?
          </h3>
          <p className="text-xs text-[#57534e] mt-0.5">
            Kamu dapat membuka kembali slide presentasi dan materi coding ini kapan saja.
          </p>
        </div>
        <Link
          href={`/materi/${material.slug}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs sm:text-sm transition-colors shadow-2xs shrink-0 min-h-[44px]"
        >
          <BookOpen className="w-4 h-4" />
          <span>Buka Slide Materi</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
