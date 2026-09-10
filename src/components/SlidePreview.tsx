import React from "react";
import { MaterialItem } from "@/types/material";
import { Play } from "lucide-react";

interface SlidePreviewProps {
  material: MaterialItem;
}

export const SlidePreview: React.FC<SlidePreviewProps> = ({ material }) => {
  const slide = material.slide1 || {
    emoji: "📘",
    bgGradient: "linear-gradient(135deg, #f5f5f4 0%, #e7e5e4 100%)",
    borderColor: "#d6d3d1",
    titleColor: "#1c1917",
    subtitleColor: "#44403c",
    tagColor: "#c2410c",
    tagText: material.level,
  };

  return (
    <div
      style={{ background: slide.bgGradient }}
      className="relative w-full aspect-[16/10] rounded-lg p-2.5 sm:p-3.5 flex items-center justify-center border border-stone-200/80 shadow-xs group/preview overflow-hidden select-none"
    >
      {/* Slide 1 White Card (Exact replica of the presentation's slide 1) */}
      <div
        style={{ borderColor: slide.borderColor }}
        className="w-[94%] h-[90%] bg-white rounded-lg sm:rounded-xl border-2 sm:border-[2.5px] p-2.5 sm:p-3 flex flex-col items-center justify-center text-center shadow-xs"
      >
        <span className="text-2xl sm:text-3xl mb-1">{slide.emoji}</span>
        <h3
          style={{ color: slide.titleColor }}
          className="text-xs sm:text-sm font-extrabold line-clamp-1 leading-tight tracking-tight"
        >
          {material.title}
        </h3>
        <p
          style={{ color: slide.subtitleColor }}
          className="text-[10px] sm:text-[11px] font-medium line-clamp-1 mt-0.5"
        >
          {material.subtitle}
        </p>
        <span
          style={{ color: slide.tagColor }}
          className="text-[9px] sm:text-[10px] font-bold italic mt-2 line-clamp-1"
        >
          {slide.tagText}
        </span>
      </div>

      {/* Play Overlay on Hover */}
      <div className="absolute inset-0 bg-stone-900/0 group-hover/preview:bg-stone-900/15 transition-all flex items-center justify-center">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-stone-900/85 text-amber-400 flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transform scale-90 group-hover/preview:scale-100 transition-all shadow-md">
          <Play className="w-3.5 h-3.5 fill-amber-400 ml-0.5" />
        </div>
      </div>
    </div>
  );
};
