import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const waiterId = cookieStore.get("waiter_id")?.value;
  if (!waiterId) return NextResponse.json(null);

  const waiter = await prisma.waiter.findUnique({
    where: { id: Number(waiterId) },
    select: { id: true, name: true, username: true },
  });
  return NextResponse.json(waiter);
}
