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

const statusColor: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
  APPROVED: "bg-green-100 text-green-800 border-green-300",
  REJECTED: "bg-red-100 text-red-800 border-red-300",
  CLOSED: "bg-gray-100 text-gray-600 border-gray-300",
};

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Bekleyen Siparişler */}
      <div className="lg:col-span-2">
        <h2 className="font-bold text-slate-700 mb-3">
          Bekleyen Siparişler
          {pendingOrders.length > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{pendingOrders.length}</span>
          )}
        </h2>
        <div className="space-y-3">
          {pendingOrders.length === 0 && (
            <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm">Bekleyen sipariş yok</div>
          )}
          {pendingOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div>
                  <span className="font-bold text-slate-800">{order.table.name}</span>
                  {order.waiter && <span className="ml-2 text-xs text-slate-500">— {order.waiter.name}</span>}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(order.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="px-4 py-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm py-0.5">
                    <span>{item.quantity}× {item.product.name}</span>
                    <span className="text-gray-500">{(item.quantity * item.unitPrice).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</span>
                  </div>
                ))}
                {order.note && <p className="text-xs text-amber-700 mt-2 bg-amber-50 rounded px-2 py-1">Not: {order.note}</p>}
                <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                  <span>Toplam</span>
                  <span>{order.total.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</span>
                </div>
              </div>
              <div className="flex gap-2 px-4 py-3 bg-gray-50 border-t">
                <button onClick={() => updateStatus(order.id, "APPROVED")} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg text-sm font-medium">Onayla</button>
                <button onClick={() => updateStatus(order.id, "REJECTED")} className="flex-1 bg-red-500 hover:bg-red-400 text-white py-2 rounded-lg text-sm font-medium">Reddet</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dolu Masalar */}
      <div>
        <h2 className="font-bold text-slate-700 mb-3">Dolu Masalar</h2>
        <div className="space-y-2">
          {occupiedTables.length === 0 && (
            <div className="bg-white rounded-xl p-6 text-center text-gray-400 shadow-sm text-sm">Açık masa yok</div>
          )}
          {occupiedTables.map((table) => (
            <button
              key={table.id}
              onClick={() => openAdisyon(table)}
              className="w-full bg-white rounded-xl p-4 shadow-sm text-left hover:bg-amber-50 transition-colors border-2 border-transparent hover:border-amber-300"
            >
              <p className="font-bold text-slate-800">{table.name}</p>
              <p className="text-xs text-amber-700 mt-0.5">Adisyonu Gör →</p>
            </button>
          ))}
        </div>
      </div>

      {/* Adisyon Modal */}
      {adisyonTable && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-2 sm:px-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-xl max-h-[85vh] flex flex-col">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-lg">{adisyonTable.name} — Adisyon</h3>
              <button onClick={() => setAdisyonTable(null)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-3 space-y-3">
              {adisyonOrders.length === 0 && <p className="text-gray-400 text-center py-6 text-sm">Sipariş bulunamadı.</p>}
              {adisyonOrders.map((order) => (
                <div key={order.id} className="border rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs border px-2 py-0.5 rounded-full ${statusColor[order.status]}`}>{statusLabel[order.status]}</span>
                    <div className="flex items-center gap-2">
                      {order.waiter && <span className="text-xs text-slate-500">{order.waiter.name}</span>}
                      <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm py-0.5">
                      <span>{item.quantity}× {item.product.name}</span>
                      <span className="text-gray-500">{(item.quantity * item.unitPrice).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</span>
                    </div>
                  ))}
                  {order.status === "PENDING" && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => updateStatus(order.id, "APPROVED")} className="flex-1 bg-green-600 text-white text-xs py-1.5 rounded-lg">Onayla</button>
                      <button onClick={() => updateStatus(order.id, "REJECTED")} className="flex-1 bg-red-500 text-white text-xs py-1.5 rounded-lg">Reddet</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t">
              <div className="flex justify-between font-bold text-lg mb-3">
                <span>Toplam</span>
                <span className="text-amber-700">{adisyonTotal.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</span>
              </div>
              <button onClick={() => closeTable(adisyonTable.id)} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold">
                Adisyonu Kapat & Tahsil Et
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
