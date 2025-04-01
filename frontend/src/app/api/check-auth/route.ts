import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const session = cookies().get("session")?.value;
  return NextResponse.json({ isAuthenticated: !!session });
}