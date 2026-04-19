import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { csv, clearFirst } = await req.json();

  if (clearFirst) {
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
  }

  const lines = csv.trim().split("\n").filter((l: string) => l.trim());
  const dataLines = lines.slice(1); // header satırını atla

  const catCache = new Map<string, number>();
  let catOrder = 0;
  let productCount = 0;
  const errors: string[] = [];

  for (const line of dataLines) {
    const cols = line.split("\t");
    if (cols.length < 4) continue;

    const catName = cols[0]?.trim();
    const productName = cols[1]?.trim();
    const description = cols[2]?.trim() || null;
    const priceRaw = cols[3]?.trim() ?? "";
    const price = parseFloat(priceRaw.replace(/[^\d.,]/g, "").replace(",", "."));

    if (!catName || !productName) continue;
    if (isNaN(price)) { errors.push(`Fiyat okunamadı: "${priceRaw}" (${productName})`); continue; }

    if (!catCache.has(catName)) {
      let cat = await prisma.category.findFirst({ where: { name: catName } });
      if (!cat) cat = await prisma.category.create({ data: { name: catName, sortOrder: catOrder++ } });
      catCache.set(catName, cat.id);
    }

    await prisma.product.create({
      data: {
        name: productName,
        description,
        price,
        categoryId: catCache.get(catName)!,
        isAvailable: true,
        sortOrder: productCount,
      },
    });
    productCount++;
  }

  return NextResponse.json({
    productCount,
    categoryCount: catCache.size,
    categories: Array.from(catCache.keys()),
    errors,
  });
}
