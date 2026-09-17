import React from "react";
import Link from "next/link";
import { materials } from "@/data/materials";
import { UserNav } from "@/components/UserNav";

export const Navbar: React.FC = () => {
  return (
    <header className="border-b-2 border-[#e9edc9] bg-[#ffffff]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#d4a373] text-white font-bold flex items-center justify-center text-base shadow-sm group-hover:bg-[#cc8b56] transition-colors">
            GG
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[#cc8b56] tracking-tight text-lg leading-tight">
              GG Study
            </span>
            <span className="text-xs text-[#a98467]">
              Materi &amp; Latihan Koding Python
            </span>
          </div>
        </Link>

        {/* Right Info & User Authentication */}
        <div className="flex items-center gap-3 text-xs">
          <Link
            href="/"
            className="text-[#a98467] hover:text-[#cc8b56] font-semibold transition-colors px-2 py-1 rounded hidden sm:inline-block"
          >
            Semua Materi
          </Link>
          <span className="text-[#e9edc9] font-bold hidden sm:inline-block">|</span>
          <span className="text-[#5c677d] font-semibold bg-[#fdfbf7] px-2.5 py-1 rounded-lg border border-[#e9edc9] hidden md:inline-block">
            {materials.length} Modul Aktif
          </span>

          <UserNav />
        </div>
      </div>
    </header>
  );
};
