import { NextResponse } from "next/server";
import { askVitoko, getVitokoBrief } from "@/lib/vitoko";

export const dynamic = "force-dynamic";

export async function GET() {
  const brief = await getVitokoBrief();
  return NextResponse.json({ ok: true, brief });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const message = typeof body.message === "string" ? body.message : "";
  const answer = await askVitoko(message);

  return NextResponse.json({ ok: true, answer });
}
