import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name, username, password } = await req.json();
  const data: Record<string, string> = { name, username };
  if (password) data.password = await bcrypt.hash(password, 10);
  const waiter = await prisma.waiter.update({
    where: { id: Number(id) },
    data,
    select: { id: true, name: true, username: true },
  });
  return NextResponse.json(waiter);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.waiter.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
