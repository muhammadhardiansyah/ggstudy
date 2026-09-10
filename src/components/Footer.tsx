import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t-2 border-[#e9edc9] bg-white py-6 text-xs text-[#5c677d]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#cc8b56]">GG Study</span>
          <span>&copy; {new Date().getFullYear()}</span>
          <span className="text-[#d4a373]">&bull;</span>
          <span>Platform Belajar Koding & Presentasi Interaktif</span>
        </div>
        <p className="text-[#a98467] font-medium">
          Semangat belajar dan eksplorasi logika koding!
        </p>
      </div>
    </footer>
  );
};
