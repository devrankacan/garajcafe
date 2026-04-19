import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { password } = await req.json();

  const stored = await prisma.settings.findUnique({ where: { key: "adminPassword" } });

  let valid = false;
  if (stored?.value) {
    valid = await bcrypt.compare(password, stored.value);
  } else {
    // Şifre hiç set edilmemişse varsayılan "admin"
    valid = password === "admin";
  }

  if (!valid) return NextResponse.json({ error: "Şifre hatalı" }, { status: 401 });

  const cookieStore = await cookies();
  cookieStore.set("admin_auth", "1", {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return NextResponse.json({ ok: true });
}
