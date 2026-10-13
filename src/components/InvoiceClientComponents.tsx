"use client";

import React, { useState } from "react";
import {
  Copy,
  Check,
  Printer,
  Share2,
  MessageCircle,
} from "lucide-react";

interface CopyAccountButtonProps {
  accountNumber: string;
}

export function CopyAccountButton({ accountNumber }: CopyAccountButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-bold transition-colors shadow-xs cursor-pointer min-h-[44px]"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          <span>No. Rekening Tersalin!</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          <span>Salin No. Rekening</span>
        </>
      )}
    </button>
  );
}

interface InvoiceActionButtonsProps {
  invoiceNumber: string;
  studentName: string;
  formattedAmount: string;
  isPaid: boolean;
}

export function InvoiceActionButtons({
  invoiceNumber,
  studentName,
  formattedAmount,
  isPaid,
}: InvoiceActionButtonsProps) {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const confirmText = [
    `Halo Kak Muhammad Hardiansyah,`,
    ``,
    `Saya ingin mengonfirmasi pembayaran tagihan les koding Python untuk ananda *${studentName}*:`,
    `No. Invoice: *${invoiceNumber}*`,
    `Nominal: *${formattedAmount}*`,
    `Tujuan: Bank Mandiri (1380018308176 a.n. MUHAMMAD HARDIANSYAH)`,
    ``,
    `Berikut saya lampirkan bukti transfernya. Terima kasih.`,
  ].join("\n");

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(confirmText)}`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={handleCopyLink}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#e5e0d8] hover:border-amber-400 text-xs sm:text-sm font-semibold text-[#1c1917] hover:bg-amber-50/50 transition-colors shadow-2xs cursor-pointer min-h-[44px]"
        >
          {copiedLink ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700">Tautan Tersalin!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-amber-700" />
              <span>Salin Tautan Invoice</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#e5e0d8] hover:border-stone-400 text-xs sm:text-sm font-semibold text-[#1c1917] hover:bg-stone-50 transition-colors shadow-2xs cursor-pointer min-h-[44px]"
        >
          <Printer className="w-4 h-4 text-stone-600" />
          <span>Cetak / Simpan PDF</span>
        </button>
      </div>

      {!isPaid && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition-colors shadow-sm min-h-[44px]"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Konfirmasi Pembayaran via WhatsApp</span>
        </a>
      )}
    </div>
  );
}

