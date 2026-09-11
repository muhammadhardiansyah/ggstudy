import React from "react";
import versionData from "@/data/version.json";

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t-2 border-[#e9edc9] bg-white py-6 text-xs text-[#5c677d]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <span className="font-bold text-[#cc8b56]">GG Study</span>
          <span>&copy; {new Date().getFullYear()}</span>
          <span className="text-[#d4a373]">&bull;</span>
          <span>Platform Belajar Koding &amp; Presentasi Interaktif</span>
          <span className="inline-flex items-center font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fdfbf7] text-[#cc8b56] border border-[#d4a373]/40 shadow-xs">
            v{versionData.version}
          </span>
        </div>
        <p className="text-[#a98467] font-medium">
          Semangat belajar dan eksplorasi logika koding!
        </p>
      </div>
    </footer>
  );
};
