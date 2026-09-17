"use client";

import React, { useState, useEffect, useRef } from "react";
import { MaterialItem } from "@/types/material";
import { LevelBadge } from "@/components/LevelBadge";
import {
  BookOpen,
  Layers,
  Clock,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface ReportMaterialSectionProps {
  materials: MaterialItem[];
}

export function ReportMaterialSection({ materials }: ReportMaterialSectionProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [totalSlides, setTotalSlides] = useState(1);
  const [isLoadingSlide, setIsLoadingSlide] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const modalContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Send navigation action to iframe (supports postMessage and direct execution)
  const sendToIframe = (data: any) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(data, "*");
    }

    try {
      const iframeWin = iframeRef.current?.contentWindow as any;
      if (iframeWin) {
        if (data === "next") {
          if (typeof iframeWin.changeSlide === "function") {
            iframeWin.changeSlide(1);
          } else if (typeof iframeWin.showSlide === "function") {
            iframeWin.showSlide(Math.min(totalSlides - 1, currentSlide));
          }
        } else if (data === "prev") {
          if (typeof iframeWin.changeSlide === "function") {
            iframeWin.changeSlide(-1);
          } else if (typeof iframeWin.showSlide === "function") {
            iframeWin.showSlide(Math.max(0, currentSlide - 2));
          }
        } else if (typeof data?.goToSlide === "number") {
          const target = Math.max(0, Math.min(totalSlides - 1, data.goToSlide - 1));
          if (typeof iframeWin.showSlide === "function") {
            if (typeof iframeWin.currentSlide === "number") {
              iframeWin.currentSlide = target;
            }
            iframeWin.showSlide(target);
          }
        }

        if (typeof iframeWin.currentSlide === "number") {
          setCurrentSlide(iframeWin.currentSlide + 1);
        }
      }
    } catch {
      // Ignore cross-origin issues if any
    }
  };

  const handlePrev = () => {
    sendToIframe("prev");
  };

  const handleNext = () => {
    sendToIframe("next");
  };

  const handleReset = () => {
    sendToIframe({ goToSlide: 1 });
  };

  const openModal = (mat: MaterialItem) => {
    setSelectedMaterial(mat);
    setCurrentSlide(1);
    setTotalSlides(mat.slideCount || 1);
    setIsLoadingSlide(true);
  };

  const closeModal = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setSelectedMaterial(null);
    setIsFullscreen(false);
  };

  const toggleFullscreen = async () => {
    if (!modalContainerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await modalContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Gagal mengganti mode layar penuh:", err);
    }
  };

  // Lock body scroll and register keyboard listener when modal is active
  useEffect(() => {
    if (!selectedMaterial) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight" || e.key === "Space") {
        handleNext();
      }
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "slideChange") {
        if (typeof event.data.currentSlide === "number") {
          setCurrentSlide(event.data.currentSlide);
        }
        if (typeof event.data.totalSlides === "number") {
          setTotalSlides(event.data.totalSlides);
        }
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("message", handleMessage);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("message", handleMessage);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [selectedMaterial, currentSlide, totalSlides]);

  const handleIframeLoad = () => {
    setIsLoadingSlide(false);
    try {
      const iframeWin = iframeRef.current?.contentWindow as any;
      if (iframeWin) {
        const slides = iframeWin.document?.querySelectorAll?.(".slide");
        if (slides && slides.length > 0) {
          setTotalSlides(slides.length);
        }
        if (typeof iframeWin.currentSlide === "number") {
          setCurrentSlide(iframeWin.currentSlide + 1);
        }
      }
    } catch {
      // Ignore
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-[#1c1917]">
            <BookOpen className="w-5 h-5 text-amber-700" />
            <h2 className="text-base sm:text-lg font-bold">
              Materi yang Dipelajari ({materials.length} Modul)
            </h2>
          </div>
          <span className="text-xs text-stone-500 hidden sm:inline">
            Orang tua dapat melihat isi slide modul pembelajaran
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {materials.map((mat) => (
            <div
              key={mat.id}
              className="bg-white rounded-2xl border border-[#e5e0d8] p-5 sm:p-6 shadow-xs space-y-4 transition-all hover:border-amber-200"
            >
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#f0eae1] pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                    MODUL {mat.orderNumber}
                  </span>
                  <span className="text-xs text-stone-300 font-bold hidden sm:inline">&bull;</span>
                  <span className="text-xs font-semibold text-[#57534e] uppercase tracking-wider">
                    {mat.category}
                  </span>
                  <span className="text-xs text-stone-300 font-bold hidden sm:inline">&bull;</span>
                  <LevelBadge level={mat.level} />
                </div>

                <div className="flex items-center gap-3 text-xs text-[#57534e]">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-stone-400" />
                    {mat.slideCount} Slide
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    ~{mat.estimatedMinutes} Menit
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#1c1917]">
                  {mat.title}
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-amber-800 mt-0.5">
                  {mat.subtitle}
                </p>
                <p className="text-xs sm:text-sm text-[#57534e] mt-2 leading-relaxed">
                  {mat.description}
                </p>
              </div>

              {/* Topics tags */}
              {mat.topics && mat.topics.length > 0 && (
                <div className="pt-1">
                  <span className="text-[11px] font-semibold text-stone-500 block mb-1.5">
                    Konsep Kunci yang Dikuasai:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {mat.topics.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-[#f9f8f6] border border-[#e5e0d8] text-stone-700 text-xs font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button: Orang Tua Dapat Memilih Untuk Melihat Materi */}
              <div className="pt-2 border-t border-[#f0eae1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-stone-500">
                  Ingin melihat rangkuman presentasi yang dipelajari anak?
                </p>
                <button
                  type="button"
                  onClick={() => openModal(mat)}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 active:bg-amber-200/80 border border-amber-300 text-amber-900 font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
                >
                  <Eye className="w-4 h-4 text-amber-800" />
                  <span>Lihat Slide Materi</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Popup Viewer */}
      {selectedMaterial && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="material-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            ref={modalContainerRef}
            className={`w-full max-w-5xl bg-stone-950 rounded-2xl sm:rounded-3xl border border-stone-800 shadow-2xl flex flex-col overflow-hidden transition-all ${
              isFullscreen ? "h-screen max-w-none rounded-none border-0" : "h-[90vh] sm:h-[85vh]"
            }`}
          >
            {/* Modal Header Toolbar */}
            <div className="bg-stone-900/90 px-4 sm:px-5 py-3 border-b border-stone-800 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/60 px-2 py-1 rounded border border-amber-700/50 shrink-0">
                  MODUL {selectedMaterial.orderNumber}
                </span>
                <div className="min-w-0">
                  <h3
                    id="material-modal-title"
                    className="text-sm sm:text-base font-bold text-stone-100 tracking-tight truncate"
                    title={selectedMaterial.title}
                  >
                    {selectedMaterial.title}
                  </h3>
                  <p className="text-xs text-stone-400 truncate hidden sm:block">
                    {selectedMaterial.subtitle}
                  </p>
                </div>
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Slide Count Indicator */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-800 border border-stone-700 text-xs font-mono text-amber-300">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {currentSlide} / {totalSlides}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  title="Kembali ke slide pertama"
                  className="min-h-[44px] min-w-[44px] p-2.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors inline-flex items-center justify-center cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
                  aria-label="Kembali ke slide pertama"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
                  className="min-h-[44px] min-w-[44px] p-2.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors inline-flex items-center justify-center cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
                  aria-label={isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                <div className="h-4 w-px bg-stone-700 mx-1 hidden sm:block" />

                <button
                  type="button"
                  onClick={closeModal}
                  className="min-h-[44px] px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white text-xs font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer border border-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
                  aria-label="Tutup jendela slide materi"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Tutup</span>
                </button>
              </div>
            </div>

            {/* Modal Body / Slide Frame */}
            <div className="relative flex-1 w-full bg-stone-950 flex items-center justify-center overflow-hidden">
              {isLoadingSlide && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-950 z-10">
                  <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
                  <span className="text-xs text-stone-400">Memuat modul presentasi...</span>
                </div>
              )}

              <iframe
                ref={iframeRef}
                src={`/api/slides/${selectedMaterial.slug}`}
                title={selectedMaterial.title}
                onLoad={handleIframeLoad}
                onError={() => setIsLoadingSlide(false)}
                className="w-full h-full border-0 absolute inset-0 bg-transparent"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            </div>

            {/* Modal Footer Navigation */}
            <div className="bg-stone-900 px-4 py-2.5 border-t border-stone-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentSlide <= 1}
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-800 text-stone-200 text-xs font-semibold hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer border border-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sebelumnya</span>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={currentSlide >= totalSlides}
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
                >
                  <span>Selanjutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Dots */}
              <div className="hidden sm:flex items-center gap-1.5 max-w-xs overflow-x-auto py-1">
                {Array.from({ length: totalSlides }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => sendToIframe({ goToSlide: i + 1 })}
                    title={`Menuju Slide ${i + 1}`}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      currentSlide === i + 1 ? "w-6 bg-amber-400" : "w-2 bg-stone-700 hover:bg-stone-500"
                    }`}
                  />
                ))}
              </div>

              {/* Instructions */}
              <div className="text-[11px] text-stone-400 font-mono hidden md:flex items-center gap-2">
                <span>Navigasi:</span>
                <kbd className="px-1.5 py-0.5 rounded bg-stone-800 border border-stone-700 text-stone-300">←</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-stone-800 border border-stone-700 text-stone-300">→</kbd>
                <span className="text-stone-500">atau usap layar</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

