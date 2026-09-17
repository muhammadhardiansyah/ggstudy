"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  User,
  Mail,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { Student } from "@/types/student";

export function StudentsManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Notification Toast
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Modal State for Add / Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Form Fields
  const [name, setName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [notes, setNotes] = useState("");

  // Modal State for Delete Confirmation
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Clear notification timer
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  // Fetch Students
  async function fetchStudents() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/students");
      if (res.ok) {
        const data = await res.json();
        setStudents(Array.isArray(data) ? data : []);
      } else {
        setNotification({
          type: "error",
          message: "Gagal memuat data siswa dari server.",
        });
      }
    } catch (err) {
      console.error("Error fetching students:", err);
      setNotification({
        type: "error",
        message: "Terjadi gangguan koneksi saat memuat data siswa.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchStudents();
  }, []);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase().trim();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.studentEmail.toLowerCase().includes(q) ||
        (s.parentName && s.parentName.toLowerCase().includes(q)) ||
        s.parentEmail.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  // Open Form for Adding
  function handleOpenAdd() {
    setEditingStudent(null);
    setName("");
    setStudentEmail("");
    setParentName("");
    setParentEmail("");
    setNotes("");
    setFormError("");
    setIsFormOpen(true);
  }

  // Open Form for Editing
  function handleOpenEdit(student: Student) {
    setEditingStudent(student);
    setName(student.name);
    setStudentEmail(student.studentEmail);
    setParentName(student.parentName || "");
    setParentEmail(student.parentEmail);
    setNotes(student.notes || "");
    setFormError("");
    setIsFormOpen(true);
  }

  // Submit Add or Edit
  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Nama siswa wajib diisi.");
      return;
    }
    if (!studentEmail.trim()) {
      setFormError("Email Google siswa wajib diisi.");
      return;
    }
    if (!parentEmail.trim()) {
      setFormError("Email orang tua wajib diisi.");
      return;
    }

    setFormSubmitting(true);

    try {
      if (editingStudent) {
        // Update
        const res = await fetch("/api/admin/students", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingStudent.id,
            name: name.trim(),
            studentEmail: studentEmail.trim().toLowerCase(),
            parentName: parentName.trim() || undefined,
            parentEmail: parentEmail.trim().toLowerCase(),
            notes: notes.trim() || undefined,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setNotification({
            type: "success",
            message: `Data siswa "${name}" berhasil diperbarui.`,
          });
          setIsFormOpen(false);
          fetchStudents();
        } else {
          setFormError(data.error || "Gagal memperbarui data siswa.");
        }
      } else {
        // Create
        const res = await fetch("/api/admin/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            studentEmail: studentEmail.trim().toLowerCase(),
            parentName: parentName.trim() || undefined,
            parentEmail: parentEmail.trim().toLowerCase(),
            notes: notes.trim() || undefined,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setNotification({
            type: "success",
            message: `Siswa "${name}" berhasil ditambahkan.`,
          });
          setIsFormOpen(false);
          fetchStudents();
        } else {
          setFormError(data.error || "Gagal menambahkan siswa.");
        }
      }
    } catch {
      setFormError("Terjadi gangguan jaringan saat menyimpan data.");
    } finally {
      setFormSubmitting(false);
    }
  }

  // Confirm Delete
  async function handleDeleteConfirm() {
    if (!deletingStudent) return;
    setDeleteSubmitting(true);

    try {
      const res = await fetch(`/api/admin/students?id=${deletingStudent.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setNotification({
          type: "success",
          message: `Siswa "${deletingStudent.name}" berhasil dihapus.`,
        });
        setStudents((prev) => prev.filter((s) => s.id !== deletingStudent.id));
        setDeletingStudent(null);
      } else {
        setNotification({
          type: "error",
          message: data.error || "Gagal menghapus siswa.",
        });
      }
    } catch {
      setNotification({
        type: "error",
        message: "Terjadi kesalahan saat menghapus data siswa.",
      });
    } finally {
      setDeleteSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
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

      {/* Top Header & Metrics */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#e5e0d8] shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#1c1917] tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-700" />
            Daftar & Kelola Siswa
          </h2>
          <p className="text-xs sm:text-sm text-[#57534e] mt-1">
            Daftarkan email Google siswa untuk akses pengumpulan tugas dan email orang tua untuk pengiriman laporan belajar.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-700 text-white text-sm font-semibold hover:bg-amber-800 transition-colors shadow-sm cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tambah Siswa Baru
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#e5e0d8] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[#57534e] font-medium">Total Siswa Terdaftar</div>
            <div className="text-xl font-bold text-[#1c1917]">{students.length} Siswa</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#e5e0d8] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[#57534e] font-medium">Email Orang Tua Terhubung</div>
            <div className="text-xl font-bold text-[#1c1917]">
              {students.filter((s) => s.parentEmail).length} Kontak
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar & List Table */}
      <div className="bg-white rounded-2xl border border-[#e5e0d8] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#e5e0d8] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Cari nama siswa, email, atau orang tua..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-stone-50 border border-[#e5e0d8] rounded-xl focus:outline-none focus:border-amber-700 text-[#1c1917]"
            />
          </div>

          <div className="text-xs text-[#57534e] self-center">
            Menampilkan <span className="font-semibold text-[#1c1917]">{filteredStudents.length}</span> dari {students.length} siswa
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-[#57534e]">
            <Loader2 className="w-6 h-6 animate-spin text-amber-700 mb-2" />
            <span className="text-xs">Memuat data siswa dari database...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-[#57534e]">
            <Users className="w-8 h-8 mx-auto text-stone-300 mb-2" />
            <p className="text-sm font-medium text-[#1c1917]">
              {searchQuery ? "Tidak ada siswa yang sesuai dengan pencarian." : "Belum ada siswa yang didaftarkan."}
            </p>
            <p className="text-xs text-[#57534e] mt-1">
              {searchQuery ? "Coba kata kunci lain." : "Klik tombol 'Tambah Siswa Baru' di atas untuk mendaftarkan siswa pertama."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-xs text-[#57534e] uppercase font-semibold border-b border-[#e5e0d8]">
                <tr>
                  <th className="px-5 py-3.5">Nama Siswa</th>
                  <th className="px-5 py-3.5">Email Siswa (Google Auth)</th>
                  <th className="px-5 py-3.5">Data Orang Tua</th>
                  <th className="px-5 py-3.5">Catatan</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e0d8]">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-[#1c1917]">{student.name}</div>
                      <div className="text-[11px] font-mono text-stone-400 mt-0.5">ID: {student.id}</div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs font-mono">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        {student.studentEmail}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-xs text-[#1c1917] font-medium">
                        {student.parentName || "—"}
                      </div>
                      <div className="inline-flex items-center gap-1 text-xs text-[#57534e] mt-0.5">
                        <Mail className="w-3 h-3 text-stone-400" />
                        <span>{student.parentEmail}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-xs text-[#57534e] line-clamp-1 max-w-[180px]">
                        {student.notes || "—"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(student)}
                          title="Edit Siswa"
                          className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingStudent(student)}
                          title="Hapus Siswa"
                          className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Student */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-[#e5e0d8] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#e5e0d8] flex items-center justify-between bg-stone-50">
              <h3 className="text-base font-bold text-[#1c1917] flex items-center gap-2">
                <User className="w-4 h-4 text-amber-700" />
                {editingStudent ? "Edit Data Siswa" : "Tambah Siswa Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#1c1917] mb-1">
                  Nama Lengkap Siswa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-[#e5e0d8] rounded-xl focus:outline-none focus:border-amber-700 text-[#1c1917]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1c1917] mb-1">
                  Email Google Siswa <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="Contoh: budi@gmail.com"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-[#e5e0d8] rounded-xl focus:outline-none focus:border-amber-700 text-[#1c1917]"
                />
                <p className="text-[11px] text-[#57534e] mt-1">
                  Email ini harus sama dengan akun Google yang dipakai siswa untuk login ke website.
                </p>
              </div>

              <div className="pt-2 border-t border-[#e5e0d8]">
                <div className="text-xs font-bold text-[#1c1917] uppercase tracking-wider mb-3">
                  Informasi Kontak Orang Tua
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1c1917] mb-1">
                      Nama Orang Tua (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Bapak Hendra / Ibu Maya"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-[#e5e0d8] rounded-xl focus:outline-none focus:border-amber-700 text-[#1c1917]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1c1917] mb-1">
                      Email Orang Tua <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="Contoh: orangtua.budi@gmail.com"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-[#e5e0d8] rounded-xl focus:outline-none focus:border-amber-700 text-[#1c1917]"
                    />
                    <p className="text-[11px] text-[#57534e] mt-1">
                      Laporan kemajuan belajar dan kodingan anak akan dikirimkan ke alamat email ini.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#e5e0d8]">
                <label className="block text-xs font-semibold text-[#1c1917] mb-1">
                  Catatan Guru (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan khusus mengenai minat belajar atau jadwal anak..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-[#e5e0d8] rounded-xl focus:outline-none focus:border-amber-700 text-[#1c1917]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-[#e5e0d8]">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  disabled={formSubmitting}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-[#57534e] hover:bg-stone-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-700 text-white text-xs font-semibold hover:bg-amber-800 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {formSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{editingStudent ? "Simpan Perubahan" : "Daftarkan Siswa"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Delete Confirmation */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-[#e5e0d8] shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h4 className="text-base font-bold text-[#1c1917]">Hapus Siswa Ini?</h4>
              <p className="text-xs text-[#57534e]">
                Apakah kamu yakin ingin menghapus data siswa{" "}
                <span className="font-semibold text-[#1c1917]">"{deletingStudent.name}"</span>?
                Semua data tugas dan riwayat laporan terkait siswa ini akan ikut terhapus.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                disabled={deleteSubmitting}
                className="flex-1 px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-[#57534e] hover:bg-stone-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteSubmitting}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {deleteSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <span>Ya, Hapus</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

