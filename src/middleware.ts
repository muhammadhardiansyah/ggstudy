import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import rawMaterials from "@/data/materials.json";
import { MaterialItem } from "@/types/material";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Intercept direct requests to presentation HTML files in /materials/
  if (pathname.startsWith("/materials/")) {
    const fileName = pathname.replace(/^\/materials\//, "");
    const materialList = rawMaterials as unknown as MaterialItem[];
    const matched = materialList.find((m) => m.fileName === fileName);

    if (matched) {
      // Redirect to the module page
      return NextResponse.redirect(new URL(`/materi/${matched.slug}`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/materials/:path*"],
};

