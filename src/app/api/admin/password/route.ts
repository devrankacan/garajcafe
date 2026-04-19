import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { newPassword } = await req.json();
  if (!newPassword || newPassword.length < 4)
    return NextResponse.json({ error: "Şifre en az 4 karakter olmalı" }, { status: 400 });

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.settings.upsert({
    where: { key: "adminPassword" },
    update: { value: hashed },
    create: { key: "adminPassword", value: hashed },
  });

  return NextResponse.json({ ok: true });
}
