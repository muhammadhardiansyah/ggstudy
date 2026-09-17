"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Layers,
  RotateCcw,
} from "lucide-react";
import { MaterialItem } from "@/types/material";
import { LevelBadge } from "./LevelBadge";

interface SlideViewerProps {
  material: MaterialItem;
}

export const SlideViewer: React.FC<SlideViewerProps> = ({ material }) => {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [totalSlides, setTotalSlides] = useState(material.slideCount);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Send message to iframe (supports postMessage and direct same-origin execution)
  const sendToIframe = (data: any) => {
    // 1. Post message to iframe
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(data, "*");
    }

    // 2. Direct same-origin execution for instant response
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

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Gagal mengganti mode layar penuh:", err);
    }
  };

  // Listen to fullscreen changes & iframe postMessage
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "slideChange") {
        setCurrentSlide(event.data.currentSlide);
        if (event.data.totalSlides) {
          setTotalSlides(event.data.totalSlides);
        }
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") handlePrev();
      if (event.key === "ArrowRight" || event.key === "Space") handleNext();
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("message", handleMessage);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Safety fallback: ensure loading spinner disappears if iframe takes too long
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 7000);
    return () => clearTimeout(timer);
  }, [material.slug]);

  const handleIframeLoad = () => {
    setIsLoading(false);
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
    <div
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
      className={`flex flex-col bg-stone-900 text-stone-100 select-none ${
        isFullscreen ? "fixed inset-0 z-50 h-screen w-screen" : "rounded-2xl overflow-hidden border border-stone-800 shadow-xl"
      }`}
    >
      {/* Top Header Toolbar */}
      <div className="bg-stone-950 px-4 py-3 border-b border-stone-800 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-stone-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Katalog</span>
          </Link>
          <div className="h-4 w-px bg-stone-800 hidden sm:block" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-stone-400">
                MODUL {material.orderNumber}
              </span>
              <span className="text-stone-700">|</span>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight line-clamp-1">
                {material.title}
              </h1>
              <LevelBadge level={material.level} className="hidden sm:inline-flex" />
            </div>
            <p className="text-xs text-stone-400 line-clamp-1 hidden md:block">
              {material.subtitle}
            </p>
          </div>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2">
          {/* Slide Indicator Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-800/80 border border-stone-700 text-xs font-mono text-amber-300">
            <Layers className="w-3.5 h-3.5" />
            <span>
              {currentSlide} / {totalSlides}
            </span>
          </div>

          <button
            onClick={handleReset}
            title="Ulang dari slide awal"
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            aria-label="Kembali ke slide awal"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Keluar layar penuh (ESC)" : "Layar penuh"}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Slide Viewer Frame */}
      <div className="relative w-full flex-1 bg-stone-950 flex items-center justify-center min-h-[60vh] sm:min-h-[72vh]">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-900 z-10">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-xs text-stone-400">Memuat modul presentasi...</span>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={`/api/slides/${material.slug}`}
          title={material.title}
          onLoad={handleIframeLoad}
          onError={() => setIsLoading(false)}
          className="w-full h-full border-0 absolute inset-0 bg-transparent"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>

      {/* Bottom Presenter Navigation Bar */}
      <div className="bg-stone-950 px-4 py-2.5 border-t border-stone-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrev}
            disabled={currentSlide <= 1}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-800 text-stone-200 text-xs font-semibold hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>
          <button
            onClick={handleNext}
            disabled={currentSlide >= totalSlides}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 text-stone-950 text-xs font-semibold hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <span className="hidden sm:inline">Selanjutnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Slide Progress Dots */}
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

        {/* Keyboard and Swipe Hint */}
        <div className="text-[11px] text-stone-400 font-mono hidden md:flex items-center gap-2">
          <span>Navigasi:</span>
          <kbd className="px-1.5 py-0.5 rounded bg-stone-800 border border-stone-700 text-stone-300">←</kbd>
          <kbd className="px-1.5 py-0.5 rounded bg-stone-800 border border-stone-700 text-stone-300">→</kbd>
          <span className="text-stone-500">atau swipe layar</span>
        </div>
      </div>
    </div>
  );
};

