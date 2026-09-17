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

