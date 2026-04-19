import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status, tableId } = await req.json();

  const data: Record<string, unknown> = {};
  if (status !== undefined) data.status = status;
  if (tableId !== undefined) data.tableId = tableId;

  const order = await prisma.order.update({
    where: { id: Number(id) },
    data,
    include: { table: true, items: { include: { product: true } } },
  });

  if (status === "CLOSED" || status === "REJECTED") {
    const openOrders = await prisma.order.findMany({
      where: {
        tableId: order.tableId,
        status: { in: ["PENDING", "APPROVED"] },
      },
    });
    if (openOrders.length === 0) {
      await prisma.table.update({
        where: { id: order.tableId },
        data: { status: "EMPTY" },
      });
    }
  }

  return NextResponse.json(order);
}
