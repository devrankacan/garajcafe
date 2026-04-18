import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const waiters = await prisma.waiter.findMany({
    select: { id: true, name: true, username: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(waiters);
}

export async function POST(req: Request) {
  const { name, username, password } = await req.json();
  const hashed = await bcrypt.hash(password, 10);
  const waiter = await prisma.waiter.create({
    data: { name, username, password: hashed },
    select: { id: true, name: true, username: true },
  });
  return NextResponse.json(waiter);
}
