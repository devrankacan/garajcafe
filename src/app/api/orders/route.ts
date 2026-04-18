import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const tableId = searchParams.get("tableId");

  const where: Record<string, unknown> = {};
  if (status) {
    const statuses = status.split(",");
    where.status = statuses.length > 1 ? { in: statuses } : statuses[0];
  }
  if (tableId) where.tableId = Number(tableId);

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      table: true,
      waiter: { select: { id: true, name: true } },
      items: { include: { product: true } },
    },
  });
  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const { tableId, items, note } = await req.json();

  const cookieStore = await cookies();
  const waiterId = cookieStore.get("waiter_id")?.value;

  const total = items.reduce(
    (sum: number, item: { unitPrice: number; quantity: number }) =>
      sum + item.unitPrice * item.quantity,
    0
  );

  const order = await prisma.order.create({
    data: {
      tableId,
      note,
      total,
      waiterId: waiterId ? Number(waiterId) : null,
      items: {
        create: items.map((item: { productId: number; quantity: number; unitPrice: number }) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      },
    },
    include: { items: { include: { product: true } }, table: true },
  });

  await prisma.table.update({
    where: { id: tableId },
    data: { status: "OCCUPIED" },
  });

  return NextResponse.json(order);
}
