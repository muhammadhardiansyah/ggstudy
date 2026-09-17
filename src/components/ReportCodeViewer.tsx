"use client";

import React, { useState } from "react";
import { Copy, Check, FileCode, Code2 } from "lucide-react";
import { Submission } from "@/types/student";

interface Props {
  submissions: Submission[];
}

export function ReportCodeViewer({ submissions }: Props) {
  const validSubmissions = submissions.filter((s) => s.codeContent && s.codeContent.trim());
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  if (validSubmissions.length === 0) {
    return null;
  }

  const current = validSubmissions[activeTab] || validSubmissions[0];
  const codeLines = (current.codeContent || "").split("\n");

  function handleCopy() {
    if (!current.codeContent) return;
    navigator.clipboard.writeText(current.codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#2d2d2d] text-emerald-400 flex items-center justify-center border border-stone-700">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#1c1917]">
              Karya Kodingan Siswa
            </h3>
            <p className="text-[11px] text-[#57534e]">
              Kode program Python yang dikerjakan ananda pada sesi pertemuan ini.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#e5e0d8] hover:border-stone-400 text-xs font-semibold text-[#1c1917] hover:bg-stone-50 transition-colors shadow-2xs cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
          <span>{copied ? "Kode Tersalin!" : "Salin Kode"}</span>
        </button>
      </div>

      {/* VS Code Window Container */}
      <div className="rounded-2xl overflow-hidden border border-stone-800 bg-[#1e1e1e] shadow-xl text-stone-200">
        {/* VS Code Titlebar & Window Dots */}
        <div className="bg-[#252526] px-4 py-2.5 flex items-center justify-between border-b border-stone-800 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            {/* Window control dots (macOS style) */}
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block shadow-xs" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block shadow-xs" />
              <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block shadow-xs" />
            </div>

            {/* File Tabs (if multiple files or single) */}
            <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-[260px] sm:max-w-md">
              {validSubmissions.map((sub, idx) => {
                const isActive = idx === activeTab;
                const tabTitle = sub.fileName || `program_${idx + 1}.py`;
                return (
                  <button
                    key={sub.id || idx}
                    type="button"
                    onClick={() => setActiveTab(idx)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono rounded-md transition-colors cursor-pointer shrink-0 ${
                      isActive
                        ? "bg-[#1e1e1e] text-white font-medium border-t-2 border-t-amber-500"
                        : "text-stone-400 hover:text-stone-200 hover:bg-[#2d2d2d]"
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 text-amber-400" />
                    <span>{tabTitle}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <span className="text-[11px] font-mono text-stone-500 hidden sm:inline-block">
            Python 3 &bull; UTF-8
          </span>
        </div>

        {/* Code Editor Area with Line Numbers */}
        <div className="p-4 sm:p-5 overflow-x-auto flex text-xs sm:text-[13px] font-mono leading-relaxed bg-[#1e1e1e]">
          {/* Line Numbers Column */}
          <div className="select-none text-stone-600 text-right pr-4 border-r border-stone-800 shrink-0 font-mono">
            {codeLines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Code Text Column */}
          <div className="pl-4 text-emerald-300 whitespace-pre font-mono overflow-x-auto w-full">
            {codeLines.map((line, i) => (
              <div key={i} className="hover:bg-stone-800/40 px-1 rounded transition-colors">
                {line || " "}
              </div>
            ))}
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-[#007acc] px-4 py-1 flex items-center justify-between text-[11px] font-mono text-white/90">
          <div className="flex items-center gap-3">
            <span>&bull; Python</span>
            <span>{codeLines.length} baris</span>
          </div>
          <span className="truncate max-w-[200px]">
            {current.fileName || "main.py"}
          </span>
        </div>
      </div>

      {current.notes && (
        <div className="p-3 bg-white rounded-xl border border-[#e5e0d8] text-xs text-[#57534e]">
          <strong className="text-[#1c1917] block mb-0.5">Catatan Belajar Siswa:</strong>
          {current.notes}
        </div>
      )}
    </div>
  );
}

