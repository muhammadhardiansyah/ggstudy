"use client";

import React, { useState } from "react";
import { Copy, Check, Download, Share2, Code2 } from "lucide-react";

interface GradeShareButtonProps {
  studentName: string;
  materialTitle: string;
  score: number;
}

export function GradeShareButton({
  studentName,
  materialTitle,
  score,
}: GradeShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleCopyLink}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#e5e0d8] hover:border-amber-300 text-xs sm:text-sm font-semibold text-[#1c1917] hover:bg-amber-50/50 transition-colors shadow-2xs cursor-pointer min-h-[44px]"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-700">Link Tersalin!</span>
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4 text-amber-700" />
            <span>Bagikan Halaman Ini</span>
          </>
        )}
      </button>
    </div>
  );
}

interface GradeCodeViewerProps {
  fileName?: string;
  codeContent: string;
  studentNotes?: string;
}

export function GradeCodeViewer({
  fileName,
  codeContent,
  studentNotes,
}: GradeCodeViewerProps) {
  const [copied, setCopied] = useState(false);
  const codeLines = (codeContent || "").split("\n");
  const actualFileName = fileName || "program.py";

  const handleCopy = () => {
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([codeContent], { type: "text/x-python;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = actualFileName.endsWith(".py") ? actualFileName : `${actualFileName}.py`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#252526] text-emerald-400 flex items-center justify-center border border-stone-700">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#1c1917]">
              Kode Program yang Dikerjakan
            </h3>
            <p className="text-[11px] text-[#57534e]">
              File: <span className="font-mono font-medium text-[#1c1917]">{actualFileName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#e5e0d8] hover:border-stone-400 text-xs font-semibold text-[#1c1917] hover:bg-stone-50 transition-colors shadow-2xs cursor-pointer min-h-[36px]"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-stone-500" />
                <span>Salin Kode</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer min-h-[36px]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .py</span>
          </button>
        </div>
      </div>

      {/* VS Code Window Container */}
      <div className="rounded-2xl overflow-hidden border border-stone-800 bg-[#1e1e1e] shadow-xl text-stone-200">
        {/* Title bar */}
        <div className="bg-[#252526] px-4 py-2.5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block shadow-xs" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block shadow-xs" />
              <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block shadow-xs" />
            </div>

            <div className="flex items-center gap-2 px-3 py-0.5 rounded bg-[#1e1e1e] border-t-2 border-amber-500 text-xs font-mono text-stone-200">
              <span className="text-amber-400 font-bold">Py</span>
              <span>{actualFileName}</span>
            </div>
          </div>

          <span className="text-[11px] font-mono text-stone-500 hidden sm:inline-block">
            Python 3 &bull; UTF-8
          </span>
        </div>

        {/* Code Editor Area */}
        <div className="p-4 sm:p-5 overflow-x-auto flex text-xs sm:text-[13px] font-mono leading-relaxed bg-[#1e1e1e]">
          {/* Line Numbers */}
          <div className="select-none text-stone-600 text-right pr-4 border-r border-stone-800 shrink-0 font-mono">
            {codeLines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Code Text */}
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
          <span className="truncate max-w-[200px]">{actualFileName}</span>
        </div>
      </div>

      {studentNotes && (
        <div className="p-3.5 bg-white rounded-xl border border-[#e5e0d8] text-xs text-[#57534e]">
          <strong className="text-[#1c1917] block mb-1">Catatan dari Siswa:</strong>
          <p className="whitespace-pre-line">{studentNotes}</p>
        </div>
      )}
    </div>
  );
}
