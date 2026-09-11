export type DifficultyLevel = "Pemula" | "Menengah" | "Lanjut";

export interface Slide1Theme {
  emoji: string;
  bgGradient: string;
  borderColor: string;
  titleColor: string;
  subtitleColor: string;
  tagColor: string;
  tagText: string;
}

export interface MaterialItem {
  id: string;
  slug: string;
  orderNumber: string; // "01", "02", dst.
  title: string;
  subtitle: string;
  description: string;
  category: string;
  level: DifficultyLevel;
  slideCount: number;
  estimatedMinutes: number;
  fileName: string;
  topics: string[];
  slide1?: Slide1Theme;
  isLocked?: boolean;
}
