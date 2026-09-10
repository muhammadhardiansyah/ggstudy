"use client";

import React from "react";
import { Search, X, LayoutGrid, List } from "lucide-react";
import { DifficultyLevel } from "@/types/material";

interface SearchAndFilterProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedLevel: DifficultyLevel | "Semua";
  setSelectedLevel: (level: DifficultyLevel | "Semua") => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  categories: string[];
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  totalCount: number;
}

const levels: (DifficultyLevel | "Semua")[] = ["Semua", "Pemula", "Menengah", "Lanjut"];

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchQuery,
  setSearchQuery,
  selectedLevel,
  setSelectedLevel,
  selectedCategory,
  setSelectedCategory,
  categories,
  viewMode,
  setViewMode,
  totalCount,
}) => {
  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-stone-200">
        <button
          onClick={() => setSelectedCategory("Semua")}
          className={`pb-2.5 text-xs font-medium transition-colors border-b-2 -mb-px whitespace-nowrap px-1 ${
            selectedCategory === "Semua"
              ? "border-stone-900 text-stone-950 font-bold"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          Semua Kategori
        </button>
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`pb-2.5 text-xs font-medium transition-colors border-b-2 -mb-px whitespace-nowrap px-1 ${
                isActive
                  ? "border-stone-900 text-stone-950 font-bold"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Controls: Search, Level, View Mode */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Cari modul atau topik koding..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-white rounded-lg border border-stone-300 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-800 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5"
              aria-label="Bersihkan pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Level and View Mode */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          {/* Level Filter */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg border border-stone-200">
            {levels.map((lvl) => {
              const isActive = selectedLevel === lvl;
              return (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-white text-stone-900 shadow-xs font-semibold"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  {lvl}
                </button>
              );
            })}
          </div>

          {/* View Toggle (Grid vs List) */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg border border-stone-200">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1 rounded transition-colors ${
                viewMode === "grid" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-900"
              }`}
              title="Tampilan Kartu (Grid)"
              aria-label="Tampilan Kartu"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1 rounded transition-colors ${
                viewMode === "list" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-900"
              }`}
              title="Tampilan Daftar Kurikulum (List)"
              aria-label="Tampilan Daftar"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Status */}
      <div className="flex items-center justify-between text-xs text-stone-500 pt-1 font-mono">
        <span>Menampilkan {totalCount} modul</span>
        {(searchQuery || selectedLevel !== "Semua" || selectedCategory !== "Semua") && (
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedLevel("Semua");
              setSelectedCategory("Semua");
            }}
            className="text-stone-900 font-medium hover:underline cursor-pointer"
          >
            Reset Filter
          </button>
        )}
      </div>
    </div>
  );
};
