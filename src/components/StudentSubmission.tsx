"use client";

import React, { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import {
  Code2,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Loader2,
  RotateCcw,
  Send,
  Sparkles,
} from "lucide-react";
import { Submission } from "@/types/student";

interface Props {
  materialSlug: string;
  materialTitle: string;
}

export function StudentSubmission({ materialSlug, materialTitle }: Props) {
  const { data: session, status } = useSession();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [inputMode, setInputMode] = useState<"paste" | "file">("paste");
  const [codeContent, setCodeContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch existing submission for this student & material
  useEffect(() => {
    async function fetchSubmission() {
      if (status !== "authenticated" || !session?.user?.email) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`/api/submissions?slug=${encodeURIComponent(materialSlug)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.submission) {
            setSubmission(data.submission);
            setCodeContent(data.submission.codeContent || "");
            setNotes(data.submission.notes || "");
          }
        }
      } catch (err) {
        console.error("Error fetching submission:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSubmission();
  }, [materialSlug, session, status]);

  // Handle File Selection
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".py") && !file.name.endsWith(".txt")) {
      setErrorMessage("Berkas harus berupa script Python (.py) atau teks (.txt).");
      return;
    }

    setSelectedFile(file);
    setErrorMessage("");

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCodeContent(text);
      }
    };
    reader.readAsText(file);
  }

  // Handle Submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!codeContent.trim() && !selectedFile) {
      setErrorMessage("Silakan tempelkan kode programmu atau unggah berkas .py terlebih dahulu.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("materialSlug", materialSlug);
      formData.append("codeContent", codeContent);
      formData.append("notes", notes);
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const res = await fetch("/api/submissions", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmission(data.submission);
        setIsEditing(false);
        setSuccessMessage("Kodinganmu berhasil dikumpulkan & tersimpan!");
      } else {
        setErrorMessage(data.error || "Gagal mengumpulkan kodingan.");
      }
    } catch {
      setErrorMessage("Terjadi gangguan jaringan saat mengirimkan tugas.");
    } finally {
      setSubmitting(false);
    }
  }

  // 1. STATE: BELUM LOGIN
  if (status === "unauthenticated" || !session) {
    return (
      <div className="bg-white border-2 border-[#e8e1d5] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1c1917] tracking-tight">
              Kumpulkan Hasil Kodingan Modul Ini
            </h3>
            <p className="text-xs text-[#57534e] mt-1 leading-relaxed">
              Masuk dengan akun Google agar kode Python yang kamu buat dapat tersimpan dan disertakan dalam laporan belajar orang tua.
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-[#f0eae1] flex items-center justify-between flex-wrap gap-3">
          <span className="text-xs text-stone-400 font-medium">Pengumpulan bersifat opsional per sesi</span>
          <button
            onClick={() => signIn("google")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path
                fill="#ffffff"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#ffffff"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#ffffff"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#ffffff"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Masuk dengan Google</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. STATE: LOADING
  if (loading) {
    return (
      <div className="bg-white border-2 border-[#e8e1d5] rounded-2xl p-6 shadow-xs flex items-center justify-center gap-2 text-xs text-[#57534e]">
        <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
        <span>Memeriksa status tugas modul...</span>
      </div>
    );
  }

  // 3. STATE: SUDAH MENGUMPULKAN & TIDAK DALAM MODE EDIT
  if (submission && !isEditing) {
    return (
      <div className="bg-white border-2 border-emerald-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#1c1917]">
                  Tugas Modul Telah Dikumpulkan
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Tersimpan
                </span>
              </div>
              <p className="text-[11px] text-[#57534e] mt-0.5">
                {submission.updatedAt
                  ? `Terakhir diperbarui pada ${new Date(submission.updatedAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : "Kodingan siap dilampirkan pada laporan belajar."}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 hover:border-amber-700 text-xs font-semibold text-[#57534e] hover:text-amber-800 hover:bg-amber-50/50 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Kirim Ulang / Perbarui</span>
          </button>
        </div>

        {/* Code Preview Box (VS Code Dark Style) */}
        {submission.codeContent && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[#57534e] px-1">
              <span className="font-mono text-[11px]">
                {submission.fileName || "main.py"}
              </span>
              <span className="text-[11px]">
                {submission.codeContent.split("\n").length} baris kode
              </span>
            </div>
            <div className="rounded-xl overflow-hidden border border-stone-800 bg-[#1e1e1e] text-stone-200 shadow-md">
              {/* VS Code Window Header */}
              <div className="bg-[#2d2d2d] px-3.5 py-2 flex items-center gap-2 border-b border-stone-700">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block" />
                </div>
                <span className="text-[11px] font-mono text-stone-400 pl-2 border-l border-stone-600">
                  {submission.fileName || "main.py"}
                </span>
              </div>
              <pre className="p-4 text-xs font-mono overflow-x-auto max-h-60 leading-relaxed text-emerald-300">
                <code>{submission.codeContent}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Notes */}
        {submission.notes && (
          <div className="p-3 rounded-xl bg-stone-50 border border-[#e5e0d8] text-xs text-[#57534e]">
            <span className="font-semibold text-[#1c1917] block mb-0.5">Catatanmu:</span>
            {submission.notes}
          </div>
        )}
      </div>
    );
  }

  // 4. STATE: FORM SUBMISSION (BELUM MENGUMPULKAN ATAU SEDANG EDIT)
  return (
    <div className="bg-white border-2 border-[#e8e1d5] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#f0eae1]">
        <div>
          <h3 className="text-sm font-bold text-[#1c1917] tracking-tight flex items-center gap-2">
            <Code2 className="w-4 h-4 text-amber-700" />
            {submission ? "Perbarui Kodingan Tugas" : "Kumpulkan Hasil Kodingan"}
          </h3>
          <p className="text-xs text-[#57534e] mt-0.5">
            Unggah berkas script Python (.py) atau tempelkan kodingan yang kamu buat di modul ini.
          </p>
        </div>

        {isEditing && (
          <button
            onClick={() => setIsEditing(false)}
            className="text-xs font-semibold text-stone-500 hover:text-stone-800"
          >
            Batal
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mode Switcher: Tempel Kode vs Upload File */}
        <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setInputMode("paste")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              inputMode === "paste"
                ? "bg-white text-[#1c1917] shadow-2xs"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            Ketik / Tempel Kode
          </button>
          <button
            type="button"
            onClick={() => setInputMode("file")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              inputMode === "file"
                ? "bg-white text-[#1c1917] shadow-2xs"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            Unggah Berkas .py
          </button>
        </div>

        {/* Input Mode: Paste Code */}
        {inputMode === "paste" ? (
          <div>
            <label className="block text-xs font-semibold text-[#1c1917] mb-1">
              Kode Python Hasil Belajar
            </label>
            <div className="relative rounded-xl overflow-hidden border border-stone-800 bg-[#1e1e1e]">
              <div className="bg-[#2d2d2d] px-3.5 py-1.5 flex items-center justify-between border-b border-stone-700 text-[11px] text-stone-400 font-mono">
                <span>main.py</span>
                <span>Python 3</span>
              </div>
              <textarea
                rows={7}
                placeholder="# Tulis atau tempelkan kode Python kamu di sini...&#10;print('Halo, selamat datang di sesi koding!')"
                value={codeContent}
                onChange={(e) => setCodeContent(e.target.value)}
                className="w-full p-3.5 bg-[#1e1e1e] text-emerald-300 text-xs font-mono focus:outline-none leading-relaxed resize-y"
                spellCheck={false}
              />
            </div>
          </div>
        ) : (
          /* Input Mode: File Upload */
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#1c1917]">
              Pilih Berkas Python (.py)
            </label>
            <label className="border-2 border-dashed border-[#e5e0d8] hover:border-amber-700 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-stone-50/50 hover:bg-amber-50/30">
              <Upload className="w-6 h-6 text-stone-400" />
              <div className="text-center">
                <span className="text-xs font-semibold text-amber-800 block">
                  {selectedFile ? selectedFile.name : "Klik untuk memilih berkas .py"}
                </span>
                <span className="text-[11px] text-stone-400">
                  {selectedFile ? `${Math.round(selectedFile.size / 1024)} KB` : "Maksimal 5MB"}
                </span>
              </div>
              <input
                type="file"
                accept=".py,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Optional Student Notes */}
        <div>
          <label className="block text-xs font-semibold text-[#1c1917] mb-1">
            Catatan / Kesan Belajar (Opsional)
          </label>
          <input
            type="text"
            placeholder="Contoh: Saya berhasil menjalankan program tantangan tebak angka!"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-[#e5e0d8] rounded-xl focus:outline-none focus:border-amber-700 text-[#1c1917]"
          />
        </div>

        {/* Submit Action */}
        <div className="pt-2 flex items-center justify-end gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>{submission ? "Simpan Perubahan Tugas" : "Kumpulkan Kodingan Sekarang"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

