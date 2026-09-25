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
  Award,
  Share2,
  Sparkles,
  MessageCircle,
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
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<"all" | "graded" | "pending">("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Code inspection modal state
  const [inspectingItem, setInspectingItem] = useState<{
    submission: Submission;
    student?: Student;
    material?: MaterialItem;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Grading modal state
  const [gradingItem, setGradingItem] = useState<{
    submission: Submission;
    student?: Student;
    material?: MaterialItem;
  } | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(95);
  const [gradeFeedback, setGradeFeedback] = useState<string>("");
  const [savingGrade, setSavingGrade] = useState<boolean>(false);
  const [gradingError, setGradingError] = useState<string>("");

  // Post-grade result share modal state
  const [gradedResult, setGradedResult] = useState<{
    submission: Submission;
    student?: Student;
    material?: MaterialItem;
    gradeUrl: string;
  } | null>(null);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

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
        // Status filter
        if (selectedStatusFilter === "graded" && sub.gradeScore === undefined) {
          return false;
        }
        if (selectedStatusFilter === "pending" && sub.gradeScore !== undefined) {
          return false;
        }
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
          const matchFeedback = sub.gradeFeedback?.toLowerCase().includes(q);

          if (
            !matchStudentName &&
            !matchStudentEmail &&
            !matchMaterialTitle &&
            !matchMaterialSlug &&
            !matchNotes &&
            !matchFeedback
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
  }, [submissions, selectedStudentFilter, selectedMaterialFilter, selectedStatusFilter, searchQuery, sortOrder, studentMap, materialMap]);

  // Metrics
  const uniqueStudentsCount = useMemo(() => {
    const set = new Set(submissions.map((s) => s.studentId));
    return set.size;
  }, [submissions]);

  const gradedSubmissionsCount = useMemo(() => {
    return submissions.filter((s) => s.gradeScore !== undefined).length;
  }, [submissions]);

  const pendingSubmissionsCount = useMemo(() => {
    return submissions.filter((s) => s.gradeScore === undefined).length;
  }, [submissions]);

  // Open Grading Modal
  function handleOpenGrading(sub: Submission, student?: Student, material?: MaterialItem) {
    setGradingItem({ submission: sub, student, material });
    setGradeScore(sub.gradeScore !== undefined ? sub.gradeScore : 95);
    setGradeFeedback(sub.gradeFeedback || "");
    setGradingError("");
  }

  // Submit Grade
  async function handleSubmitGrade(e: React.FormEvent) {
    e.preventDefault();
    if (!gradingItem) return;
    setSavingGrade(true);
    setGradingError("");

    try {
      const res = await fetch("/api/admin/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: gradingItem.submission.id,
          score: gradeScore,
          feedback: gradeFeedback,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Update local submission list
        setSubmissions((prev) =>
          prev.map((s) => (s.id === data.submission.id ? data.submission : s))
        );
        const savedSub = data.submission;
        const currentStudent = gradingItem.student;
        const currentMaterial = gradingItem.material;
        setGradingItem(null);

        // Open share modal with generated URL
        setGradedResult({
          submission: savedSub,
          student: currentStudent,
          material: currentMaterial,
          gradeUrl: data.gradeUrl,
        });
      } else {
        setGradingError(data.error || "Gagal menyimpan penilaian.");
      }
    } catch {
      setGradingError("Terjadi gangguan koneksi saat menyimpan penilaian.");
    } finally {
      setSavingGrade(false);
    }
  }

  // Predicate label based on score
  function getScorePredicate(score: number) {
    if (score >= 95) return { label: "Luar Biasa!", color: "text-emerald-700 bg-emerald-50 border-emerald-300" };
    if (score >= 85) return { label: "Sangat Baik!", color: "text-blue-700 bg-blue-50 border-blue-300" };
    if (score >= 75) return { label: "Kerja Bagus!", color: "text-amber-700 bg-amber-50 border-amber-300" };
    return { label: "Cukup Baik", color: "text-stone-700 bg-stone-50 border-stone-300" };
  }

  // Construct WhatsApp Share URL
  function getWhatsAppShareUrl(studentName: string, moduleTitle: string, score: number, gradeUrl: string) {
    const text = `Halo ${studentName}! \n\nTugas kodingan kamu untuk modul *${moduleTitle}* sudah selesai dinilai oleh pengajar dengan skor *${score}/100*.\n\nKamu bisa melihat rincian ulasan lengkap dan catatan belajarmu melalui tautan ini:\n${gradeUrl}\n\nTerus semangat belajar koding ya!`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  }

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

  // Keyboard navigation for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (gradedResult) setGradedResult(null);
        else if (gradingItem) setGradingItem(null);
        else if (inspectingItem) setInspectingItem(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gradingItem, gradedResult, inspectingItem]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#e5e0d8] shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#1c1917] tracking-tight flex items-center gap-2">
            <FileCode className="w-5 h-5 text-amber-700" />
            Dashboard Penilaian &amp; Tugas Murid
          </h2>
          <p className="text-xs sm:text-sm text-[#57534e] mt-1">
            Periksa kodingan siswa, berikan nilai beserta feedback, dan bagikan tautan nilai mandiri ke siswa.
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
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#e5e0d8] flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700 shrink-0">
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[#57534e] font-medium">Total Tugas Masuk</div>
            <div className="text-xl font-bold text-[#1c1917]">{submissions.length} Tugas</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#e5e0d8] flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-xs text-[#57534e] font-medium">Sudah Dinilai</div>
            <div className="text-xl font-bold text-emerald-800">{gradedSubmissionsCount} Tugas</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#e5e0d8] flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0">
            <Award className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <div className="text-xs text-[#57534e] font-medium">Menunggu Nilai</div>
            <div className="text-xl font-bold text-amber-900">{pendingSubmissionsCount} Tugas</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#e5e0d8] flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-800 shrink-0">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-xs text-[#57534e] font-medium">Siswa Aktif</div>
            <div className="text-xl font-bold text-[#1c1917]">{uniqueStudentsCount} Siswa</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-[#e5e0d8] p-4 sm:p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
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

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-stone-50 border border-[#e5e0d8] rounded-xl focus:outline-none focus:border-amber-700 text-[#1c1917] cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu Nilai ({pendingSubmissionsCount})</option>
              <option value="graded">Sudah Dinilai ({gradedSubmissionsCount})</option>
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
              {searchQuery || selectedStudentFilter !== "all" || selectedMaterialFilter !== "all" || selectedStatusFilter !== "all"
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
                  <th className="px-5 py-3.5">Status &amp; Nilai</th>
                  <th className="px-5 py-3.5">Berkas &amp; Catatan</th>
                  <th className="px-5 py-3.5">Waktu</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e0d8]">
                {filteredSubmissions.map((sub) => {
                  const student = studentMap.get(sub.studentId);
                  const material = materialMap.get(sub.materialSlug);
                  const isGraded = sub.gradeScore !== undefined && sub.gradeScore !== null;
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

                  const origin = typeof window !== "undefined" ? window.location.origin : "";
                  const publicGradeUrl = sub.gradeToken ? `${origin}/nilai/${sub.gradeToken}` : "";

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

                      {/* Status & Nilai */}
                      <td className="px-5 py-4">
                        {isGraded ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold shadow-2xs">
                                <Award className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Nilai: {sub.gradeScore}/100</span>
                              </span>
                              {publicGradeUrl && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(publicGradeUrl);
                                    alert("Link nilai berhasil disalin ke clipboard!");
                                  }}
                                  className="p-1 rounded-md text-emerald-800 hover:bg-emerald-100 transition-colors"
                                  title="Salin Link Halaman Nilai"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            {sub.gradeFeedback && (
                              <p className="text-[11px] text-stone-500 italic line-clamp-1 max-w-[200px]">
                                {sub.gradeFeedback}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium">
                            Belum Dinilai
                          </span>
                        )}
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
                          {/* Tombol Beri Nilai / Edit Nilai */}
                          <button
                            type="button"
                            onClick={() => handleOpenGrading(sub, student, material)}
                            className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                              isGraded
                                ? "bg-white hover:bg-stone-100 text-stone-800 border border-stone-300"
                                : "bg-amber-600 hover:bg-amber-700 text-white"
                            }`}
                            title={isGraded ? "Edit penilaian atau bagikan tautan nilai" : "Beri nilai dan ulasan kodingan"}
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>{isGraded ? "Edit Nilai" : "Beri Nilai"}</span>
                          </button>

                          {/* Tombol Periksa Kode */}
                          <button
                            type="button"
                            onClick={() =>
                              setInspectingItem({
                                submission: sub,
                                student,
                                material,
                              })
                            }
                            className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="Buka penampil kodingan siswa"
                          >
                            <Code2 className="w-3.5 h-3.5 text-stone-600" />
                            <span className="hidden xl:inline">Periksa</span>
                          </button>

                          {onSelectForReport && student && (
                            <button
                              type="button"
                              onClick={() => onSelectForReport(student.id, sub.materialSlug)}
                              className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Buat laporan belajar untuk orang tua"
                            >
                              <Send className="w-3.5 h-3.5 text-stone-600" />
                              <span className="hidden xl:inline">Laporan</span>
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

      {/* MODAL 1: STUDIO PENILAIAN TUGAS (GRADING STUDIO) */}
      {gradingItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget && !savingGrade) setGradingItem(null);
          }}
        >
          <div className="w-full max-w-5xl bg-white rounded-2xl sm:rounded-3xl border border-stone-300 shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-stone-900 px-5 py-3.5 border-b border-stone-800 flex items-center justify-between gap-3 text-white">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400 shrink-0" />
                  <h3 className="text-base font-bold tracking-tight truncate">
                    Formulir Penilaian Koding Siswa
                  </h3>
                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                    MODUL {gradingItem.material?.orderNumber || "??"}
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5 truncate">
                  Siswa: <strong className="text-white">{gradingItem.student?.name || "Siswa"}</strong> &bull; Materi: {gradingItem.material?.title || gradingItem.submission.materialSlug}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setGradingItem(null)}
                disabled={savingGrade}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                aria-label="Tutup formulir penilaian"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Split Screen (Left: Student Code, Right: Grading Form) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-stone-200">
              {/* Sisi Kiri: Kodingan Siswa */}
              <div className="lg:col-span-6 p-4 sm:p-5 space-y-3 bg-[#fdfbf7] flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1c1917] flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-amber-700" />
                    Karya Kodingan Siswa
                  </span>
                  <span className="font-mono text-xs text-stone-500">
                    {gradingItem.submission.fileName || "main.py"}
                  </span>
                </div>

                {gradingItem.submission.notes && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
                    <span className="font-semibold block mb-0.5 text-amber-900">Catatan dari Siswa:</span>
                    <p className="whitespace-pre-line leading-relaxed">{gradingItem.submission.notes}</p>
                  </div>
                )}

                <div className="rounded-xl border border-stone-800 overflow-hidden bg-[#1e1e1e] flex-1 flex flex-col min-h-[260px]">
                  <div className="bg-[#252526] px-4 py-2 border-b border-[#333333] flex items-center justify-between text-xs text-stone-400">
                    <span className="font-mono">{gradingItem.submission.fileName || "main.py"}</span>
                    <span className="uppercase text-[10px] text-amber-400 font-bold tracking-wider">
                      {gradingItem.submission.language || "python"}
                    </span>
                  </div>
                  <pre className="p-4 text-xs font-mono text-[#d4d4d4] overflow-auto leading-relaxed flex-1 max-h-[420px] selection:bg-[#264f78]">
                    <code>{gradingItem.submission.codeContent || "# (Tidak ada kode teks)"}</code>
                  </pre>
                </div>
              </div>

              {/* Sisi Kanan: Formulir Penilaian Pengajar */}
              <div className="lg:col-span-6 p-4 sm:p-6 space-y-5 bg-white flex flex-col justify-between">
                <form id="grading-form" onSubmit={handleSubmitGrade} className="space-y-5">
                  {gradingError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                      {gradingError}
                    </div>
                  )}

                  {/* Skor Nilai (0 - 100) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#1c1917] uppercase tracking-wider block">
                        Skor Akhir (0 - 100) *
                      </label>
                      {/* Predikat Badge */}
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getScorePredicate(gradeScore).color}`}>
                        {getScorePredicate(gradeScore).label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        required
                        value={gradeScore}
                        onChange={(e) => setGradeScore(Math.min(100, Math.max(0, Number(e.target.value))))}
                        className="w-28 px-3.5 py-2.5 text-2xl font-black text-amber-900 bg-amber-50/60 border-2 border-amber-300 rounded-xl focus:outline-none focus:border-amber-600 text-center"
                      />
                      <span className="text-sm font-bold text-stone-400">/ 100</span>

                      {/* Tombol Preset Cepat */}
                      <div className="flex flex-wrap gap-1.5 flex-1">
                        {[100, 95, 90, 85, 80].map((preset) => (
                          <button
                            type="button"
                            key={preset}
                            onClick={() => setGradeScore(preset)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                              gradeScore === preset
                                ? "bg-amber-700 text-white border-amber-700 shadow-2xs"
                                : "bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200"
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Ulasan & Catatan Pengajar */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#1c1917] uppercase tracking-wider block">
                      Ulasan &amp; Apresiasi Pengajar
                    </label>
                    <p className="text-[11px] text-stone-500 leading-tight">
                      Catatan ini akan dibaca oleh siswa di halaman nilai mereka untuk memotivasi belajarnya:
                    </p>
                    <textarea
                      rows={4}
                      value={gradeFeedback}
                      onChange={(e) => setGradeFeedback(e.target.value)}
                      placeholder="Contoh: Logika program Python ananda berjalan dengan sangat baik! Penanganan perulangan dan variabel sudah tepat. Terus asah kreativitas kodingmu ya..."
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-amber-700 text-[#1c1917] leading-relaxed"
                    />

                    {/* Template Cepat */}
                    <div className="pt-1">
                      <span className="text-[10px] font-semibold text-stone-400 block mb-1">
                        Gunakan inspirasi cepat:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setGradeFeedback(
                              "Logika program berjalan dengan sangat rapi dan berhasil menyelesaikan seluruh tantangan modul dengan tepat! Kerja luar biasa!"
                            )
                          }
                          className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[10px] font-medium transition-colors cursor-pointer"
                        >
                          + Sangat Rapi &amp; Sempurna
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setGradeFeedback(
                              "Pemahaman konsep dasar dan sintaks sudah sangat mantap. Tingkatkan terus latihan kodingmu pada modul berikutnya!"
                            )
                          }
                          className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[10px] font-medium transition-colors cursor-pointer"
                        >
                          + Pemahaman Mantap
                        </button>
                      </div>
                    </div>
                  </div>
                </form>

                {/* Footer Actions */}
                <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setGradingItem(null)}
                    disabled={savingGrade}
                    className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    form="grading-form"
                    disabled={savingGrade}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {savingGrade ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menyimpan Nilai...</span>
                      </>
                    ) : (
                      <>
                        <Award className="w-4 h-4" />
                        <span>Simpan &amp; Terbitkan Link Nilai</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SUKSES PENILAIAN & BAGIKAN LINK NILAI */}
      {gradedResult && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="w-full max-w-lg bg-white rounded-3xl border border-stone-300 shadow-2xl p-6 sm:p-7 space-y-5">
            {/* Header Icon & Title */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#1c1917] tracking-tight">
                Penilaian Berhasil Diterbitkan!
              </h3>
              <p className="text-xs text-[#57534e] max-w-md mx-auto leading-relaxed">
                Tugas <strong className="text-[#1c1917]">{gradedResult.student?.name}</strong> pada modul{" "}
                <strong className="text-[#1c1917]">{gradedResult.material?.title}</strong> telah dinilai dengan skor{" "}
                <strong className="text-emerald-700">{gradedResult.submission.gradeScore}/100</strong>.
              </p>
            </div>

            {/* Link Box */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-300 space-y-2">
              <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                Tautan Halaman Nilai Publik Mandiri:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={gradedResult.gradeUrl}
                  className="flex-1 px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs font-mono text-stone-800 focus:outline-none select-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(gradedResult.gradeUrl);
                    setCopiedShareLink(true);
                    setTimeout(() => setCopiedShareLink(false), 2500);
                  }}
                  className="min-h-[38px] px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {copiedShareLink ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <a
                href={getWhatsAppShareUrl(
                  gradedResult.student?.name || "Siswa",
                  gradedResult.material?.title || "Koding",
                  gradedResult.submission.gradeScore || 100,
                  gradedResult.gradeUrl
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[44px] py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Kirimkan Langsung ke WhatsApp Siswa</span>
              </a>

              <a
                href={gradedResult.gradeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[44px] py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-stone-500" />
                <span>Buka &amp; Periksa Halaman Nilai Siswa</span>
              </a>
            </div>

            {/* Close Button */}
            <div className="pt-2 border-t border-stone-200 text-center">
              <button
                type="button"
                onClick={() => setGradedResult(null)}
                className="text-xs text-stone-500 hover:text-stone-800 font-semibold cursor-pointer py-1"
              >
                Tutup Jendela Ini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: PENAMPIL KODINGAN SAJA (INSPECT CODE) */}
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
                  {inspectingItem.submission.gradeScore !== undefined && (
                    <span className="ml-2 text-emerald-400 font-semibold">
                      &bull; Nilai: {inspectingItem.submission.gradeScore}/100
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
              <button
                type="button"
                onClick={() => {
                  const currentItem = inspectingItem;
                  setInspectingItem(null);
                  handleOpenGrading(currentItem.submission, currentItem.student, currentItem.material);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" />
                <span>
                  {inspectingItem.submission.gradeScore !== undefined ? "Ubah Nilai Tugas Ini" : "Beri Nilai Tugas Ini Sekarang"}
                </span>
              </button>

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
