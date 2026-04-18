import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { username, password } = await req.json();

  const waiter = await prisma.waiter.findUnique({ where: { username } });
  if (!waiter) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 401 });

  const valid = await bcrypt.compare(password, waiter.password);
  if (!valid) return NextResponse.json({ error: "Şifre hatalı" }, { status: 401 });

  const cookieStore = await cookies();
  cookieStore.set("waiter_id", String(waiter.id), {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return NextResponse.json({ id: waiter.id, name: waiter.name });
}
