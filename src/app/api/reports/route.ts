import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function toIstanbul(date: Date) {
  return new Date(date.toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "daily";

  const now = toIstanbul(new Date());
  let from: Date;

  if (period === "daily") {
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  } else if (period === "weekly") {
    const day = now.getDay();
    const diff = (day === 0 ? -6 : 1 - day);
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff, 0, 0, 0);
  } else {
    from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  }

  // Convert back to UTC for DB query
  const utcOffset = 3 * 60 * 60 * 1000;
  const fromUtc = new Date(from.getTime() - utcOffset);

  const orders = await prisma.order.findMany({
    where: {
      status: "CLOSED",
      closedAt: { gte: fromUtc },
    },
    include: {
      table: true,
      waiter: { select: { name: true } },
      items: { include: { product: true } },
    },
    orderBy: { closedAt: "desc" },
  });

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const orderCount = orders.length;

  const byMethod: Record<string, number> = {};
  for (const o of orders) {
    const m = o.paymentMethod ?? "Diğer";
    byMethod[m] = (byMethod[m] ?? 0) + o.total;
  }

  return NextResponse.json({ orders, totalRevenue, orderCount, byMethod });
}
