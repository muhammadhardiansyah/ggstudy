import React from "react";
import Link from "next/link";
import { PlayCircle, Clock, Layers } from "lucide-react";
import { MaterialItem } from "@/types/material";
import { LevelBadge } from "./LevelBadge";
import { SlidePreview } from "./SlidePreview";

interface MaterialCardProps {
  material: MaterialItem;
}

export const MaterialCard: React.FC<MaterialCardProps> = ({ material }) => {
  return (
    <article className="group bg-white border-2 border-[#e8e1d5] rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-[#d4a373] shadow-[0_4px_14px_rgba(212,163,115,0.12)] hover:shadow-[0_8px_24px_rgba(212,163,115,0.22)] transition-all duration-200">
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
          <LevelBadge level={material.level} />
        </div>

        {/* Live First-Slide Preview */}
        <Link
          href={`/materi/${material.slug}`}
          className="block focus:outline-none focus:ring-2 focus:ring-[#d4a373] rounded-xl overflow-hidden"
          title={`Buka ${material.title}`}
        >
          <SlidePreview material={material} />
        </Link>

        {/* Title & Subtitle */}
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-[#333333] group-hover:text-[#cc8b56] transition-colors leading-snug">
            <Link href={`/materi/${material.slug}`} className="hover:underline">
              {material.title}
            </Link>
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

        <Link
          href={`/materi/${material.slug}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#d4a373] hover:bg-[#cc8b56] text-white text-xs font-bold transition-all shadow-[0_2px_8px_rgba(212,163,115,0.3)] hover:-translate-y-0.5"
        >
          <PlayCircle className="w-4 h-4 text-white" />
          <span>Buka Materi</span>
        </Link>
      </div>
    </article>
  );
};
