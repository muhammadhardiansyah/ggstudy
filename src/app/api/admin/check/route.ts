import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = cookies();
  const session = cookieStore.get("admin_session");

  const isAuthenticated = session?.value === "ggstudy_authenticated_admin_ok";

  return NextResponse.json({ authenticated: isAuthenticated });
}

