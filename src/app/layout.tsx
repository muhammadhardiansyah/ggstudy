import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://ggstudy.vercel.app"),
  title: {
    default: "ggstudy: Portal Belajar Python Interaktif",
    template: "%s | ggstudy",
  },
  description:
    "Koleksi presentasi slide interaktif materi pemrograman Python siap dipelajari siswa.",
  applicationName: "ggstudy",
  keywords: [
    "ggstudy",
    "belajar python",
    "coding interaktif",
    "presentasi coding",
    "pemrograman python pemula",
  ],
  authors: [{ name: "ggstudy" }],
  creator: "ggstudy",
  publisher: "ggstudy",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/png", sizes: "64x64" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "ggstudy: Portal Belajar Python Interaktif",
    description:
      "Koleksi presentasi slide interaktif materi pemrograman Python siap dipelajari siswa.",
    url: "https://ggstudy.vercel.app",
    siteName: "ggstudy",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ggstudy: Portal Belajar Python Interaktif",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ggstudy: Portal Belajar Python Interaktif",
    description:
      "Koleksi presentasi slide interaktif materi pemrograman Python siap dipelajari siswa.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#d4a373",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col bg-[#fdfbf7] text-[#333333] selection:bg-[#ffe8d6] selection:text-[#cc8b56]">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
