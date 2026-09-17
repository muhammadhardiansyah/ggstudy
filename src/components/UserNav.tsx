"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { LogOut, User, CheckCircle2, AlertCircle, ChevronDown, ShieldCheck } from "lucide-react";

export function UserNav() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === "loading") {
    return (
      <div className="h-8 w-24 bg-stone-100 rounded-lg animate-pulse" />
    );
  }

  // Jika belum login
  if (!session || !session.user) {
    return (
      <button
        onClick={() => signIn("google")}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#e5e0d8] hover:border-[#cc8b56] text-xs font-semibold text-[#1c1917] hover:bg-stone-50 transition-all shadow-2xs cursor-pointer"
        title="Masuk menggunakan akun Google Siswa"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
        <span>Masuk Google</span>
      </button>
    );
  }

  // Jika sudah login
  const user = session.user as any;
  const isEnrolled = Boolean(user.isEnrolled);
  const displayName = user.studentName || user.name || user.email?.split("@")[0] || "Siswa";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl bg-white hover:bg-stone-50 border border-[#e5e0d8] hover:border-[#d4a373] transition-all cursor-pointer shadow-2xs"
        aria-label="Menu Akun Siswa"
      >
        {user.image ? (
          <img
            src={user.image}
            alt={displayName}
            className="w-6 h-6 rounded-lg object-cover border border-stone-200"
          />
        ) : (
          <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex flex-col items-start text-left max-w-[110px] sm:max-w-[140px]">
          <span className="text-xs font-bold text-[#1c1917] truncate leading-tight">
            {displayName}
          </span>
          <span className="text-[10px] text-[#57534e] flex items-center gap-1 leading-tight">
            {isEnrolled ? (
              <span className="text-emerald-700 font-medium flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Terdaftar
              </span>
            ) : (
              <span className="text-amber-700 font-medium flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Umum
              </span>
            )}
          </span>
        </div>

        <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-[#e5e0d8] shadow-xl p-3 z-50 space-y-3">
          {/* Header Profile Info */}
          <div className="p-2 bg-stone-50 rounded-xl border border-[#f0eae1] space-y-1.5">
            <div className="flex items-center gap-2">
              {user.image ? (
                <img
                  src={user.image}
                  alt={displayName}
                  className="w-8 h-8 rounded-lg object-cover border border-stone-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 text-sm font-bold flex items-center justify-center">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#1c1917] truncate">
                  {displayName}
                </div>
                <div className="text-[11px] text-[#57534e] truncate">
                  {user.email}
                </div>
              </div>
            </div>

            {/* Status Info */}
            <div className="pt-1.5 border-t border-[#e5e0d8]">
              {isEnrolled ? (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Akun siswa resmi terverifikasi</span>
                </div>
              ) : (
                <div className="flex items-start gap-1.5 text-[11px] text-amber-800 font-medium leading-tight">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>Email belum didaftarkan pengajar di data siswa.</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-1 border-t border-[#e5e0d8]">
            <button
              onClick={() => {
                setIsOpen(false);
                signOut();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar dari Akun</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

