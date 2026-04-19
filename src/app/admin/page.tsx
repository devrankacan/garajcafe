"use client";

import { useEffect, useState, useCallback } from "react";

type OrderItem = {
  id: number;
  quantity: number;
  unitPrice: number;
  product: { name: string };
};

type Order = {
  id: number;
  status: string;
  total: number;
  note?: string;
  createdAt: string;
  table: { id: number; name: string };
  waiter?: { name: string } | null;
  items: OrderItem[];
};

type Table = { id: number; name: string; status: string };

const statusLabel: Record<string, string> = {
  PENDING: "Bekliyor",
  APPROVED: "Onaylandı",
  REJECTED: "Reddedildi",
  CLOSED: "Kapatıldı",
};

const statusColor: Record<string, { bg: string; color: string; border: string }> = {
  PENDING:  { bg: "rgba(234,179,8,0.1)",  color: "#facc15", border: "rgba(234,179,8,0.4)" },
  APPROVED: { bg: "rgba(34,197,94,0.1)",  color: "#4ade80", border: "rgba(34,197,94,0.4)" },
  REJECTED: { bg: "rgba(239,68,68,0.1)",  color: "#f87171", border: "rgba(239,68,68,0.4)" },
  CLOSED:   { bg: "rgba(100,100,100,0.1)", color: "#9ca3af", border: "rgba(100,100,100,0.4)" },
};

const card = { background: "#1a1a1a", border: "1px solid rgba(204,21,21,0.2)" };
const divider = { borderColor: "rgba(204,21,21,0.15)" };

export default function OrdersPage() {
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [adisyonTable, setAdisyonTable] = useState<Table | null>(null);
  const [adisyonOrders, setAdisyonOrders] = useState<Order[]>([]);
  const [occupiedTables, setOccupiedTables] = useState<Table[]>([]);

  const fetchOrders = useCallback(async () => {
    const [orders, tables] = await Promise.all([
      fetch("/api/orders?status=PENDING").then((r) => r.json()),
      fetch("/api/tables").then((r) => r.json()),
    ]);
    setPendingOrders(orders);
    setOccupiedTables(tables.filter((t: Table) => t.status === "OCCUPIED"));
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  async function updateStatus(orderId: number, status: string) {
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchOrders();
    if (adisyonTable) openAdisyon(adisyonTable);
  }

  async function openAdisyon(table: Table) {
    const orders = await fetch(`/api/orders?tableId=${table.id}&status=PENDING,APPROVED`).then((r) => r.json());
    setAdisyonOrders(orders);
    setAdisyonTable(table);
  }

  async function closeTable(tableId: number) {
    const approved = await fetch(`/api/orders?tableId=${tableId}&status=APPROVED`).then((r) => r.json());
    await Promise.all(approved.map((o: Order) =>
      fetch(`/api/orders/${o.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "CLOSED" }) })
    ));
    await fetch(`/api/tables/${tableId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "EMPTY" }),
    });
    setAdisyonTable(null);
    fetchOrders();
  }

  const adisyonTotal = adisyonOrders
    .filter((o) => o.status === "APPROVED")
    .reduce((sum, o) => sum + o.total, 0);

  const inputCls = "w-full rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none";
  const inputStyle = { background: "rgba(0,0,0,0.4)", border: "1px solid rgba(204,21,21,0.25)" };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Bekleyen Siparişler */}
      <div className="lg:col-span-2">
        <h2 className="font-bold text-white mb-3">
          Bekleyen Siparişler
          {pendingOrders.length > 0 && (
            <span className="ml-2 bg-red-600 text-white text-xs rounded-full px-2 py-0.5">{pendingOrders.length}</span>
          )}
        </h2>
        <div className="space-y-3">
          {pendingOrders.length === 0 && (
            <div className="rounded-xl p-8 text-center text-gray-500" style={card}>Bekleyen sipariş yok</div>
          )}
          {pendingOrders.map((order) => (
            <div key={order.id} className="rounded-xl overflow-hidden" style={card}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(204,21,21,0.15)" }}>
                <div>
                  <span className="font-bold text-white">{order.table.name}</span>
                  {order.waiter && <span className="ml-2 text-xs text-gray-400">— {order.waiter.name}</span>}
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(order.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="px-4 py-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm py-0.5">
                    <span className="text-gray-200">{item.quantity}× {item.product.name}</span>
                    <span className="text-gray-400">{(item.quantity * item.unitPrice).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</span>
                  </div>
                ))}
                {order.note && (
                  <p className="text-xs mt-2 rounded px-2 py-1" style={{ background: "rgba(204,21,21,0.1)", color: "#fca5a5" }}>Not: {order.note}</p>
                )}
                <div className="flex justify-between font-bold mt-2 pt-2 text-white" style={{ borderTop: "1px solid rgba(204,21,21,0.15)" }}>
                  <span>Toplam</span>
                  <span style={{ color: "#cc1515" }}>{order.total.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</span>
                </div>
              </div>
              <div className="flex gap-2 px-4 py-3" style={{ background: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(204,21,21,0.15)" }}>
                <button onClick={() => updateStatus(order.id, "APPROVED")} className="flex-1 bg-green-700 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-medium">Onayla</button>
                <button onClick={() => updateStatus(order.id, "REJECTED")} className="flex-1 bg-red-700 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium">Reddet</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dolu Masalar */}
      <div>
        <h2 className="font-bold text-white mb-3">Dolu Masalar</h2>
        <div className="space-y-2">
          {occupiedTables.length === 0 && (
            <div className="rounded-xl p-6 text-center text-gray-500 text-sm" style={card}>Açık masa yok</div>
          )}
          {occupiedTables.map((table) => (
            <button key={table.id} onClick={() => openAdisyon(table)}
              className="w-full rounded-xl p-4 text-left transition-all hover:brightness-125"
              style={card}>
              <p className="font-bold text-white">{table.name}</p>
              <p className="text-xs mt-0.5" style={{ color: "#cc1515" }}>Adisyonu Gör →</p>
            </button>
          ))}
        </div>
      </div>

      {/* Adisyon Modal */}
      {adisyonTable && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 px-2 sm:px-4">
          <div className="rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col" style={{ background: "#111111", border: "1px solid rgba(204,21,21,0.3)" }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(204,21,21,0.2)" }}>
              <h3 className="font-bold text-lg text-white">{adisyonTable.name} — Adisyon</h3>
              <button onClick={() => setAdisyonTable(null)} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-3 space-y-3">
              {adisyonOrders.length === 0 && <p className="text-gray-500 text-center py-6 text-sm">Sipariş bulunamadı.</p>}
              {adisyonOrders.map((order) => {
                const sc = statusColor[order.status] ?? statusColor.CLOSED;
                return (
                  <div key={order.id} className="rounded-xl p-3" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs border px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.color, borderColor: sc.border }}>{statusLabel[order.status]}</span>
                      <div className="flex items-center gap-2">
                        {order.waiter && <span className="text-xs text-gray-400">{order.waiter.name}</span>}
                        <span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm py-0.5">
                        <span className="text-gray-200">{item.quantity}× {item.product.name}</span>
                        <span className="text-gray-400">{(item.quantity * item.unitPrice).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</span>
                      </div>
                    ))}
                    {order.status === "PENDING" && (
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => updateStatus(order.id, "APPROVED")} className="flex-1 bg-green-700 text-white text-xs py-1.5 rounded-lg">Onayla</button>
                        <button onClick={() => updateStatus(order.id, "REJECTED")} className="flex-1 bg-red-700 text-white text-xs py-1.5 rounded-lg">Reddet</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="px-5 py-4" style={{ borderTop: "1px solid rgba(204,21,21,0.2)" }}>
              <div className="flex justify-between font-bold text-lg mb-3">
                <span className="text-white">Toplam</span>
                <span style={{ color: "#cc1515" }}>{adisyonTotal.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</span>
              </div>
              <button onClick={() => closeTable(adisyonTable.id)}
                className="w-full py-3 rounded-xl font-bold text-white"
                style={{ background: "#cc1515" }}>
                Adisyonu Kapat & Tahsil Et
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
