import rawMaterials from "./materials.json";
import { MaterialItem } from "@/types/material";

export const materials: MaterialItem[] = rawMaterials as MaterialItem[];

export function getMaterialBySlug(slug: string): MaterialItem | undefined {
  return materials.find((item) => item.slug === slug);
}

export function getAllCategories(): string[] {
  return Array.from(new Set(materials.map((m) => m.category)));
}

