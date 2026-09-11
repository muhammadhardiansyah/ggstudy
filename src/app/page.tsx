"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { materials } from "@/data/materials";
import { DifficultyLevel } from "@/types/material";
import { MaterialCard } from "@/components/MaterialCard";

const ITEMS_PER_PAGE = 6;

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<DifficultyLevel | "Semua">("Semua");
  const [currentPage, setCurrentPage] = useState(1);

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

  // Reset to page 1 on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedLevel]);

  // Total pages
  const totalPages = Math.ceil(filteredMaterials.length / ITEMS_PER_PAGE);

  // Paginated materials
  const paginatedMaterials = useMemo(() => {
    if (filteredMaterials.length <= ITEMS_PER_PAGE) {
      return filteredMaterials;
    }
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMaterials.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredMaterials, currentPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {paginatedMaterials.map((material) => (
              <MaterialCard key={material.id} material={material} />
            ))}
          </div>

          {/* Pagination Controls (Appears when items > 6) */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t-2 border-dashed border-[#e9edc9]">
              <span className="text-xs text-[#a98467] font-medium order-2 sm:order-1">
                Menampilkan <strong className="text-[#cc8b56]">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> - <strong className="text-[#cc8b56]">{Math.min(currentPage * ITEMS_PER_PAGE, filteredMaterials.length)}</strong> dari <strong className="text-[#cc8b56]">{filteredMaterials.length}</strong> Modul
              </span>

              <div className="flex items-center gap-1.5 order-1 sm:order-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-xl border border-[#e9edc9] bg-white text-xs font-bold text-[#5c677d] hover:bg-[#ffe8d6] hover:text-[#cc8b56] disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Sebelumnya</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    const isCurrent = currentPage === pageNum;
                    return (
                      <button
                        type="button"
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                          isCurrent
                            ? "bg-[#cc8b56] text-white shadow-xs"
                            : "bg-white text-[#5c677d] hover:bg-[#ffe8d6] hover:text-[#cc8b56] border border-[#e9edc9]"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-xl border border-[#e9edc9] bg-white text-xs font-bold text-[#5c677d] hover:bg-[#ffe8d6] hover:text-[#cc8b56] disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                  aria-label="Halaman selanjutnya"
                >
                  <span className="hidden sm:inline">Selanjutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
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
            className="mt-2 px-4 py-1.5 rounded-xl bg-[#d4a373] text-white text-xs font-bold hover:bg-[#cc8b56] transition-colors cursor-pointer"
          >
            Tampilkan Semua Materi
          </button>
        </div>
      )}
    </div>
  );
}
