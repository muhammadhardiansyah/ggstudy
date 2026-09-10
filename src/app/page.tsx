"use client";

import React, { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { materials } from "@/data/materials";
import { DifficultyLevel } from "@/types/material";
import { MaterialCard } from "@/components/MaterialCard";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<DifficultyLevel | "Semua">("Semua");

  // Filter materials based on search and level
  const filteredMaterials = useMemo(() => {
    return materials.filter((item) => {
      const matchLevel = selectedLevel === "Semua" || item.level === selectedLevel;
      const q = searchQuery.toLowerCase().trim();

      if (!q) return matchLevel;

      const matchText =
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.topics.some((t) => t.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q);

      return matchLevel && matchText;
    });
  }, [searchQuery, selectedLevel]);

  return (
    <div className="space-y-6">
      {/* Header Section matching Slide Presentation typography */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-dashed border-[#e9edc9] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#cc8b56] tracking-tight">
            Materi Pembelajaran Python
          </h1>
          <p className="text-xs sm:text-sm text-[#a98467] font-medium mt-0.5">
            Pilih modul di bawah untuk mulai mempresentasikan materi interaktif.
          </p>
        </div>
        <span className="text-xs font-bold text-[#cc8b56] bg-[#ffe8d6] px-3 py-1 rounded-xl border border-[#d4a373]/40 self-start sm:self-auto">
          {filteredMaterials.length} dari {materials.length} Modul
        </span>
      </div>

      {/* Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#a98467]" />
          <input
            type="text"
            placeholder="Cari materi koding..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-white rounded-xl border-2 border-[#e9edc9] text-xs text-[#333] placeholder:text-[#a98467]/70 focus:outline-none focus:border-[#d4a373] transition-colors shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#a98467] hover:text-[#333] p-0.5"
              aria-label="Bersihkan pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Level Filters */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white border border-[#e9edc9] text-xs self-start sm:self-auto">
          {(["Semua", "Pemula", "Menengah", "Lanjut"] as (DifficultyLevel | "Semua")[]).map((lvl) => {
            const isActive = selectedLevel === lvl;
            return (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  isActive
                    ? "bg-[#d4a373] text-white shadow-xs"
                    : "text-[#a98467] hover:text-[#cc8b56] hover:bg-[#fdfbf7]"
                }`}
              >
                {lvl}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2-Column Cards Grid (Compact & Fits on Screen) */}
      {filteredMaterials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredMaterials.map((material) => (
            <MaterialCard key={material.id} material={material} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-dashed border-[#e9edc9] p-8 text-center space-y-2">
          <p className="text-sm font-bold text-[#cc8b56]">Materi tidak ditemukan</p>
          <p className="text-xs text-[#5c677d]">
            Coba gunakan kata kunci pencarian yang lain atau pilih level &quot;Semua&quot;.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedLevel("Semua");
            }}
            className="mt-2 px-4 py-1.5 rounded-xl bg-[#d4a373] text-white text-xs font-bold hover:bg-[#cc8b56] transition-colors"
          >
            Tampilkan Semua Materi
          </button>
        </div>
      )}
    </div>
  );
}
