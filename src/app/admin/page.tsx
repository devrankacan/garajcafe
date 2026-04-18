"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

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
  table: { id: number; name: string; number: number };
  items: OrderItem[];
};

type Table = { id: number; number: number; name: string; status: string };

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

const tableStatusColor: Record<string, string> = {
  EMPTY: "bg-green-50 border-green-300",
  OCCUPIED: "bg-red-50 border-red-300",
  OPEN: "bg-yellow-50 border-yellow-300",
};

const tableStatusLabel: Record<string, string> = {
  EMPTY: "Boş",
  OCCUPIED: "Dolu",
  OPEN: "Açık",
};

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [tab, setTab] = useState<"orders" | "tables">("orders");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [ord, tbl] = await Promise.all([
      fetch("/api/orders?status=PENDING").then((r) => r.json()),
      fetch("/api/tables").then((r) => r.json()),
    ]);
    setOrders(ord);
    setTables(tbl);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  async function updateOrderStatus(orderId: number, status: string) {
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchData();
  }

  async function closeTable(tableId: number) {
    const tableOrders = await fetch(`/api/orders?tableId=${tableId}&status=APPROVED`).then((r) => r.json());
    await Promise.all(tableOrders.map((o: Order) => updateOrderStatus(o.id, "CLOSED")));
    await fetch(`/api/tables/${tableId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "EMPTY" }),
    });
    fetchData();
  }

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <p className="text-slate-500 animate-pulse">Yükleniyor...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-900 text-white px-4 py-3 shadow">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold">Admin / Kasa</h1>
          <div className="flex gap-2">
            <Link href="/admin/menu" className="bg-amber-700 hover:bg-amber-600 px-3 py-1.5 rounded text-sm">
              Menü Yönetimi
            </Link>
            <Link href="/admin/settings" className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded text-sm">
              Ayarlar
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Tab */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab("orders")}
            className={`px-4 py-2 rounded-lg font-medium text-sm ${tab === "orders" ? "bg-amber-700 text-white" : "bg-white text-slate-700 border"}`}
          >
            Siparişler {orders.length > 0 && <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5">{orders.length}</span>}
          </button>
          <button
            onClick={() => setTab("tables")}
            className={`px-4 py-2 rounded-lg font-medium text-sm ${tab === "tables" ? "bg-amber-700 text-white" : "bg-white text-slate-700 border"}`}
          >
            Masalar
          </button>
        </div>

        {/* Orders Tab */}
        {tab === "orders" && (
          <div className="space-y-3">
            {orders.length === 0 && (
              <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm">
                Bekleyen sipariş yok
              </div>
            )}
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <div>
                    <span className="font-bold text-slate-800">{order.table.name}</span>
                    <span className={`ml-2 text-xs border px-2 py-0.5 rounded-full ${statusColor[order.status]}`}>
                      {statusLabel[order.status]}
                    </span>
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
                {order.status === "PENDING" && (
                  <div className="flex gap-2 px-4 py-3 bg-gray-50 border-t">
                    <button
                      onClick={() => updateOrderStatus(order.id, "APPROVED")}
                      className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg text-sm font-medium"
                    >
                      Onayla
                    </button>
                    <button
                      onClick={() => updateOrderStatus(order.id, "REJECTED")}
                      className="flex-1 bg-red-500 hover:bg-red-400 text-white py-2 rounded-lg text-sm font-medium"
                    >
                      Reddet
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tables Tab */}
        {tab === "tables" && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {tables.map((table) => (
              <div key={table.id} className={`border-2 rounded-xl p-4 ${tableStatusColor[table.status]}`}>
                <p className="font-bold text-slate-800">{table.name}</p>
                <p className="text-xs text-slate-500 mb-2">{tableStatusLabel[table.status]}</p>
                {table.status === "OCCUPIED" && (
                  <button
                    onClick={() => closeTable(table.id)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white text-sm py-1.5 rounded-lg font-medium"
                  >
                    Adisyon Kapat
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
