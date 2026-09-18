"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FileCode,
  Search,
  CheckCircle2,
  Calendar,
  User,
  Layers,
  Code2,
  Copy,
  Check,
  Download,
  X,
  ExternalLink,
  Send,
  Loader2,
  BookOpen,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { Student, Submission } from "@/types/student";
import { MaterialItem } from "@/types/material";
import { LevelBadge } from "@/components/LevelBadge";

interface SubmissionsDashboardProps {
  onSelectForReport?: (studentId: string, materialSlug: string) => void;
}

export function SubmissionsDashboard({ onSelectForReport }: SubmissionsDashboardProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentFilter, setSelectedStudentFilter] = useState("all");
  const [selectedMaterialFilter, setSelectedMaterialFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Code inspection modal state
  const [inspectingItem, setInspectingItem] = useState<{
    submission: Submission;
    student?: Student;
    material?: MaterialItem;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Load Data
  async function loadData() {
    setIsLoading(true);
    try {
      const [resSubmissions, resStudents, resMaterials] = await Promise.all([
        fetch("/api/admin/submissions"),
        fetch("/api/admin/students"),
        fetch("/api/admin/materials"),
      ]);

      if (resSubmissions.ok) {
        const subData = await resSubmissions.json();
        setSubmissions(Array.isArray(subData.submissions) ? subData.submissions : []);
      }

      if (resStudents.ok) {
        const stdData = await resStudents.json();
        setStudents(Array.isArray(stdData) ? stdData : []);
      }

      if (resMaterials.ok) {
        const matData = await resMaterials.json();
        setMaterials(Array.isArray(matData) ? matData : []);
      }
    } catch (err) {
      console.error("Gagal memuat data pengumpulan tugas:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Maps for quick lookup
  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach((s) => map.set(s.id, s));
    return map;
  }, [students]);

  const materialMap = useMemo(() => {
    const map = new Map<string, MaterialItem>();
    materials.forEach((m) => map.set(m.slug, m));
    return map;
  }, [materials]);

  // Filtered Submissions
  const filteredSubmissions = useMemo(() => {
    return submissions
      .filter((sub) => {
        // Student filter
        if (selectedStudentFilter !== "all" && sub.studentId !== selectedStudentFilter) {
          return false;
        }
        // Material filter
        if (selectedMaterialFilter !== "all" && sub.materialSlug !== selectedMaterialFilter) {
          return false;
        }
        // Text search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const student = studentMap.get(sub.studentId);
          const material = materialMap.get(sub.materialSlug);

          const matchStudentName = student?.name.toLowerCase().includes(q);
          const matchStudentEmail = student?.studentEmail.toLowerCase().includes(q);
          const matchMaterialTitle = material?.title.toLowerCase().includes(q);
          const matchMaterialSlug = sub.materialSlug.toLowerCase().includes(q);
          const matchNotes = sub.notes?.toLowerCase().includes(q);

          if (
            !matchStudentName &&
            !matchStudentEmail &&
            !matchMaterialTitle &&
            !matchMaterialSlug &&
            !matchNotes
          ) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
      });
  }, [submissions, selectedStudentFilter, selectedMaterialFilter, searchQuery, sortOrder, studentMap, materialMap]);

  // Metrics
  const uniqueStudentsCount = useMemo(() => {
    const set = new Set(submissions.map((s) => s.studentId));
    return set.size;
  }, [submissions]);

  const uniqueMaterialsCount = useMemo(() => {
    const set = new Set(submissions.map((s) => s.materialSlug));
    return set.size;
  }, [submissions]);

  // Download Code as .py file
  function handleDownloadCode(item: { submission: Submission; student?: Student; material?: MaterialItem }) {
    if (!item.submission.codeContent) return;
    const blob = new Blob([item.submission.codeContent], { type: "text/x-python;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeStudentName = item.student?.name ? item.student.name.replace(/\s+/g, "_") : "siswa";
    const safeMaterial = item.material?.orderNumber ? `modul_${item.material.orderNumber}` : item.submission.materialSlug;
    link.href = url;
    link.download = item.submission.fileName || `${safeStudentName}_${safeMaterial}.py`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Keyboard navigation for modal
  useEffect(() => {
    if (!inspectingItem) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setInspectingItem(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inspectingItem]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#e5e0d8] shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#1c1917] tracking-tight flex items-center gap-2">
            <FileCode className="w-5 h-5 text-amber-700" />
            Dashboard Pengumpulan Tugas Murid
          </h2>
          <p className="text-xs sm:text-sm text-[#57534e] mt-1">
            Pantau dan periksa kodingan Python yang dikumpulkan oleh siswa di setiap modul materi.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors cursor-pointer shrink-0 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          )}
          <span>Muat Ulang Data</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#e5e0d8] flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 shrink-0">
            <FileCode className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-xs text-[#57534e] font-medium">Total Tugas Masuk</div>
            <div className="text-xl font-bold text-[#1c1917]">{submissions.length} Tugas</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#e5e0d8] flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0">
            <User className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <div className="text-xs text-[#57534e] font-medium">Siswa Aktif Mengumpulkan</div>
            <div className="text-xl font-bold text-[#1c1917]">{uniqueStudentsCount} Siswa</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#e5e0d8] flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-800 shrink-0">
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-xs text-[#57534e] font-medium">Modul Telah Dikerjakan</div>
            <div className="text-xl font-bold text-[#1c1917]">{uniqueMaterialsCount} Modul</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-[#e5e0d8] p-4 sm:p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Cari nama siswa, email, atau judul modul..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-stone-50 border border-[#e5e0d8] rounded-xl focus:outline-none focus:border-amber-700 text-[#1c1917]"
            />
          </div>

          {/* Student Filter */}
          <div>
            <select
              value={selectedStudentFilter}
              onChange={(e) => setSelectedStudentFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-stone-50 border border-[#e5e0d8] rounded-xl focus:outline-none focus:border-amber-700 text-[#1c1917] cursor-pointer"
            >
              <option value="all">Semua Siswa ({students.length})</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Material Filter */}
          <div>
            <select
              value={selectedMaterialFilter}
              onChange={(e) => setSelectedMaterialFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-stone-50 border border-[#e5e0d8] rounded-xl focus:outline-none focus:border-amber-700 text-[#1c1917] cursor-pointer"
            >
              <option value="all">Semua Modul ({materials.length})</option>
              {materials.map((m) => (
                <option key={m.id} value={m.slug}>
                  Modul {m.orderNumber} - {m.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort & Counter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#f0eae1] text-xs text-[#57534e]">
          <div>
            Menampilkan <span className="font-bold text-[#1c1917]">{filteredSubmissions.length}</span> dari{" "}
            {submissions.length} tugas terkumpul
          </div>

          <div className="flex items-center gap-2">
            <span className="text-stone-400">Urutkan:</span>
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"))}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium transition-colors cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-500" />
              <span>{sortOrder === "newest" ? "Paling Baru" : "Paling Lama"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Submissions List / Table */}
      <div className="bg-white rounded-2xl border border-[#e5e0d8] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-[#57534e]">
            <Loader2 className="w-6 h-6 animate-spin text-amber-700 mb-2" />
            <span className="text-xs">Memuat daftar tugas kodingan siswa...</span>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center text-[#57534e]">
            <FileCode className="w-8 h-8 mx-auto text-stone-300 mb-2" />
            <p className="text-sm font-medium text-[#1c1917]">
              {searchQuery || selectedStudentFilter !== "all" || selectedMaterialFilter !== "all"
                ? "Tidak ada tugas yang sesuai dengan kriteria filter."
                : "Belum ada tugas kodingan yang dikumpulkan oleh siswa."}
            </p>
            <p className="text-xs text-[#57534e] mt-1">
              Siswa dapat mengumpulkan kodingan melalui halaman modul materi setelah login dengan akun Google.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-xs text-[#57534e] uppercase font-semibold border-b border-[#e5e0d8]">
                <tr>
                  <th className="px-5 py-3.5">Siswa</th>
                  <th className="px-5 py-3.5">Modul Materi</th>
                  <th className="px-5 py-3.5">Berkas &amp; Catatan</th>
                  <th className="px-5 py-3.5">Waktu Pengumpulan</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e0d8]">
                {filteredSubmissions.map((sub) => {
                  const student = studentMap.get(sub.studentId);
                  const material = materialMap.get(sub.materialSlug);
                  const dateFormatted = sub.updatedAt
                    ? new Date(sub.updatedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : sub.createdAt
                    ? new Date(sub.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "-";

                  return (
                    <tr key={sub.id} className="hover:bg-stone-50/70 transition-colors">
                      {/* Siswa */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                            {student?.name ? student.name.substring(0, 2).toUpperCase() : "SW"}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-[#1c1917] truncate">
                              {student?.name || "Siswa Tidak Ditemukan"}
                            </div>
                            <div className="text-[11px] text-stone-400 truncate">
                              {student?.studentEmail || sub.studentId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Modul Materi */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              MODUL {material?.orderNumber || "??"}
                            </span>
                            {material?.level && <LevelBadge level={material.level} />}
                          </div>
                          <div className="text-xs font-semibold text-[#1c1917] line-clamp-1">
                            {material?.title || sub.materialSlug}
                          </div>
                        </div>
                      </td>

                      {/* Berkas & Catatan */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <div className="inline-flex items-center gap-1 font-mono text-xs text-stone-700 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                            <Code2 className="w-3 h-3 text-stone-500" />
                            <span>{sub.fileName || "main.py"}</span>
                          </div>
                          {sub.notes ? (
                            <p className="text-[11px] text-stone-500 italic line-clamp-1 max-w-xs">
                              &ldquo;{sub.notes}&rdquo;
                            </p>
                          ) : (
                            <span className="text-[11px] text-stone-400 block">Tanpa catatan</span>
                          )}
                        </div>
                      </td>

                      {/* Waktu */}
                      <td className="px-5 py-4 text-xs text-[#57534e]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>{dateFormatted}</span>
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setInspectingItem({
                                submission: sub,
                                student,
                                material,
                              })
                            }
                            className="min-h-[36px] px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title="Periksa dan telusuri kodingan siswa"
                          >
                            <Code2 className="w-3.5 h-3.5 text-amber-800" />
                            <span>Periksa Kode</span>
                          </button>

                          {onSelectForReport && student && (
                            <button
                              type="button"
                              onClick={() => onSelectForReport(student.id, sub.materialSlug)}
                              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              title="Buat laporan dengan menyertakan tugas ini"
                            >
                              <Send className="w-3.5 h-3.5 text-stone-600" />
                              <span className="hidden lg:inline">Buat Laporan</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Pratinjau Kodingan Siswa (VS Code Dark Theme Style) */}
      {inspectingItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspectingItem(null);
          }}
        >
          <div className="w-full max-w-3xl bg-stone-950 rounded-2xl sm:rounded-3xl border border-stone-800 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-stone-900 px-5 py-3.5 border-b border-stone-800 flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50 shrink-0">
                    MODUL {inspectingItem.material?.orderNumber || "??"}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-white truncate">
                    {inspectingItem.material?.title || inspectingItem.submission.materialSlug}
                  </h3>
                </div>
                <p className="text-xs text-stone-400 mt-0.5 truncate">
                  Siswa: <strong className="text-white">{inspectingItem.student?.name || "Siswa"}</strong> (
                  {inspectingItem.student?.studentEmail})
                  {inspectingItem.submission.updatedAt && (
                    <span className="ml-2 text-stone-500">
                      &bull; Terkumpul:{" "}
                      {new Date(inspectingItem.submission.updatedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </p>
              </div>

              {/* Actions Right */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (inspectingItem.submission.codeContent) {
                      navigator.clipboard.writeText(inspectingItem.submission.codeContent);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-medium border border-stone-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Salin kode program"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-stone-400" />
                      <span>Salin</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadCode(inspectingItem)}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-medium border border-stone-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Unduh berkas script Python (.py)"
                >
                  <Download className="w-3.5 h-3.5 text-stone-400" />
                  <span className="hidden sm:inline">Unduh .py</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInspectingItem(null)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                  aria-label="Tutup jendela pratinjau"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
              {inspectingItem.submission.notes && (
                <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-300">
                  <span className="font-semibold text-amber-400 block mb-1">Catatan Siswa:</span>
                  <p className="whitespace-pre-line leading-relaxed">{inspectingItem.submission.notes}</p>
                </div>
              )}

              {/* Code Box */}
              <div className="rounded-xl border border-stone-800 overflow-hidden bg-[#1e1e1e]">
                <div className="bg-[#252526] px-4 py-2 border-b border-[#333333] flex items-center justify-between text-xs text-stone-400">
                  <span className="font-mono">{inspectingItem.submission.fileName || "main.py"}</span>
                  <span className="uppercase text-[10px] text-amber-400 font-bold tracking-wider">
                    {inspectingItem.submission.language || "python"}
                  </span>
                </div>
                <pre className="p-4 text-xs font-mono text-[#d4d4d4] overflow-x-auto leading-relaxed max-h-96 selection:bg-[#264f78]">
                  <code>{inspectingItem.submission.codeContent || "# (Tidak ada kode teks, hanya berkas terunggah)"}</code>
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-stone-900 px-5 py-3 border-t border-stone-800 flex items-center justify-between gap-3">
              <div>
                {onSelectForReport && inspectingItem.student && (
                  <button
                    type="button"
                    onClick={() => {
                      const studentId = inspectingItem.student!.id;
                      const slug = inspectingItem.submission.materialSlug;
                      setInspectingItem(null);
                      onSelectForReport(studentId, slug);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Lanjut Buat Laporan Belajar</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setInspectingItem(null)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

