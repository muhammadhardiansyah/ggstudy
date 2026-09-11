import React from "react";
import Link from "next/link";
import { PlayCircle, Clock, Layers, Lock } from "lucide-react";
import { MaterialItem } from "@/types/material";
import { LevelBadge } from "./LevelBadge";
import { SlidePreview } from "./SlidePreview";

interface MaterialCardProps {
  material: MaterialItem;
}

export const MaterialCard: React.FC<MaterialCardProps> = ({ material }) => {
  return (
    <article className={`group bg-white border-2 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 ${
      material.isLocked
        ? "border-amber-200/80 shadow-[0_2px_10px_rgba(212,163,115,0.06)]"
        : "border-[#e8e1d5] hover:border-[#d4a373] shadow-[0_4px_14px_rgba(212,163,115,0.12)] hover:shadow-[0_8px_24px_rgba(212,163,115,0.22)]"
    }`}>
      <div className="space-y-3">
        {/* Top: Module Order & Level */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#cc8b56]">
              MODUL {material.orderNumber}
            </span>
            <span className="text-[#d4a373] font-bold">&bull;</span>
            <span className="text-[11px] font-semibold text-[#a98467] uppercase tracking-wider">
              {material.category}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {material.isLocked && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 shadow-xs">
                <Lock className="w-2.5 h-2.5" /> Terkunci
              </span>
            )}
            <LevelBadge level={material.level} />
          </div>
        </div>

        {/* Live First-Slide Preview */}
        {material.isLocked ? (
          <div className="relative block rounded-xl overflow-hidden cursor-not-allowed select-none">
            <div className="grayscale opacity-75">
              <SlidePreview material={material} />
            </div>
            <div className="absolute inset-0 bg-stone-900/25 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1 text-white">
              <div className="w-8 h-8 rounded-full bg-stone-900/85 flex items-center justify-center shadow-md">
                <Lock className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-[10px] font-bold tracking-wider bg-stone-900/80 px-2.5 py-0.5 rounded-md">
                Modul Terkunci
              </span>
            </div>
          </div>
        ) : (
          <Link
            href={`/materi/${material.slug}`}
            className="block focus:outline-none focus:ring-2 focus:ring-[#d4a373] rounded-xl overflow-hidden"
            title={`Buka ${material.title}`}
          >
            <SlidePreview material={material} />
          </Link>
        )}

        {/* Title & Subtitle */}
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-[#333333] group-hover:text-[#cc8b56] transition-colors leading-snug">
            {material.isLocked ? (
              <span>{material.title}</span>
            ) : (
              <Link href={`/materi/${material.slug}`} className="hover:underline">
                {material.title}
              </Link>
            )}
          </h2>
          <p className="text-xs font-semibold text-[#a98467] mt-0.5">
            {material.subtitle}
          </p>
        </div>

        {/* Description */}
        <p className="text-xs text-[#5c677d] leading-relaxed line-clamp-2">
          {material.description}
        </p>

        {/* Topics List */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {material.topics.map((topic, idx) => (
            <span
              key={idx}
              className="text-[11px] px-2.5 py-0.5 rounded-lg bg-[#fdfbf7] text-[#5c677d] font-medium border border-[#e9edc9]"
            >
              {topic}
            </span>
          ))}
        </div>
      </div>

      {/* Footer Info & Action */}
      <div className="pt-3.5 mt-4 border-t border-[#e9edc9] flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-[#5c677d] font-medium">
          <span className="inline-flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-[#a98467]" />
            {material.slideCount} Slide
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#a98467]" />
            ~{material.estimatedMinutes} Mnt
          </span>
        </div>

        {material.isLocked ? (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-100 text-stone-400 text-xs font-bold border border-stone-200 select-none cursor-not-allowed">
            <Lock className="w-3.5 h-3.5 text-stone-400" />
            <span>Belum Dibuka</span>
          </div>
        ) : (
          <Link
            href={`/materi/${material.slug}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#d4a373] hover:bg-[#cc8b56] text-white text-xs font-bold transition-all shadow-[0_2px_8px_rgba(212,163,115,0.3)] hover:-translate-y-0.5"
          >
            <PlayCircle className="w-4 h-4 text-white" />
            <span>Buka Materi</span>
          </Link>
        )}
      </div>
    </article>
  );
};
