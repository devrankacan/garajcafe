import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.settings.findMany();
  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;
  return NextResponse.json(map);
}

export async function POST(req: Request) {
  const body: Record<string, string> = await req.json();
  const upserts = Object.entries(body).map(([key, value]) =>
    prisma.settings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  );
  await Promise.all(upserts);
  return NextResponse.json({ ok: true });
}
