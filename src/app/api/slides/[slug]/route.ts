import { NextRequest } from "next/server";
import { getMaterialBySlug } from "@/lib/db";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const PORTAL_BRIDGE_SCRIPT = `
<script id="ggstudy-portal-bridge">
(function() {
  if (window.__ggstudy_bridge_ready) return;
  window.__ggstudy_bridge_ready = true;

  function getSlides() {
    return document.querySelectorAll('.slide');
  }

  function getActiveIndex() {
    var slides = getSlides();
    for (var i = 0; i < slides.length; i++) {
      if (slides[i].classList.contains('active')) return i;
    }
    if (typeof window.currentSlide === 'number') {
      return window.currentSlide;
    }
    return 0;
  }

  function sendSlideUpdate() {
    if (window.parent && window.parent !== window) {
      var slides = getSlides();
      var idx = getActiveIndex();
      window.parent.postMessage({
        type: 'slideChange',
        currentSlide: idx + 1,
        totalSlides: slides.length > 0 ? slides.length : 1
      }, '*');
    }
  }

  function attachHooks() {
    if (typeof window.showSlide === 'function' && !window.showSlide.__bridged) {
      var origShow = window.showSlide;
      window.showSlide = function(idx) {
        window.currentSlide = idx;
        var res = origShow.apply(this, arguments);
        sendSlideUpdate();
        return res;
      };
      window.showSlide.__bridged = true;
    }

    if (typeof window.changeSlide === 'function' && !window.changeSlide.__bridged) {
      var origChange = window.changeSlide;
      window.changeSlide = function(dir) {
        var res = origChange.apply(this, arguments);
        sendSlideUpdate();
        return res;
      };
      window.changeSlide.__bridged = true;
    }
  }

  attachHooks();

  // Listen for navigation messages from the parent portal
  window.addEventListener('message', function(e) {
    if (!e.data) return;
    var slides = getSlides();
    if (!slides.length) return;

    if (e.data === 'next') {
      if (typeof window.changeSlide === 'function') {
        window.changeSlide(1);
      } else {
        var next = Math.min(slides.length - 1, getActiveIndex() + 1);
        if (typeof window.showSlide === 'function') {
          window.showSlide(next);
        } else {
          for (var i = 0; i < slides.length; i++) {
            slides[i].classList.toggle('active', i === next);
          }
          sendSlideUpdate();
        }
      }
    } else if (e.data === 'prev') {
      if (typeof window.changeSlide === 'function') {
        window.changeSlide(-1);
      } else {
        var prev = Math.max(0, getActiveIndex() - 1);
        if (typeof window.showSlide === 'function') {
          window.showSlide(prev);
        } else {
          for (var i = 0; i < slides.length; i++) {
            slides[i].classList.toggle('active', i === prev);
          }
          sendSlideUpdate();
        }
      }
    } else if (typeof e.data.goToSlide === 'number') {
      var target = Math.max(0, Math.min(slides.length - 1, e.data.goToSlide - 1));
      if (typeof window.showSlide === 'function') {
        if (typeof window.currentSlide === 'number') {
          window.currentSlide = target;
        }
        window.showSlide(target);
      } else {
        for (var i = 0; i < slides.length; i++) {
          slides[i].classList.toggle('active', i === target);
        }
        sendSlideUpdate();
      }
    }
  });

  // Watch for DOM class changes
  if (window.MutationObserver) {
    var observer = new MutationObserver(function() {
      sendSlideUpdate();
    });
    var slides = getSlides();
    for (var i = 0; i < slides.length; i++) {
      observer.observe(slides[i], { attributes: true, attributeFilter: ['class'] });
    }
  }

  // Detect button clicks inside the slide
  document.addEventListener('click', function() {
    setTimeout(sendSlideUpdate, 50);
  });

  // Initial update
  function init() {
    attachHooks();
    sendSlideUpdate();
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    window.addEventListener('load', init);
    document.addEventListener('DOMContentLoaded', init);
  }
})();
</script>
`;

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const material = await getMaterialBySlug(slug);

    if (!material) {
      return new Response("Materi tidak ditemukan", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    if (material.isLocked) {
      return new Response("Materi ini sedang dikunci oleh pengajar", {
        status: 403,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    let htmlContent = "";

    // 1. Ambil dari Vercel Blob jika tersedia
    if (material.blobUrl) {
      try {
        const res = await fetch(material.blobUrl, {
          cache: "no-store",
        });
        if (res.ok) {
          htmlContent = await res.text();
        }
      } catch (blobErr) {
        console.error("Gagal mengambil slide dari Vercel Blob:", blobErr);
      }
    }

    // 2. Fallback baca berkas lokal jika blob belum ada atau offline
    if (!htmlContent && material.fileName) {
      try {
        const localPath = path.join(process.cwd(), "public", "materials", material.fileName);
        htmlContent = await fs.readFile(localPath, "utf-8");
      } catch (localErr) {
        console.error("Gagal membaca berkas lokal:", localErr);
      }
    }

    if (!htmlContent) {
      return new Response("Konten presentasi belum tersedia", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // 3. Suntikkan bridge script agar slide dapat berkomunikasi dua arah dengan portal
    if (!htmlContent.includes("ggstudy-portal-bridge")) {
      if (htmlContent.includes("</body>")) {
        htmlContent = htmlContent.replace("</body>", `${PORTAL_BRIDGE_SCRIPT}\n</body>`);
      } else if (htmlContent.includes("</html>")) {
        htmlContent = htmlContent.replace("</html>", `${PORTAL_BRIDGE_SCRIPT}\n</html>`);
      } else {
        htmlContent += `\n${PORTAL_BRIDGE_SCRIPT}`;
      }
    }

    return new Response(htmlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": "inline",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (err: any) {
    console.error("Error serving slide:", err);
    return new Response("Gagal memuat modul presentasi", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
