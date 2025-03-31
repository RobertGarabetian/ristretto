// app/api/auth/clerk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(req: NextRequest) {
  const {userId, redirectToSignIn} = await auth()
  if (!userId) return redirectToSignIn()

  
  return NextResponse.json({ userId });
}