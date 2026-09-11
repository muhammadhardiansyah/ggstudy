import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { materials, getMaterialBySlug } from "@/data/materials";
import { SlideViewer } from "@/components/SlideViewer";
import { LevelBadge } from "@/components/LevelBadge";
import { Clock, Layers, Lock, ArrowLeft } from "lucide-react";

interface Props {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  return materials.map((item) => ({
    slug: item.slug,
  }));
}

export function generateMetadata({ params }: Props): Metadata {
  const material = getMaterialBySlug(params.slug);
  if (!material) {
    return {
      title: "Materi Tidak Ditemukan — GG Study",
    };
  }

  return {
    title: `${material.title} — GG Study`,
    description: `${material.subtitle}. ${material.description}`,
  };
}

export default function MaterialDetailPage({ params }: Props) {
  const material = getMaterialBySlug(params.slug);

  if (!material) {
    notFound();
  }

  // Restricted Access: If module is locked by instructor
  if (material.isLocked) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg bg-white rounded-3xl border-2 border-amber-200 p-7 sm:p-9 shadow-[0_10px_35px_rgba(212,163,115,0.15)] space-y-6 text-center">
          <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-amber-200">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-black tracking-wider uppercase">
              Modul Belum Dibuka
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#cc8b56] tracking-tight">
              {material.title}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 max-w-sm mx-auto leading-relaxed">
              Materi pembelajaran ini saat ini masih dikunci oleh pengajar. Silakan selesaikan modul sebelumnya atau tunggu arahan dari pengajar untuk membuka modul ini.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-[#cc8b56] hover:bg-[#b87642] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Modul
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Interactive Slide Viewer */}
      <SlideViewer material={material} />

      {/* Module Metadata and Index */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Left 2 Cols: Content description & Topics */}
        <div className="lg:col-span-2 bg-white border-2 border-[#e8e1d5] rounded-2xl p-5 sm:p-7 space-y-5 shadow-[0_4px_14px_rgba(212,163,115,0.1)]">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#cc8b56]">
                MODUL {material.orderNumber}
              </span>
              <span className="text-[#d4a373] font-bold">&bull;</span>
              <span className="text-[11px] font-semibold text-[#a98467] uppercase tracking-wider">
                {material.category}
              </span>
              <span className="text-[#e8e1d5] font-bold">|</span>
              <LevelBadge level={material.level} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#cc8b56] leading-snug">
              {material.title}
            </h2>
            <p className="text-sm font-bold text-[#a98467]">
              {material.subtitle}
            </p>
          </div>

          <p className="text-xs sm:text-sm text-[#5c677d] leading-relaxed">
            {material.description}
          </p>

          {/* Topics Covered */}
          <div className="space-y-2.5 pt-3 border-t-2 border-dashed border-[#e9edc9]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#cc8b56] block">
              Fokus Pembelajaran di Modul Ini:
            </span>
            <div className="flex flex-wrap gap-2">
              {material.topics.map((topic, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-lg bg-[#fdfbf7] text-[#5c677d] text-xs font-medium border border-[#e9edc9]"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Module Summary & Full List of All Modules */}
        <div className="space-y-4">
          <div className="bg-white border-2 border-[#e8e1d5] rounded-2xl p-5 space-y-3 text-xs shadow-[0_4px_14px_rgba(212,163,115,0.1)]">
            <span className="font-bold text-[#cc8b56] text-sm block pb-2 border-b border-[#e9edc9]">
              Informasi Modul
            </span>
            <div className="flex items-center justify-between text-[#5c677d]">
              <span className="flex items-center gap-1.5 font-medium">
                <Layers className="w-3.5 h-3.5 text-[#a98467]" />
                Jumlah Slide
              </span>
              <span className="font-bold text-[#333]">{material.slideCount} Slide</span>
            </div>
            <div className="flex items-center justify-between text-[#5c677d]">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-[#a98467]" />
                Estimasi Waktu
              </span>
              <span className="font-bold text-[#333]">~{material.estimatedMinutes} Menit</span>
            </div>
          </div>

          {/* Complete Module Curriculum Sidebar */}
          <div className="bg-white border-2 border-[#e8e1d5] rounded-2xl p-4 space-y-2 text-xs shadow-[0_4px_14px_rgba(212,163,115,0.1)]">
            <div className="flex items-center justify-between px-1 pb-2 border-b border-[#e9edc9]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#cc8b56] block">
                Daftar Seluruh Modul
              </span>
              <span className="text-[10px] font-semibold text-[#a98467]">
                {materials.length} Materi
              </span>
            </div>
            <div className="space-y-1">
              {materials.map((m) => {
                const isCurrent = m.slug === material.slug;
                return (
                  <Link
                    key={m.id}
                    href={`/materi/${m.slug}`}
                    className={`flex items-center justify-between p-2.5 rounded-xl transition-all ${
                      isCurrent
                        ? "bg-[#d4a373] text-white font-bold shadow-xs"
                        : "hover:bg-[#fdfbf7] text-[#5c677d] hover:text-[#cc8b56]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`text-[11px] font-bold ${
                          isCurrent ? "text-white" : "text-[#cc8b56]"
                        }`}
                      >
                        {m.orderNumber}
                      </span>
                      <span className="truncate text-xs">{m.title}</span>
                    </div>
                    {isCurrent ? (
                      <span className="text-[10px] font-bold text-[#ffe8d6] shrink-0">
                        Aktif
                      </span>
                    ) : m.isLocked ? (
                      <span className="text-[10px] text-amber-600 font-bold shrink-0 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Terkunci
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#a98467] shrink-0">
                        {m.slideCount} slide
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
