import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { products: { where: { isAvailable: true }, orderBy: { sortOrder: "asc" } } },
  });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const { name, sortOrder } = await req.json();
  const category = await prisma.category.create({ data: { name, sortOrder: sortOrder ?? 0 } });
  return NextResponse.json(category);
}
