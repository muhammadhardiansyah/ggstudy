export interface Student {
  id: string;
  name: string;
  studentEmail: string;
  parentName?: string;
  parentEmail: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GradeCriteria {
  conceptScore?: number; // Pemahaman Konsep (Logika & Algoritma)
  cleanlinessScore?: number; // Kerapian & Struktur Kode
  completionScore?: number; // Penyelesaian Masalah & Output
}

export interface Submission {
  id: string;
  studentId: string;
  materialSlug: string;
  fileName?: string;
  fileUrl?: string;
  codeContent?: string;
  language?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  // Penilaian Pengajar
  gradeScore?: number;
  gradeFeedback?: string;
  gradeCriteria?: GradeCriteria;
  gradeToken?: string;
  gradedAt?: string;
  status?: "submitted" | "graded";
}

export interface Report {
  id: string;
  token: string;
  studentId: string;
  materialSlug: string;
  materialSlugs?: string[];
  sessionPhotoUrl?: string;
  teacherNotes?: string;
  submissionId?: string;
  status: "draft" | "sent";
  sentAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  token: string;
  studentId: string;
  reportIds: string[];
  amount: number;
  status: "unpaid" | "paid";
  notes?: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  paidAt?: string;
  createdAt?: string;
  updatedAt?: string;
}


