"use client";

import { useEffect, useState } from "react";

type OrderItem = { quantity: number; unitPrice: number; product: { name: string } };
type Order = {
  id: number; total: number; note?: string; paymentMethod?: string;
  closedAt: string; createdAt: string;
  table: { name: string };
  waiter?: { name: string } | null;
  items: OrderItem[];
};
type ReportData = {
  orders: Order[];
  totalRevenue: number;
  orderCount: number;
  byMethod: Record<string, number>;
};

type Period = "daily" | "weekly" | "monthly";

const periodLabels: Record<Period, string> = { daily: "Günlük", weekly: "Haftalık", monthly: "Aylık" };

const methodColors: Record<string, string> = {
  Nakit: "#16a34a",
  Kart: "#0f766e",
  İBAN: "#6d28d9",
  Kısmi: "#c2410c",
  Diğer: "#6b7280",
};

function fmtTL(n: number) {
  return n.toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtOnlyTime(iso: string) {
  return new Date(iso).toLocaleTimeString("tr-TR", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit", minute: "2-digit",
  });
}

const card = { background: "#1a1a1a", border: "1px solid rgba(204,21,21,0.2)" };

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("daily");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports?period=${period}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [period]);

  const now = new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "full" });

  return (
    <div className="max-w-4xl">
      {/* Başlık + periyot seçimi */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="font-bold text-white text-lg">Raporlar</h2>
          <p className="text-xs text-gray-500 mt-0.5">{now}</p>
        </div>
        <div className="flex gap-1.5">
          {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={period === p
                ? { background: "#cc1515", color: "#fff" }
                : { background: "rgba(204,21,21,0.1)", color: "#cc1515", border: "1px solid rgba(204,21,21,0.3)" }}>
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="text-gray-500 text-center py-20">Yükleniyor...</div>}

      {!loading && data && (
        <>
          {/* Özet kartları */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="rounded-2xl p-4" style={card}>
              <p className="text-xs text-gray-500 uppercase mb-1">Toplam Ciro</p>
              <p className="text-xl font-bold" style={{ color: "#cc1515" }}>{fmtTL(data.totalRevenue)}</p>
            </div>
            <div className="rounded-2xl p-4" style={card}>
              <p className="text-xs text-gray-500 uppercase mb-1">Kapatılan Sipariş</p>
              <p className="text-xl font-bold text-white">{data.orderCount}</p>
            </div>
            <div className="rounded-2xl p-4" style={card}>
              <p className="text-xs text-gray-500 uppercase mb-1">Ortalama Tutar</p>
              <p className="text-xl font-bold text-white">
                {data.orderCount > 0 ? fmtTL(data.totalRevenue / data.orderCount) : "—"}
              </p>
            </div>
            <div className="rounded-2xl p-4" style={card}>
              <p className="text-xs text-gray-500 uppercase mb-1">Ödeme Çeşidi</p>
              <p className="text-xl font-bold text-white">{Object.keys(data.byMethod).length}</p>
            </div>
          </div>

          {/* Ödeme yöntemine göre */}
          {Object.keys(data.byMethod).length > 0 && (
            <div className="rounded-2xl p-5 mb-5" style={card}>
              <p className="text-xs font-semibold uppercase mb-4" style={{ color: "#cc1515" }}>Ödeme Yöntemine Göre</p>
              <div className="space-y-3">
                {Object.entries(data.byMethod).sort((a, b) => b[1] - a[1]).map(([method, amount]) => {
                  const pct = data.totalRevenue > 0 ? (amount / data.totalRevenue) * 100 : 0;
                  const color = methodColors[method] ?? methodColors.Diğer;
                  return (
                    <div key={method}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                          <span className="text-sm font-semibold text-white">{method}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-white">{fmtTL(amount)}</span>
                          <span className="text-xs text-gray-500 ml-2">%{pct.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sipariş detay tablosu */}
          <div className="rounded-2xl overflow-hidden" style={card}>
            <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(204,21,21,0.15)" }}>
              <p className="text-xs font-semibold uppercase" style={{ color: "#cc1515" }}>Sipariş Detayları</p>
            </div>
            {data.orders.length === 0 ? (
              <p className="text-center text-gray-500 py-12 text-sm">Bu dönemde kapatılmış sipariş yok.</p>
            ) : (
              <div className="divide-y" style={{ borderColor: "rgba(204,21,21,0.08)" }}>
                {data.orders.map((order) => {
                  const color = methodColors[order.paymentMethod ?? "Diğer"] ?? methodColors.Diğer;
                  return (
                    <div key={order.id} className="px-5 py-3 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white text-sm">{order.table.name}</span>
                            {order.waiter && <span className="text-xs text-gray-500">— {order.waiter.name}</span>}
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>
                              {order.paymentMethod ?? "Diğer"}
                            </span>
                          </div>
                          <div className="flex gap-3 mt-1">
                            <span className="text-xs text-gray-500">
                              🕐 {fmtTime(order.closedAt ?? order.createdAt)}
                            </span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                            {order.items.map((item, i) => (
                              <span key={i} className="text-xs text-gray-400">
                                {item.quantity}× {item.product.name}
                              </span>
                            ))}
                          </div>
                          {order.note && !order.note.startsWith("Ödeme:") && (
                            <p className="text-xs text-gray-500 mt-1 italic">{order.note}</p>
                          )}
                        </div>
                        <span className="font-bold text-white text-sm flex-shrink-0">{fmtTL(order.total)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {data.orders.length > 0 && (
              <div className="px-5 py-3 flex justify-between font-bold" style={{ borderTop: "1px solid rgba(204,21,21,0.2)", background: "rgba(0,0,0,0.2)" }}>
                <span className="text-gray-300">TOPLAM</span>
                <span style={{ color: "#cc1515" }}>{fmtTL(data.totalRevenue)}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
