"use client";

import React, { useState, useEffect } from "react";
import {
  Send,
  Upload,
  User,
  Layers,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Calendar,
  FileText,
  Mail,
  X,
  Code2,
} from "lucide-react";
import { Student, Report, Submission } from "@/types/student";
import { MaterialItem } from "@/types/material";

export function ReportsManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [reports, setReports] = useState<(Report & { studentName?: string; parentEmail?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [teacherNotes, setTeacherNotes] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Student Submissions State
  const [studentSubmissions, setStudentSubmissions] = useState<Record<string, Submission>>({});
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [inspectingSubmission, setInspectingSubmission] = useState<{
    submission: Submission;
    materialTitle: string;
    orderNumber: string;
  } | null>(null);
  const [copiedInspectCode, setCopiedInspectCode] = useState(false);

  // Status & Feedback
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [lastSentReport, setLastSentReport] = useState<{ url: string; studentName: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Delete State
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);

  // Clear notification timer
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  // Load Initial Data (Students, Materials, Reports)
  async function loadData() {
    setLoading(true);
    try {
      const [resStudents, resMaterials, resReports] = await Promise.all([
        fetch("/api/admin/students"),
        fetch("/api/admin/materials"),
        fetch("/api/admin/reports"),
      ]);

      if (resStudents.ok) {
        const stds = await resStudents.json();
        setStudents(Array.isArray(stds) ? stds : []);
      }
      if (resMaterials.ok) {
        const mats = await resMaterials.json();
        setMaterials(Array.isArray(mats) ? mats : []);
      }
      if (resReports.ok) {
        const reps = await resReports.json();
        setReports(Array.isArray(reps) ? reps : []);
      }
    } catch (err) {
      console.error("Gagal memuat data untuk form laporan:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Selected Student Object
  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Fetch Submissions for Selected Student
  useEffect(() => {
    if (!selectedStudentId) {
      setStudentSubmissions({});
      return;
    }

    async function fetchSubmissions() {
      setLoadingSubmissions(true);
      try {
        const res = await fetch(`/api/admin/submissions?studentId=${encodeURIComponent(selectedStudentId)}`);
        if (res.ok) {
          const data = await res.json();
          const map: Record<string, Submission> = {};
          if (Array.isArray(data.submissions)) {
            data.submissions.forEach((s: Submission) => {
              map[s.materialSlug] = s;
            });
          }
          setStudentSubmissions(map);
        }
      } catch (err) {
        console.error("Gagal memuat kodingan siswa:", err);
      } finally {
        setLoadingSubmissions(false);
      }
    }

    fetchSubmissions();
  }, [selectedStudentId]);

  // Toggle Material Selection (Support Multi-Material)
  function toggleMaterial(slug: string) {
    setSelectedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  // Handle Photo File Select
  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setNotification({ type: "error", message: "Berkas harus berupa gambar (JPG, PNG, WebP)." });
      return;
    }

    setPhotoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
  }

  // Submit Report
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedStudentId) {
      setNotification({ type: "error", message: "Silakan pilih siswa terlebih dahulu." });
      return;
    }

    if (selectedSlugs.length === 0) {
      setNotification({
        type: "error",
        message: "Pilih setidaknya 1 materi yang dipelajari pada sesi ini.",
      });
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("studentId", selectedStudentId);
      formData.append("materialSlugs", JSON.stringify(selectedSlugs));
      formData.append("teacherNotes", teacherNotes);
      if (photoFile) {
        formData.append("photo", photoFile);
      }

      const res = await fetch("/api/admin/reports", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNotification({
          type: "success",
          message: data.message || "Laporan berhasil dibuat & dikirimkan!",
        });
        setLastSentReport({
          url: data.reportUrl,
          studentName: selectedStudent?.name || "Siswa",
        });

        // Reset form
        setSelectedSlugs([]);
        setTeacherNotes("");
        setPhotoFile(null);
        setPhotoPreview(null);

        // Reload reports history
        const resReports = await fetch("/api/admin/reports");
        if (resReports.ok) {
          const reps = await resReports.json();
          setReports(Array.isArray(reps) ? reps : []);
        }
      } else {
        setNotification({
          type: "error",
          message: data.error || "Gagal membuat laporan.",
        });
      }
    } catch {
      setNotification({
        type: "error",
        message: "Terjadi gangguan jaringan saat mengirimkan laporan.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  // Handle Delete Report
  async function handleDeleteReport(id: string) {
    if (!confirm("Apakah kamu yakin ingin menghapus arsip laporan ini?")) return;
    setDeletingReportId(id);

    try {
      const res = await fetch(`/api/admin/reports?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        setReports((prev) => prev.filter((r) => r.id !== id));
        setNotification({ type: "success", message: "Laporan berhasil dihapus." });
      } else {
        setNotification({ type: "error", message: data.error || "Gagal menghapus laporan." });
      }
    } catch {
      setNotification({ type: "error", message: "Gagal menghapus laporan." });
    } finally {
      setDeletingReportId(null);
    }
  }

  // Copy Link to Clipboard
  function copyLink(url: string) {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 text-stone-400 hover:text-stone-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal Sukses Kirim Laporan dengan Link Cepat */}
      {lastSentReport && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 sm:p-6 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <h3 className="text-sm sm:text-base font-bold">
                Laporan untuk {lastSentReport.studentName} Berhasil Dibuat!
              </h3>
            </div>
            <button
              onClick={() => setLastSentReport(null)}
              className="text-emerald-700 hover:text-emerald-950 text-xs font-bold"
            >
              Tutup &times;
            </button>
          </div>

          <p className="text-xs text-emerald-800 leading-relaxed">
            Tautan halaman report publik aman telah dibuat. Kamu dapat membuka langsung atau menyalin tautan untuk dikirim via WhatsApp ke orang tua:
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
            <input
              type="text"
              readOnly
              value={lastSentReport.url}
              className="flex-1 px-3 py-2 text-xs bg-white border border-emerald-300 rounded-xl text-stone-700 font-mono select-all"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copyLink(lastSentReport.url)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? "Tersalin!" : "Salin Link"}</span>
              </button>
              <a
                href={lastSentReport.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-emerald-100/50 text-emerald-900 border border-emerald-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Laporan</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Form: Buat Laporan */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#e5e0d8] p-5 sm:p-7 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#1c1917] tracking-tight flex items-center gap-2">
            <Send className="w-5 h-5 text-amber-700" />
            Form Kirim Laporan Pembelajaran Siswa
          </h2>
          <p className="text-xs sm:text-sm text-[#57534e] mt-1">
            Pilih siswa, tentukan modul yang dipelajari (bisa lebih dari 1 materi), sertakan foto pertemuan, dan kirimkan laporan ke email orang tua.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2 border-t border-[#e5e0d8]">
          {/* Kolom Kiri: Pilih Siswa & Pilih Multi-Materi */}
          <div className="space-y-5">
            {/* 1. Pilih Siswa */}
            <div>
              <label className="block text-xs font-semibold text-[#1c1917] mb-1.5">
                1. Pilih Siswa <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-stone-50 border border-[#e5e0d8] rounded-xl focus:outline-none focus:border-amber-700 text-[#1c1917] cursor-pointer"
              >
                <option value="">-- Pilih Siswa Terdaftar --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.parentEmail ? `Ortu: ${s.parentEmail}` : "Email ortu belum diisi"})
                  </option>
                ))}
              </select>

              {selectedStudent && (
                <div className="mt-2 p-3 rounded-xl bg-stone-50 border border-[#e5e0d8] text-xs text-[#57534e] space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-stone-400" />
                    <span>Akun Siswa: <strong className="text-[#1c1917]">{selectedStudent.studentEmail}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                    <span>Email Orang Tua: <strong className="text-[#1c1917]">{selectedStudent.parentEmail || "Belum ada (lengkapi di menu Kelola Siswa)"}</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Pilih Materi (Multi-Select) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#1c1917]">
                  2. Materi yang Dipelajari Hari Ini <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-amber-800 font-semibold">
                  {selectedSlugs.length} Modul Terpilih
                </span>
              </div>
              <p className="text-[11px] text-[#57534e] mb-2.5">
                Klik untuk memilih satu atau beberapa modul yang dipelajari pada sesi pertemuan ini:
              </p>

              {/* Notifikasi Kodingan Terkumpul & Tombol Pilih Cepat */}
              {selectedStudentId && Object.keys(studentSubmissions).length > 0 && (
                <div className="mb-2 p-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200 flex items-center justify-between gap-2 flex-wrap animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-900 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Siswa ini telah mengumpulkan <strong>{Object.keys(studentSubmissions).length} kodingan modul</strong>.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedSlugs(Object.keys(studentSubmissions))}
                    className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Pilih Modul Terkumpul
                  </button>
                </div>
              )}

              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {materials.map((mat) => {
                  const isChecked = selectedSlugs.includes(mat.slug);
                  const sub = studentSubmissions[mat.slug];
                  return (
                    <div
                      key={mat.id}
                      onClick={() => toggleMaterial(mat.slug)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isChecked
                          ? "bg-amber-50/70 border-amber-500 shadow-2xs"
                          : sub
                          ? "bg-emerald-50/30 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50/50"
                          : "bg-white border-[#e5e0d8] hover:border-[#d4a373]/60 hover:bg-stone-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center text-xs transition-colors shrink-0 ${
                            isChecked ? "bg-amber-700 text-white" : "border border-stone-300 bg-white"
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#1c1917] truncate">
                            MODUL {mat.orderNumber} - {mat.title}
                          </div>
                          <div className="text-[11px] text-[#57534e] truncate">
                            {mat.category} &bull; Level {mat.level}
                          </div>
                        </div>
                      </div>

                      {/* Status Pengumpulan Kodingan Siswa */}
                      <div className="flex items-center gap-2 shrink-0">
                        {selectedStudentId ? (
                          loadingSubmissions ? (
                            <span className="text-[10px] text-stone-400">Memeriksa...</span>
                          ) : sub ? (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold shadow-2xs">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Kode Terkumpul</span>
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInspectingSubmission({
                                    submission: sub,
                                    materialTitle: mat.title,
                                    orderNumber: mat.orderNumber,
                                  });
                                }}
                                className="px-2 py-1 rounded-lg bg-white hover:bg-stone-100 active:bg-stone-200 text-stone-700 hover:text-stone-950 text-[10px] font-semibold border border-stone-300 transition-colors inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                                title="Lihat isi kodingan siswa"
                              >
                                <Code2 className="w-3 h-3 text-stone-600" />
                                <span>Intip</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-stone-400 font-medium">
                              Belum ada kode
                            </span>
                          )
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Foto Sesi & Catatan Guru */}
          <div className="space-y-5">
            {/* 3. Upload Foto Pertemuan */}
            <div>
              <label className="block text-xs font-semibold text-[#1c1917] mb-1.5">
                3. Foto Pertemuan Sesi Belajar Siswa <span className="text-red-500">*</span>
              </label>
              <p className="text-[11px] text-[#57534e] mb-2">
                Foto dokumentasi ananda saat sedang belajar koding bersama pengajar.
              </p>

              {photoPreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-[#e5e0d8] bg-stone-100 max-h-56 flex items-center justify-center">
                  <img
                    src={photoPreview}
                    alt="Pratinjau Foto Pertemuan"
                    className="w-full h-full object-cover max-h-56"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoFile(null);
                      setPhotoPreview(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white text-xs transition-colors"
                    title="Ganti Foto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-[#e5e0d8] hover:border-amber-700 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-stone-50 hover:bg-amber-50/40">
                  <Camera className="w-7 h-7 text-stone-400" />
                  <div className="text-center">
                    <span className="text-xs font-semibold text-amber-800 block">
                      Klik untuk memilih foto dokumentasi pertemuan
                    </span>
                    <span className="text-[11px] text-stone-400">
                      Format JPG, PNG, atau WebP
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* 4. Catatan Guru untuk Orang Tua */}
            <div>
              <label className="block text-xs font-semibold text-[#1c1917] mb-1.5">
                4. Catatan & Apresiasi Guru untuk Orang Tua
              </label>
              <textarea
                rows={4}
                placeholder="Contoh: Hari ini Budi sangat antusias belajar logic loop While True dan berhasil menyelesaikan mini-game tebak angka dengan mandiri..."
                value={teacherNotes}
                onChange={(e) => setTeacherNotes(e.target.value)}
                className="w-full p-3 text-xs sm:text-sm bg-stone-50 border border-[#e5e0d8] rounded-xl focus:outline-none focus:border-amber-700 text-[#1c1917] resize-y"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-[#e5e0d8] flex items-center justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs sm:text-sm font-semibold shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses &amp; Mengirim Laporan...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Kirim Laporan Belajar Sekarang</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Riwayat Laporan Terkirim */}
      <div className="bg-white rounded-2xl border border-[#e5e0d8] shadow-sm overflow-hidden space-y-3">
        <div className="p-5 border-b border-[#e5e0d8] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#1c1917]">Riwayat Laporan Terkirim</h3>
            <p className="text-xs text-[#57534e] mt-0.5">
              Daftar seluruh sesi laporan belajar yang telah dibuat untuk orang tua siswa.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg">
            {reports.length} Laporan
          </span>
        </div>

        {reports.length === 0 ? (
          <div className="p-10 text-center text-[#57534e]">
            <Calendar className="w-8 h-8 mx-auto text-stone-300 mb-2" />
            <p className="text-xs sm:text-sm font-medium text-[#1c1917]">
              Belum ada riwayat laporan yang dikirimkan.
            </p>
            <p className="text-xs text-[#57534e] mt-0.5">
              Isi formulir di atas untuk membuat laporan pertemuan pertama.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#e5e0d8]">
            {reports.map((rep) => {
              const reportUrl = `/report/${rep.token}`;
              const slugsCount = rep.materialSlugs?.length || 1;

              return (
                <div key={rep.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/70 transition-colors">
                  <div className="flex items-start gap-3.5 min-w-0">
                    {rep.sessionPhotoUrl ? (
                      <img
                        src={rep.sessionPhotoUrl}
                        alt="Foto Sesi"
                        className="w-12 h-12 rounded-xl object-cover border border-[#e5e0d8] shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 shrink-0">
                        <Camera className="w-5 h-5" />
                      </div>
                    )}

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#1c1917]">
                          {rep.studentName || "Siswa"}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {slugsCount} Materi Dipelajari
                        </span>
                      </div>

                      <div className="text-xs text-[#57534e]">
                        Orang Tua: <span className="font-medium text-[#1c1917]">{rep.parentEmail || "-"}</span>
                      </div>

                      <div className="text-[11px] text-stone-400">
                        Dikirim pada:{" "}
                        {rep.sentAt
                          ? new Date(rep.sentAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <a
                      href={reportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Laporan</span>
                    </a>

                    <button
                      type="button"
                      disabled={deletingReportId === rep.id}
                      onClick={() => handleDeleteReport(rep.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Hapus Laporan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Pratinjau Kodingan Siswa */}
      {inspectingSubmission && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspectingSubmission(null);
          }}
        >
          <div className="w-full max-w-3xl bg-stone-950 rounded-2xl sm:rounded-3xl border border-stone-800 shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
            {/* Modal Header */}
            <div className="bg-stone-900 px-5 py-3.5 border-b border-stone-800 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                    MODUL {inspectingSubmission.orderNumber}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-white truncate">
                    {inspectingSubmission.materialTitle}
                  </h3>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  Karya Siswa: <span className="text-white font-semibold">{selectedStudent?.name}</span>
                  {inspectingSubmission.submission.updatedAt && (
                    <span className="ml-2 text-stone-500">
                      &bull; Terkumpul:{" "}
                      {new Date(inspectingSubmission.submission.updatedAt).toLocaleDateString("id-ID", {
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

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (inspectingSubmission.submission.codeContent) {
                      navigator.clipboard.writeText(inspectingSubmission.submission.codeContent);
                      setCopiedInspectCode(true);
                      setTimeout(() => setCopiedInspectCode(false), 2000);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-medium border border-stone-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Salin kode program siswa"
                >
                  {copiedInspectCode ? (
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
                  onClick={() => setInspectingSubmission(null)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                  aria-label="Tutup jendela pratinjau"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Code View */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
              {inspectingSubmission.submission.notes && (
                <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-300">
                  <span className="font-semibold text-amber-400 block mb-1">Catatan Siswa:</span>
                  <p className="whitespace-pre-line leading-relaxed">{inspectingSubmission.submission.notes}</p>
                </div>
              )}

              <div className="rounded-xl border border-stone-800 overflow-hidden bg-[#1e1e1e]">
                <div className="bg-[#252526] px-4 py-2 border-b border-[#333333] flex items-center justify-between text-xs text-stone-400">
                  <span className="font-mono">{inspectingSubmission.submission.fileName || "main.py"}</span>
                  <span className="uppercase text-[10px] text-amber-400 font-bold tracking-wider">
                    {inspectingSubmission.submission.language || "python"}
                  </span>
                </div>
                <pre className="p-4 text-xs font-mono text-[#d4d4d4] overflow-x-auto leading-relaxed max-h-96 selection:bg-[#264f78]">
                  <code>{inspectingSubmission.submission.codeContent || "# (Tidak ada kode teks, hanya berkas terunggah)"}</code>
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-stone-900 px-5 py-3 border-t border-stone-800 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setInspectingSubmission(null)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

