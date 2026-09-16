import { getAllMaterials } from "@/lib/db";
import { HomePageClient } from "@/components/HomePageClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const materials = await getAllMaterials();
  return <HomePageClient initialMaterials={materials} />;
}
