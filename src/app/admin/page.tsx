"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  UploadCloud,
  Trash2,
  ExternalLink,
  LogOut,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Sparkles,
  Layers,
  Clock,
  ArrowLeft,
  PlusCircle,
  Eye,
  Lock,
  Unlock,
  Loader2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ShieldAlert,
} from "lucide-react";
import { MaterialItem, DifficultyLevel, Slide1Theme } from "@/types/material";
import { LevelBadge } from "@/components/LevelBadge";

const COLOR_PRESETS = [
  {
    name: "Pastel Oranye (Kantin)",
    bgGradient: "linear-gradient(135deg, #fdfbf7 0%, #ffe8d6 100%)",
    borderColor: "#d4a373",
    titleColor: "#cc8b56",
    subtitleColor: "#a98467",
    tagColor: "#ef233c",
    emoji: "🍜",
  },
  {
    name: "Pastel Cyan (Robot)",
    bgGradient: "linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)",
    borderColor: "#4dd0e1",
    titleColor: "#00838f",
    subtitleColor: "#006064",
    tagColor: "#ff8f00",
    emoji: "🤖",
  },
  {
    name: "Pastel Mint (Logika)",
    bgGradient: "linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)",
    borderColor: "#5eead4",
    titleColor: "#0f766e",
    subtitleColor: "#115e59",
    tagColor: "#ef4444",
    emoji: "🛡️",
  },
  {
    name: "Pastel Lavender (Kreatif)",
    bgGradient: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
    borderColor: "#c4b5fd",
    titleColor: "#7c3aed",
    subtitleColor: "#6d28d9",
    tagColor: "#db2777",
    emoji: "✨",
  },
  {
    name: "Pastel Lemon (Algoritma)",
    bgGradient: "linear-gradient(135deg, #fefce8 0%, #fef08a 100%)",
    borderColor: "#facc15",
    titleColor: "#ca8a04",
    subtitleColor: "#854d0e",
    tagColor: "#dc2626",
    emoji: "⚡",
  },
];

const EMOJI_OPTIONS = ["🤖", "🍜", "🛡️", "🗣️", "🐍", "🔄", "📦", "💡", "🎮", "🚀", "⭐", "💻"];

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Login form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // Dashboard state
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [activeTab, setActiveTab] = useState<"upload" | "list">("upload");

  // Drag and drop reordering state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);

  // Upload Form State
  const [inputMode, setInputMode] = useState<"file" | "paste">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedHtml, setPastedHtml] = useState("");
  const [customFileName, setCustomFileName] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Fondasi Pemrograman");
  const [level, setLevel] = useState<DifficultyLevel>("Pemula");
  const [estimatedMinutes, setEstimatedMinutes] = useState(20);
  const [topics, setTopics] = useState("");
  const [slideCount, setSlideCount] = useState(6);
  const [detectedSlideCount, setDetectedSlideCount] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  // Slide 1 Customizer state
  const [emoji, setEmoji] = useState("🚀");
  const [bgGradient, setBgGradient] = useState(COLOR_PRESETS[0].bgGradient);
  const [borderColor, setBorderColor] = useState(COLOR_PRESETS[0].borderColor);
  const [titleColor, setTitleColor] = useState(COLOR_PRESETS[0].titleColor);
  const [subtitleColor, setSubtitleColor] = useState(COLOR_PRESETS[0].subtitleColor);
  const [tagColor, setTagColor] = useState(COLOR_PRESETS[0].tagColor);
  const [tagText, setTagText] = useState("Tantangan Coding: Level Pemula");

  // Form submission feedback
  const [uploadSubmitting, setUploadSubmitting] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Delete modal confirmation
  const [deletingMaterial, setDeletingMaterial] = useState<MaterialItem | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Toggle lock state
  const [togglingLockId, setTogglingLockId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    setLoadingAuth(true);
    try {
      const res = await fetch("/api/admin/check");
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
      if (data.authenticated) {
        fetchMaterials();
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setLoadingAuth(false);
    }
  }

  async function fetchMaterials() {
    try {
      const res = await fetch("/api/admin/materials");
      if (res.ok) {
        const data = await res.json();
        setMaterials(data);
      }
    } catch (err) {
      console.error("Gagal memuat materi:", err);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginSubmitting(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        fetchMaterials();
      } else {
        setLoginError(data.message || "Username atau password salah");
      }
    } catch {
      setLoginError("Terjadi gangguan koneksi");
    } finally {
      setLoginSubmitting(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      setIsAuthenticated(false);
      setUsername("");
      setPassword("");
    } catch (err) {
      console.error(err);
    }
  }

  // Handle file select and auto-detect slides
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".html")) {
      setNotification({ type: "error", message: "File harus berformat .html" });
      return;
    }

    setSelectedFile(file);

    // If title is empty, derive from file name
    if (!title) {
      const inferredTitle = file.name
        .replace(/^Presentasi_/i, "")
        .replace(/\.html$/i, "")
        .replace(/_/g, " ");
      setTitle(inferredTitle);
      setSubtitle(`Pembelajaran materi ${inferredTitle}`);
    }

    // Auto-detect slide count from file content
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const matches = text.match(/class=["'][^"']*\bslide\b[^"']*["']/gi);
        const count = matches ? matches.length : 6;
        setDetectedSlideCount(count);
        setSlideCount(count);
      }
    };
    reader.readAsText(file);
  }

  // Handle pasted HTML text change and auto-detect slides
  function handlePastedHtmlChange(text: string) {
    setPastedHtml(text);

    if (text.trim()) {
      const matches = text.match(/class=["'][^"']*\bslide\b[^"']*["']/gi);
      const count = matches && matches.length > 0 ? matches.length : 6;
      setDetectedSlideCount(count);
      setSlideCount(count);

      // If title is empty, attempt to infer from <title> or <h1>
      if (!title) {
        const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i) || text.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        if (titleMatch && titleMatch[1]) {
          const rawTitle = titleMatch[1].trim();
          setTitle(rawTitle);
          setSubtitle(`Pembelajaran materi ${rawTitle}`);
        }
      }
    } else {
      setDetectedSlideCount(null);
    }
  }

  // Apply color preset
  function applyColorPreset(preset: (typeof COLOR_PRESETS)[0]) {
    setBgGradient(preset.bgGradient);
    setBorderColor(preset.borderColor);
    setTitleColor(preset.titleColor);
    setSubtitleColor(preset.subtitleColor);
    setTagColor(preset.tagColor);
    setEmoji(preset.emoji);
  }

  // Update tagText when level changes if user hasn't customized much
  function handleLevelChange(newLevel: DifficultyLevel) {
    setLevel(newLevel);
    setTagText(`Tantangan Coding: Level ${newLevel}`);
  }

  async function handleUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (inputMode === "file" && !selectedFile) {
      setNotification({ type: "error", message: "Silakan pilih file presentasi (.html)" });
      return;
    }
    if (inputMode === "paste" && !pastedHtml.trim()) {
      setNotification({ type: "error", message: "Silakan tempel teks kode HTML materi presentasi" });
      return;
    }

    if (!title.trim()) {
      setNotification({ type: "error", message: "Judul materi wajib diisi" });
      return;
    }

    setUploadSubmitting(true);
    setNotification(null);

    try {
      const formData = new FormData();
      if (inputMode === "file" && selectedFile) {
        formData.append("file", selectedFile);
      } else {
        formData.append("htmlContent", pastedHtml);
        if (customFileName.trim()) {
          formData.append("fileName", customFileName.trim());
        }
      }
      formData.append("title", title);
      formData.append("subtitle", subtitle);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("level", level);
      formData.append("estimatedMinutes", estimatedMinutes.toString());
      formData.append("topics", topics);
      formData.append("slideCount", slideCount.toString());
      formData.append("emoji", emoji);
      formData.append("bgGradient", bgGradient);
      formData.append("borderColor", borderColor);
      formData.append("titleColor", titleColor);
      formData.append("subtitleColor", subtitleColor);
      formData.append("tagColor", tagColor);
      formData.append("tagText", tagText);
      formData.append("isLocked", isLocked ? "true" : "false");

      const res = await fetch("/api/admin/materials", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNotification({
          type: "success",
          message: `Materi "${title}" berhasil disimpan ke database Neon & Vercel Blob!`,
        });

        // Reset form
        setSelectedFile(null);
        setPastedHtml("");
        setCustomFileName("");
        setIsLocked(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setTitle("");
        setSubtitle("");
        setDescription("");
        setTopics("");
        setDetectedSlideCount(null);

        // Refresh materials and switch to list tab
        await fetchMaterials();
        setActiveTab("list");
      } else {
        setNotification({ type: "error", message: data.error || "Gagal menyimpan materi" });
      }
    } catch {
      setNotification({ type: "error", message: "Terjadi gangguan saat mengunggah materi" });
    } finally {
      setUploadSubmitting(false);
    }
  }

  async function handleGenerateWithAi() {
    const htmlToAnalyze = inputMode === "file" ? (selectedFile ? await selectedFile.text() : "") : pastedHtml;
    const fileNameForAi = inputMode === "file" ? (selectedFile?.name || "Presentasi.html") : (customFileName || "Presentasi.html");

    if (!htmlToAnalyze || !htmlToAnalyze.trim()) {
      setNotification({
        type: "error",
        message: inputMode === "file"
          ? "Silakan pilih file presentasi (.html) terlebih dahulu untuk dianalisis oleh AI."
          : "Silakan tempel teks presentasi HTML terlebih dahulu di area teks untuk dianalisis oleh AI.",
      });
      return;
    }

    setGeneratingAi(true);
    setNotification(null);

    try {
      const res = await fetch("/api/admin/generate-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          htmlContent: htmlToAnalyze,
          fileName: fileNameForAi,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.metadata) {
        const meta = data.metadata;
        if (meta.title) setTitle(meta.title);
        if (meta.subtitle) setSubtitle(meta.subtitle);
        if (meta.description) setDescription(meta.description);
        if (meta.category) setCategory(meta.category);
        if (meta.level) setLevel(meta.level);
        if (meta.estimatedMinutes) setEstimatedMinutes(meta.estimatedMinutes);
        if (meta.topics) {
          setTopics(Array.isArray(meta.topics) ? meta.topics.join(", ") : meta.topics);
        }
        if (meta.slideCount) {
          setSlideCount(meta.slideCount);
          setDetectedSlideCount(meta.slideCount);
        }
        if (meta.emoji) setEmoji(meta.emoji);
        if (typeof meta.colorPresetIndex === "number" && COLOR_PRESETS[meta.colorPresetIndex]) {
          applyColorPreset(COLOR_PRESETS[meta.colorPresetIndex]);
        }
        if (meta.tagText) setTagText(meta.tagText);

        setNotification({
          type: "success",
          message: "✨ Berhasil! Judul, kategori, topik, emoji, dan tema warna telah diisi otomatis oleh Gemini AI berdasarkan isi slide presentasi Anda.",
        });
      } else {
        setNotification({
          type: "error",
          message: data.error || "Gagal menghasilkan isian form dengan AI",
        });
      }
    } catch {
      setNotification({
        type: "error",
        message: "Terjadi kesalahan saat menghubungi layanan AI",
      });
    } finally {
      setGeneratingAi(false);
    }
  }

  async function handleToggleLock(item: MaterialItem) {
    const newStatus = !item.isLocked;
    setTogglingLockId(item.id);

    // Optimistic UI update
    setMaterials((prev) =>
      prev.map((m) => (m.id === item.id ? { ...m, isLocked: newStatus } : m))
    );

    try {
      const res = await fetch("/api/admin/materials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          isLocked: newStatus,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNotification({
          type: "success",
          message: `Materi "${item.title}" sekarang ${newStatus ? "TERKUNCI (siswa tidak bisa mengakses)" : "TERBUKA (dapat diakses siswa)"}.`,
        });
      } else {
        setNotification({ type: "error", message: data.error || "Gagal mengubah status lock" });
        await fetchMaterials();
      }
    } catch {
      setNotification({ type: "error", message: "Gagal memperbarui status materi" });
      await fetchMaterials();
    } finally {
      setTogglingLockId(null);
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingMaterial) return;
    setDeleteSubmitting(true);

    try {
      const res = await fetch(`/api/admin/materials?id=${deletingMaterial.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNotification({
          type: "success",
          message: `Materi "${deletingMaterial.title}" berhasil dihapus.`,
        });
        setMaterials(data.materials || []);
      } else {
        setNotification({ type: "error", message: data.error || "Gagal menghapus materi" });
      }
    } catch {
      setNotification({ type: "error", message: "Gagal menghapus materi" });
    } finally {
      setDeleteSubmitting(false);
      setDeletingMaterial(null);
    }
  }

  function handleDragStart(index: number, e: React.DragEvent) {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  }

  function handleDragOver(index: number, e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  }

  async function handleDrop(targetIndex: number, e: React.DragEvent) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newMaterials = [...materials];
    const [draggedItem] = newMaterials.splice(draggedIndex, 1);
    newMaterials.splice(targetIndex, 0, draggedItem);

    // Optimistically re-sequence orderNumber
    newMaterials.forEach((item, idx) => {
      item.orderNumber = (idx + 1).toString().padStart(2, "0");
    });

    setMaterials(newMaterials);
    setDraggedIndex(null);
    setDragOverIndex(null);

    await saveReorderedMaterials(newMaterials);
  }

  async function moveItem(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= materials.length) return;

    const newMaterials = [...materials];
    const temp = newMaterials[index];
    newMaterials[index] = newMaterials[targetIndex];
    newMaterials[targetIndex] = temp;

    newMaterials.forEach((item, idx) => {
      item.orderNumber = (idx + 1).toString().padStart(2, "0");
    });

    setMaterials(newMaterials);
    await saveReorderedMaterials(newMaterials);
  }

  async function saveReorderedMaterials(newMaterials: MaterialItem[]) {
    setReordering(true);
    try {
      const res = await fetch("/api/admin/materials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: newMaterials.map((m) => m.id) }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotification({
          type: "success",
          message: "Urutan materi berhasil diperbarui & disimpan!",
        });
        if (data.materials) {
          setMaterials(data.materials);
        }
      } else {
        setNotification({ type: "error", message: data.error || "Gagal mengubah urutan" });
        await fetchMaterials();
      }
    } catch {
      setNotification({ type: "error", message: "Gagal menyimpan perubahan urutan" });
      await fetchMaterials();
    } finally {
      setReordering(false);
    }
  }

  if (loadingAuth) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-2 text-[#a98467] font-medium text-sm">
          <div className="w-5 h-5 border-2 border-[#d4a373] border-t-transparent rounded-full animate-spin" />
          Memverifikasi akses admin...
        </div>
      </div>
    );
  }

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-3xl border-2 border-[#e8e1d5] p-6 sm:p-8 shadow-[0_8px_30px_rgba(212,163,115,0.12)] space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-[#ffe8d6] rounded-2xl flex items-center justify-center mx-auto border border-[#d4a373]/40 text-[#cc8b56]">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#cc8b56] tracking-tight">
              Portal Admin GG Study
            </h1>
            <p className="text-xs text-[#a98467]">
              Masukkan akun pengajar untuk mengelola materi presentasi.
            </p>
          </div>

          {loginError && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 text-xs rounded-xl p-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#cc8b56] uppercase tracking-wider block">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-3.5 py-2.5 bg-[#fdfbf7] rounded-xl border-2 border-[#e9edc9] text-xs text-[#333] placeholder:text-[#a98467]/60 focus:outline-none focus:border-[#d4a373] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#cc8b56] uppercase tracking-wider block">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-[#fdfbf7] rounded-xl border-2 border-[#e9edc9] text-xs text-[#333] placeholder:text-[#a98467]/60 focus:outline-none focus:border-[#d4a373] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loginSubmitting}
              className="w-full py-2.5 px-4 bg-[#cc8b56] hover:bg-[#b87642] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loginSubmitting ? "Memverifikasi..." : "Masuk ke Dashboard"}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-[#e9edc9]">
            <Link
              href="/"
              className="text-xs font-medium text-[#a98467] hover:text-[#cc8b56] transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" /> Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // LOGGED IN DASHBOARD
  return (
    <div className="space-y-6 pb-12">
      {/* Top Admin Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-dashed border-[#e9edc9] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#cc8b56] tracking-tight">
              Dashboard Materi
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#faedcd] text-[#cc8b56] border border-[#d4a373]/30">
              Admin Mode
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#a98467] font-medium mt-0.5">
            Unggah modul presentasi baru atau kelola daftar materi yang tersedia.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-xs font-bold text-[#cc8b56] bg-[#ffe8d6] hover:bg-[#ffd9b8] px-3 py-1.5 rounded-xl border border-[#d4a373]/40 transition-colors flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" /> Lihat Web
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs font-bold text-[#a98467] hover:text-red-600 bg-white hover:bg-red-50 px-3 py-1.5 rounded-xl border border-[#e8e1d5] hover:border-red-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Keluar
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`flex items-start justify-between gap-2 p-3.5 rounded-xl text-xs border ${
            notification.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-stone-400 hover:text-stone-600 font-bold ml-2 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#e8e1d5] gap-2">
        <button
          onClick={() => setActiveTab("upload")}
          className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeTab === "upload"
              ? "border-[#cc8b56] text-[#cc8b56]"
              : "border-transparent text-[#a98467] hover:text-[#cc8b56]"
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Form Tambah Materi
        </button>
        <button
          onClick={() => setActiveTab("list")}
          className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeTab === "list"
              ? "border-[#cc8b56] text-[#cc8b56]"
              : "border-transparent text-[#a98467] hover:text-[#cc8b56]"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Kelola Materi ({materials.length})
        </button>
      </div>

      {/* TAB 1: FORM TAMBAH MATERI */}
      {activeTab === "upload" && (
        <form onSubmit={handleUploadSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Form Inputs */}
            <div className="lg:col-span-2 bg-white rounded-2xl border-2 border-[#e8e1d5] p-5 sm:p-6 space-y-5 shadow-xs">
              <h2 className="text-sm font-black text-[#cc8b56] uppercase tracking-wider border-b border-[#e9edc9] pb-2">
                1. Berkas &amp; Informasi Utama
              </h2>

              {/* Input Mode Switcher & Content Zone */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-[#cc8b56] uppercase tracking-wider block">
                    Sumber Materi HTML *
                  </label>
                  <div className="inline-flex p-1 bg-[#f5efe6] rounded-xl border border-[#e8e1d5] gap-1 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setInputMode("file")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        inputMode === "file"
                          ? "bg-white text-[#cc8b56] shadow-xs"
                          : "text-[#a98467] hover:text-[#cc8b56]"
                      }`}
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      Unggah Berkas
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMode("paste")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        inputMode === "paste"
                          ? "bg-white text-[#cc8b56] shadow-xs"
                          : "text-[#a98467] hover:text-[#cc8b56]"
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      Tempel Teks HTML
                    </button>
                  </div>
                </div>

                {/* Mode 1: Unggah Berkas */}
                {inputMode === "file" ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      selectedFile
                        ? "border-[#cc8b56] bg-[#fdfbf7]"
                        : "border-[#d4a373]/60 bg-[#fdfbf7] hover:bg-[#fff9f3]"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".html"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-[#ffe8d6] text-[#cc8b56] flex items-center justify-center">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      {selectedFile ? (
                        <div>
                          <p className="text-xs font-bold text-[#cc8b56]">{selectedFile.name}</p>
                          <p className="text-[11px] text-[#a98467]">
                            {(selectedFile.size / 1024).toFixed(1)} KB &bull; Klik untuk mengganti berkas
                          </p>
                          {detectedSlideCount !== null && (
                            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-lg bg-green-100 text-green-800 text-[10px] font-bold">
                              &check; Otomatis terdeteksi {detectedSlideCount} slide
                            </span>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-bold text-[#cc8b56]">
                            Klik untuk memilih berkas presentasi .html
                          </p>
                          <p className="text-[11px] text-[#a98467]">
                            Berkas akan diunggah ke Vercel Blob dan disimpan secara online
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Mode 2: Tempel Teks HTML */
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <textarea
                        rows={8}
                        value={pastedHtml}
                        onChange={(e) => handlePastedHtmlChange(e.target.value)}
                        placeholder="<!DOCTYPE html>&#10;<html>&#10;  <!-- Tempelkan seluruh kode HTML slide materi Anda di sini -->&#10;  <div class=&quot;slide&quot;>...</div>&#10;</html>"
                        className="w-full p-3.5 bg-[#fdfbf7] rounded-2xl border-2 border-[#d4a373]/50 text-xs font-mono text-[#333] placeholder:text-stone-400 focus:outline-none focus:border-[#cc8b56] leading-relaxed resize-y min-h-[180px]"
                      />
                      <div className="flex items-center justify-between text-[11px] text-[#a98467] px-1">
                        <span>
                          {pastedHtml.trim() ? (
                            `${(new Blob([pastedHtml]).size / 1024).toFixed(1)} KB teks HTML`
                          ) : (
                            "Tempelkan kode sumber slide HTML lengkap"
                          )}
                        </span>
                        {detectedSlideCount !== null && (
                          <span className="px-2 py-0.5 rounded-lg bg-green-100 text-green-800 text-[10px] font-bold">
                            &check; Otomatis terdeteksi {detectedSlideCount} slide
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Custom File Name Input */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#a98467] uppercase tracking-wider block">
                        Nama Berkas Output (Opsional)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={customFileName}
                          onChange={(e) => setCustomFileName(e.target.value)}
                          placeholder="contoh: modul_09.html (opsional)"
                          className="w-full pl-8 pr-3 py-2 bg-[#fdfbf7] rounded-xl border border-[#e9edc9] text-xs font-mono text-[#333] focus:outline-none focus:border-[#d4a373]"
                        />
                        <FileCode className="w-3.5 h-3.5 text-[#a98467] absolute left-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                      <p className="text-[10px] text-stone-400 italic">
                        Jika dikosongkan, nama berkas akan otomatis dibuat dari judul modul.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* AI Auto-Fill Action Card */}
              <div className="bg-gradient-to-r from-[#ffe8d6] via-[#fefae0] to-[#e0f7fa] p-4 rounded-2xl border-2 border-[#d4a373]/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white text-[#cc8b56] flex items-center justify-center shadow-xs shrink-0 border border-[#d4a373]/30">
                    <Sparkles className={`w-5 h-5 text-[#cc8b56] ${generatingAi ? "animate-spin" : "animate-pulse"}`} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-[#cc8b56] flex items-center gap-1.5">
                      <span>Generate Isian dengan Gemini AI</span>
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-[#cc8b56] text-white">
                        AI
                      </span>
                    </h3>
                    <p className="text-[11px] text-[#a98467] leading-relaxed">
                      {(inputMode === "file" ? Boolean(selectedFile) : Boolean(pastedHtml.trim()))
                        ? "Klik tombol di samping agar AI membaca isi materi dan mengisi seluruh form secara otomatis."
                        : inputMode === "file"
                        ? "Pilih file presentasi .html di atas terlebih dahulu untuk mengaktifkan AI."
                        : "Tempel kode HTML materi di atas terlebih dahulu untuk mengaktifkan AI."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={generatingAi || !(inputMode === "file" ? Boolean(selectedFile) : Boolean(pastedHtml.trim()))}
                  onClick={handleGenerateWithAi}
                  className="self-stretch sm:self-auto px-4 py-2.5 bg-[#cc8b56] hover:bg-[#b87642] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                >
                  {generatingAi ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menganalisis Slide...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate dengan AI</span>
                    </>
                  )}
                </button>
              </div>

              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#cc8b56] uppercase tracking-wider block">
                    Judul Materi *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Pabrik Robot Pintar"
                    className="w-full px-3 py-2 bg-[#fdfbf7] rounded-xl border-2 border-[#e9edc9] text-xs text-[#333] focus:outline-none focus:border-[#d4a373]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#cc8b56] uppercase tracking-wider block">
                    Subjudul *
                  </label>
                  <input
                    type="text"
                    required
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Contoh: Membuat Fungsi Sendiri (def)"
                    className="w-full px-3 py-2 bg-[#fdfbf7] rounded-xl border-2 border-[#e9edc9] text-xs text-[#333] focus:outline-none focus:border-[#d4a373]"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#cc8b56] uppercase tracking-wider block">
                  Deskripsi Modul
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan ringkasan materi yang akan dipelajari siswa..."
                  className="w-full px-3 py-2 bg-[#fdfbf7] rounded-xl border-2 border-[#e9edc9] text-xs text-[#333] focus:outline-none focus:border-[#d4a373]"
                />
              </div>

              {/* Category, Level, Minutes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#cc8b56] uppercase tracking-wider block">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#fdfbf7] rounded-xl border-2 border-[#e9edc9] text-xs text-[#333] focus:outline-none focus:border-[#d4a373]"
                  >
                    <option value="Fondasi Pemrograman">Fondasi Pemrograman</option>
                    <option value="Studi Kasus Transaksi">Studi Kasus Transaksi</option>
                    <option value="Interaktivitas & I/O">Interaktivitas & I/O</option>
                    <option value="Logika & Percabangan">Logika & Percabangan</option>
                    <option value="Perulangan & Looping">Perulangan & Looping</option>
                    <option value="Struktur Data">Struktur Data</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#cc8b56] uppercase tracking-wider block">
                    Tingkat Kesulitan
                  </label>
                  <select
                    value={level}
                    onChange={(e) => handleLevelChange(e.target.value as DifficultyLevel)}
                    className="w-full px-3 py-2 bg-[#fdfbf7] rounded-xl border-2 border-[#e9edc9] text-xs text-[#333] focus:outline-none focus:border-[#d4a373]"
                  >
                    <option value="Pemula">Pemula</option>
                    <option value="Menengah">Menengah</option>
                    <option value="Lanjut">Lanjut</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#cc8b56] uppercase tracking-wider block">
                    Estimasi (Menit)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(parseInt(e.target.value, 10) || 20)}
                    className="w-full px-3 py-2 bg-[#fdfbf7] rounded-xl border-2 border-[#e9edc9] text-xs text-[#333] focus:outline-none focus:border-[#d4a373]"
                  />
                </div>
              </div>

              {/* Topics */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#cc8b56] uppercase tracking-wider block">
                  Topik Kunci (Pisahkan dengan Koma)
                </label>
                <input
                  type="text"
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  placeholder="Contoh: def, parameter, return value, latihan kode"
                  className="w-full px-3 py-2 bg-[#fdfbf7] rounded-xl border-2 border-[#e9edc9] text-xs text-[#333] focus:outline-none focus:border-[#d4a373]"
                />
              </div>

              {/* Custom Slide Count */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#cc8b56] uppercase tracking-wider block">
                  Jumlah Slide Presentasi
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={slideCount}
                    onChange={(e) => setSlideCount(parseInt(e.target.value, 10) || 6)}
                    className="w-28 px-3 py-2 bg-[#fdfbf7] rounded-xl border-2 border-[#e9edc9] text-xs text-[#333] focus:outline-none focus:border-[#d4a373]"
                  />
                  <span className="text-[11px] text-[#a98467]">
                    {detectedSlideCount !== null
                      ? `(Terdeteksi otomatis: ${detectedSlideCount} slide)`
                      : "(Akan terdeteksi otomatis saat berkas dipilih)"}
                  </span>
                </div>
              </div>

              {/* Status Kunci Modul (Akses Siswa) */}
              <div className="space-y-2 pt-2 border-t border-[#e9edc9]">
                <label className="text-xs font-bold text-[#cc8b56] uppercase tracking-wider block">
                  Status Kunci Modul (Akses Siswa)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsLocked(false)}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-start gap-3 cursor-pointer ${
                      !isLocked
                        ? "bg-emerald-50/80 border-emerald-500 shadow-xs"
                        : "bg-white border-[#e8e1d5] hover:border-[#d4a373]/40"
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${!isLocked ? "bg-emerald-500 text-white" : "bg-stone-100 text-stone-400"}`}>
                      <Unlock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className={`text-xs font-bold block ${!isLocked ? "text-emerald-900" : "text-stone-700"}`}>
                        Terbuka (Dapat Diakses)
                      </span>
                      <span className="text-[11px] text-stone-500 leading-tight block mt-0.5">
                        Siswa dapat langsung membuka dan mempelajari materi ini di portal.
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsLocked(true)}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-start gap-3 cursor-pointer ${
                      isLocked
                        ? "bg-amber-50/80 border-amber-500 shadow-xs"
                        : "bg-white border-[#e8e1d5] hover:border-[#d4a373]/40"
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${isLocked ? "bg-amber-500 text-white" : "bg-stone-100 text-stone-400"}`}>
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className={`text-xs font-bold block ${isLocked ? "text-amber-900" : "text-stone-700"}`}>
                        Terkunci (Dirahasiakan)
                      </span>
                      <span className="text-[11px] text-stone-500 leading-tight block mt-0.5">
                        Materi dirahasiakan dan belum dapat dibuka oleh siswa.
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Slide 1 Card Theme & Live Preview */}
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border-2 border-[#e8e1d5] p-5 space-y-4 shadow-xs">
                <h2 className="text-sm font-black text-[#cc8b56] uppercase tracking-wider border-b border-[#e9edc9] pb-2">
                  2. Tampilan Kartu Slide 1
                </h2>

                {/* Live Card Preview Box */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-[#a98467] block">
                    Pratinjau Kartu di Beranda:
                  </span>
                  <div
                    style={{ background: bgGradient }}
                    className="w-full aspect-[16/10] rounded-xl p-3 flex items-center justify-center border border-stone-200 shadow-xs relative overflow-hidden"
                  >
                    {isLocked && (
                      <div className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-md bg-amber-100/95 text-amber-900 border border-amber-300 text-[10px] font-bold flex items-center gap-1 shadow-xs">
                        <Lock className="w-2.5 h-2.5 text-amber-700" /> Terkunci
                      </div>
                    )}
                    <div
                      style={{ borderColor: borderColor }}
                      className="w-[94%] h-[90%] bg-white rounded-lg border-2 p-2.5 flex flex-col items-center justify-center text-center shadow-xs"
                    >
                      <span className="text-2xl mb-1">{emoji}</span>
                      <h3
                        style={{ color: titleColor }}
                        className="text-xs font-extrabold line-clamp-1 leading-tight tracking-tight"
                      >
                        {title || "Judul Modul"}
                      </h3>
                      <p
                        style={{ color: subtitleColor }}
                        className="text-[10px] font-medium line-clamp-1 mt-0.5"
                      >
                        {subtitle || "Subjudul Materi"}
                      </p>
                      <span
                        style={{ color: tagColor }}
                        className="text-[9px] font-bold italic mt-1.5 line-clamp-1"
                      >
                        {tagText || `Tantangan Coding: Level ${level}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Color Presets */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#cc8b56] block">
                    Pilih Tema Warna Pastel:
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {COLOR_PRESETS.map((preset, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => applyColorPreset(preset)}
                        className={`text-left p-2 rounded-xl border text-xs flex items-center justify-between transition-all cursor-pointer ${
                          bgGradient === preset.bgGradient
                            ? "border-[#cc8b56] bg-[#ffe8d6] font-bold"
                            : "border-[#e9edc9] hover:bg-[#fdfbf7]"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{preset.emoji}</span>
                          <span className="text-[11px]">{preset.name}</span>
                        </span>
                        <div
                          className="w-4 h-4 rounded-full border border-stone-300 shadow-xs"
                          style={{ background: preset.borderColor }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Emoji Picker */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-[#cc8b56] block">
                    Emoji Ikon:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {EMOJI_OPTIONS.map((e) => (
                      <button
                        type="button"
                        key={e}
                        onClick={() => setEmoji(e)}
                        className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer ${
                          emoji === e
                            ? "bg-[#cc8b56] text-white shadow-xs scale-110"
                            : "bg-[#fdfbf7] hover:bg-[#ffe8d6] border border-[#e9edc9]"
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Badge text customize */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#cc8b56] block">
                    Teks Label Bawah (Tag Text)
                  </label>
                  <input
                    type="text"
                    value={tagText}
                    onChange={(e) => setTagText(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#fdfbf7] rounded-lg border border-[#e9edc9] text-xs text-[#333]"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={uploadSubmitting}
                className="w-full py-3 px-4 bg-[#cc8b56] hover:bg-[#b87642] text-white font-bold text-xs rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {uploadSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Menyimpan &amp; Mendaftarkan...
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    Simpan &amp; Daftarkan Materi
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: DAFTAR & KELOLA MATERI */}
      {activeTab === "list" && (
        <div className="bg-white rounded-2xl border-2 border-[#e8e1d5] p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e9edc9]">
            <div>
              <h2 className="text-sm font-black text-[#cc8b56] uppercase tracking-wider">
                Daftar Modul Terdaftar
              </h2>
              <p className="text-xs text-[#a98467]">
                Total {materials.length} modul aktif dalam repositori lokal.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("upload")}
              className="self-start sm:self-auto text-xs font-bold text-white bg-[#cc8b56] hover:bg-[#b87642] px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Tambah Baru
            </button>
          </div>

          {/* Reordering Instructions Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#fdfbf7] border border-[#e9edc9] rounded-xl px-3.5 py-2.5 text-xs text-[#5c677d]">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-[#cc8b56] shrink-0" />
              <span>
                <strong>Atur Urutan Modul:</strong> Tarik &amp; lepas (drag &amp; drop) baris materi ke posisi baru, atau gunakan tombol panah naik/turun.
              </span>
            </div>
            {reordering && (
              <span className="text-[11px] font-bold text-[#cc8b56] animate-pulse shrink-0">
                Menyimpan urutan baru...
              </span>
            )}
          </div>

          <div className="space-y-2">
            {materials.map((item, index) => {
              const isBeingDragged = draggedIndex === index;
              const isDragOver = dragOverIndex === index && draggedIndex !== index;

              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(index, e)}
                  onDragOver={(e) => handleDragOver(index, e)}
                  onDrop={(e) => handleDrop(index, e)}
                  onDragEnd={() => {
                    setDraggedIndex(null);
                    setDragOverIndex(null);
                  }}
                  className={`p-3 sm:p-4 rounded-2xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isBeingDragged
                      ? "opacity-40 bg-[#fff5ea] border-dashed border-[#cc8b56] scale-[0.99]"
                      : isDragOver
                      ? "bg-[#fff9f3] border-[#cc8b56] shadow-md scale-[1.01]"
                      : "bg-white border-[#f0eae1] hover:border-[#e9edc9] hover:bg-[#fdfbf7]"
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    {/* Reorder Controls (Grip + Up/Down Arrows) */}
                    <div className="flex items-center gap-1 shrink-0 select-none">
                      <div
                        className="cursor-grab active:cursor-grabbing text-stone-300 hover:text-[#cc8b56] p-1 rounded-md hover:bg-[#ffe8d6]/60 transition-colors flex items-center justify-center"
                        title="Tahan & tarik untuk mengatur urutan materi"
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          disabled={index === 0 || reordering}
                          onClick={() => moveItem(index, "up")}
                          className="p-0.5 rounded text-stone-400 hover:text-[#cc8b56] hover:bg-[#ffe8d6] disabled:opacity-20 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                          title="Pindahkan ke atas"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === materials.length - 1 || reordering}
                          onClick={() => moveItem(index, "down")}
                          className="p-0.5 rounded text-stone-400 hover:text-[#cc8b56] hover:bg-[#ffe8d6] disabled:opacity-20 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                          title="Pindahkan ke bawah"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Emoji Thumbnail */}
                    <div
                      style={{ background: item.slide1?.bgGradient || "#fdfbf7" }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-[#e8e1d5] text-lg shadow-xs"
                    >
                      {item.slide1?.emoji || "📘"}
                    </div>

                    {/* Module Info */}
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-[#cc8b56]">
                          MODUL {item.orderNumber}
                        </span>
                        <span className="text-[#d4a373] font-bold">&bull;</span>
                        <span className="text-[10px] font-semibold text-[#a98467] uppercase">
                          {item.category}
                        </span>
                        <LevelBadge level={item.level} />
                        {item.isLocked && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Terkunci
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-[#333] truncate">
                        {item.title}
                      </h3>
                      <p className="text-xs text-[#a98467] truncate">
                        {item.subtitle}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-[#5c677d] pt-1">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-[#a98467]" /> {item.slideCount} Slide
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#a98467]" /> ~{item.estimatedMinutes} Menit
                        </span>
                        <span className="flex items-center gap-1 font-mono text-[10px] text-stone-400">
                          <FileCode className="w-3 h-3" /> {item.fileName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleToggleLock(item)}
                      disabled={togglingLockId === item.id}
                      title={item.isLocked ? "Klik untuk membuka modul bagi siswa" : "Klik untuk mengunci modul dari siswa"}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                        item.isLocked
                          ? "bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 shadow-xs"
                          : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                      }`}
                    >
                      {togglingLockId === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : item.isLocked ? (
                        <>
                          <Lock className="w-3.5 h-3.5 text-amber-700" />
                          <span>Terkunci</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Terbuka</span>
                        </>
                      )}
                    </button>
                    <Link
                      href={`/materi/${item.slug}`}
                      target="_blank"
                      className="text-xs font-bold text-[#cc8b56] bg-[#ffe8d6] hover:bg-[#ffd9b8] px-3 py-1.5 rounded-xl border border-[#d4a373]/40 transition-colors flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Buka
                    </Link>
                    <button
                      onClick={() => setDeletingMaterial(item)}
                      className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl border border-red-200 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Hapus
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingMaterial && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl border-2 border-[#e8e1d5] p-6 shadow-2xl space-y-4">
            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-stone-900">
                Hapus Materi Ini?
              </h3>
              <p className="text-xs text-[#a98467]">
                Materi <span className="font-bold text-[#cc8b56]">&ldquo;{deletingMaterial.title}&rdquo;</span> beserta file <code className="font-mono text-stone-700">{deletingMaterial.fileName}</code> akan dihapus dari sistem.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={() => setDeletingMaterial(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-[#e8e1d5] text-xs font-bold text-[#5c677d] hover:bg-stone-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={handleDeleteConfirm}
                className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {deleteSubmitting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

