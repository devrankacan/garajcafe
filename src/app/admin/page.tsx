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
  waiter?: { id: number; name: string } | null;
  items: OrderItem[];
};

type Table = { id: number; number: number; name: string; status: string };
type Waiter = { id: number; name: string; username: string };

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
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [tab, setTab] = useState<"orders" | "tables" | "waiters">("orders");
  const [loading, setLoading] = useState(true);

  // Adisyon modal
  const [adisyonTable, setAdisyonTable] = useState<Table | null>(null);
  const [adisyonOrders, setAdisyonOrders] = useState<Order[]>([]);

  // Waiter modal
  const [waiterModal, setWaiterModal] = useState(false);
  const [waiterForm, setWaiterForm] = useState({ name: "", username: "", password: "" });
  const [editWaiterId, setEditWaiterId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    const [ord, tbl, wtr] = await Promise.all([
      fetch("/api/orders?status=PENDING").then((r) => r.json()),
      fetch("/api/tables").then((r) => r.json()),
      fetch("/api/waiters").then((r) => r.json()),
    ]);
    setOrders(ord);
    setTables(tbl);
    setWaiters(wtr);
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

  async function openAdisyon(table: Table) {
    const tableOrders = await fetch(`/api/orders?tableId=${table.id}&status=PENDING,APPROVED`).then((r) => r.json());
    setAdisyonOrders(tableOrders);
    setAdisyonTable(table);
  }

  async function closeTable(tableId: number) {
    const tableOrders = await fetch(`/api/orders?tableId=${tableId}&status=APPROVED`).then((r) => r.json());
    await Promise.all(tableOrders.map((o: Order) => updateOrderStatus(o.id, "CLOSED")));
    await fetch(`/api/tables/${tableId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "EMPTY" }),
    });
    setAdisyonTable(null);
    fetchData();
  }

  // Waiter CRUD
  async function saveWaiter() {
    if (editWaiterId) {
      await fetch(`/api/waiters/${editWaiterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(waiterForm),
      });
    } else {
      await fetch("/api/waiters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(waiterForm),
      });
    }
    setWaiterModal(false);
    setWaiterForm({ name: "", username: "", password: "" });
    setEditWaiterId(null);
    fetchData();
  }

  async function deleteWaiter(id: number) {
    if (!confirm("Garsonu sil?")) return;
    await fetch(`/api/waiters/${id}`, { method: "DELETE" });
    fetchData();
  }

  const adisyonTotal = adisyonOrders
    .filter((o) => o.status === "APPROVED")
    .reduce((sum, o) => sum + o.total, 0);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <p className="text-slate-500 animate-pulse">Yükleniyor...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white px-4 py-3 shadow">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold">Admin / Kasa</h1>
          <div className="flex gap-2">
            <Link href="/admin/menu" className="bg-amber-700 hover:bg-amber-600 px-3 py-1.5 rounded text-sm">Menü</Link>
            <Link href="/admin/settings" className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded text-sm">Ayarlar</Link>
            <Link href="/admin/tables" className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded text-sm">QR</Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab("orders")} className={`px-4 py-2 rounded-lg font-medium text-sm ${tab === "orders" ? "bg-amber-700 text-white" : "bg-white text-slate-700 border"}`}>
            Siparişler {orders.length > 0 && <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5">{orders.length}</span>}
          </button>
          <button onClick={() => setTab("tables")} className={`px-4 py-2 rounded-lg font-medium text-sm ${tab === "tables" ? "bg-amber-700 text-white" : "bg-white text-slate-700 border"}`}>
            Masalar
          </button>
          <button onClick={() => setTab("waiters")} className={`px-4 py-2 rounded-lg font-medium text-sm ${tab === "waiters" ? "bg-amber-700 text-white" : "bg-white text-slate-700 border"}`}>
            Garsonlar
          </button>
        </div>

        {/* Orders Tab */}
        {tab === "orders" && (
          <div className="space-y-3">
            {orders.length === 0 && (
              <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm">Bekleyen sipariş yok</div>
            )}
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <div>
                    <span className="font-bold text-slate-800">{order.table.name}</span>
                    <span className={`ml-2 text-xs border px-2 py-0.5 rounded-full ${statusColor[order.status]}`}>
                      {statusLabel[order.status]}
                    </span>
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
                {order.status === "PENDING" && (
                  <div className="flex gap-2 px-4 py-3 bg-gray-50 border-t">
                    <button onClick={() => updateOrderStatus(order.id, "APPROVED")} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg text-sm font-medium">Onayla</button>
                    <button onClick={() => updateOrderStatus(order.id, "REJECTED")} className="flex-1 bg-red-500 hover:bg-red-400 text-white py-2 rounded-lg text-sm font-medium">Reddet</button>
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
                  <button onClick={() => openAdisyon(table)} className="w-full bg-slate-800 hover:bg-slate-700 text-white text-sm py-1.5 rounded-lg font-medium">
                    Adisyonu Gör
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Waiters Tab */}
        {tab === "waiters" && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-slate-700">Garsonlar</h2>
              <button onClick={() => { setWaiterForm({ name: "", username: "", password: "" }); setEditWaiterId(null); setWaiterModal(true); }} className="bg-amber-700 hover:bg-amber-600 text-white px-3 py-1.5 rounded text-sm">
                + Garson Ekle
              </button>
            </div>
            <div className="space-y-2">
              {waiters.length === 0 && <p className="text-gray-400 text-center py-8">Henüz garson eklenmemiş.</p>}
              {waiters.map((w) => (
                <div key={w.id} className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="font-semibold text-slate-800">{w.name}</p>
                    <p className="text-xs text-slate-500">@{w.username}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setWaiterForm({ name: w.name, username: w.username, password: "" }); setEditWaiterId(w.id); setWaiterModal(true); }} className="text-slate-400 hover:text-slate-700">✏️</button>
                    <button onClick={() => deleteWaiter(w.id)} className="text-slate-400 hover:text-red-600">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Adisyon Modal */}
      {adisyonTable && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-2 sm:px-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-xl max-h-[85vh] flex flex-col">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-lg">{adisyonTable.name} — Adisyon</h3>
              <button onClick={() => setAdisyonTable(null)} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-3 space-y-3">
              {adisyonOrders.length === 0 && <p className="text-gray-400 text-center py-6">Onaylı sipariş yok.</p>}
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
                      <button onClick={() => { updateOrderStatus(order.id, "APPROVED"); openAdisyon(adisyonTable); }} className="flex-1 bg-green-600 text-white text-xs py-1.5 rounded-lg">Onayla</button>
                      <button onClick={() => { updateOrderStatus(order.id, "REJECTED"); openAdisyon(adisyonTable); }} className="flex-1 bg-red-500 text-white text-xs py-1.5 rounded-lg">Reddet</button>
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

      {/* Waiter Modal */}
      {waiterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-lg mb-4">{editWaiterId ? "Garson Düzenle" : "Garson Ekle"}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                <input value={waiterForm.name} onChange={(e) => setWaiterForm({ ...waiterForm, name: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı Adı</label>
                <input value={waiterForm.username} onChange={(e) => setWaiterForm({ ...waiterForm, username: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{editWaiterId ? "Yeni Şifre (boş bırakırsan değişmez)" : "Şifre"}</label>
                <input type="password" value={waiterForm.password} onChange={(e) => setWaiterForm({ ...waiterForm, password: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setWaiterModal(false)} className="flex-1 border rounded-xl py-2 text-sm">İptal</button>
              <button onClick={saveWaiter} className="flex-1 bg-amber-700 text-white rounded-xl py-2 text-sm font-medium">Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
