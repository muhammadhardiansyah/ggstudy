import React from "react";
import { DifficultyLevel } from "@/types/material";

interface LevelBadgeProps {
  level: DifficultyLevel;
  className?: string;
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({ level, className = "" }) => {
  const getStyle = () => {
    switch (level) {
      case "Pemula":
        return {
          dot: "bg-[#00acc1]",
          tag: "border-[#4dd0e1] text-[#006064] bg-[#e0f7fa]/60",
        };
      case "Menengah":
        return {
          dot: "bg-[#d4a373]",
          tag: "border-[#d4a373] text-[#a98467] bg-[#ffe8d6]/60",
        };
      case "Lanjut":
        return {
          dot: "bg-[#ef233c]",
          tag: "border-[#ffb5a7] text-[#cc3344] bg-[#f8edeb]",
        };
      default:
        return {
          dot: "bg-[#a98467]",
          tag: "border-[#e9edc9] text-[#5c677d] bg-[#fdfbf7]",
        };
    }
  };

  const style = getStyle();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${style.tag} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${style.dot}`} />
      <span>{level}</span>
    </span>
  );
};
