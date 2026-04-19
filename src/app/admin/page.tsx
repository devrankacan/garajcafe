"use client";

import { useEffect, useState, useCallback } from "react";

type OrderItem = { id: number; quantity: number; unitPrice: number; product: { name: string } };
type Order = {
  id: number; status: string; total: number; note?: string; createdAt: string;
  table: { id: number; name: string };
  waiter?: { name: string } | null;
  items: OrderItem[];
};
type Table = { id: number; name: string; status: string };
type Product = { id: number; name: string; price: number; description?: string };
type Category = { id: number; name: string; products: Product[] };
type CartItem = { product: Product; quantity: number };

const statusLabel: Record<string, string> = { PENDING: "Bekliyor", APPROVED: "Onaylandı", REJECTED: "Reddedildi", CLOSED: "Kapatıldı" };
const statusColor: Record<string, { bg: string; color: string; border: string }> = {
  PENDING:  { bg: "rgba(234,179,8,0.1)",   color: "#facc15", border: "rgba(234,179,8,0.4)" },
  APPROVED: { bg: "rgba(34,197,94,0.1)",   color: "#4ade80", border: "rgba(34,197,94,0.4)" },
  REJECTED: { bg: "rgba(239,68,68,0.1)",   color: "#f87171", border: "rgba(239,68,68,0.4)" },
  CLOSED:   { bg: "rgba(100,100,100,0.1)", color: "#9ca3af", border: "rgba(100,100,100,0.4)" },
};
const tableStatusStyle: Record<string, { bg: string; color: string; label: string }> = {
  EMPTY:    { bg: "rgba(34,197,94,0.08)",  color: "#4ade80", label: "Boş" },
  OCCUPIED: { bg: "rgba(204,21,21,0.12)",  color: "#f87171", label: "Dolu" },
  OPEN:     { bg: "rgba(234,179,8,0.08)",  color: "#facc15", label: "Açık" },
};

const card = { background: "#1a1a1a", border: "1px solid rgba(204,21,21,0.2)" };
const divider = { borderTop: "1px solid rgba(204,21,21,0.15)" };

export default function OrdersPage() {
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Adisyon modal
  const [adisyonTable, setAdisyonTable] = useState<Table | null>(null);
  const [adisyonOrders, setAdisyonOrders] = useState<Order[]>([]);

  // Kasa sipariş modal
  const [orderTable, setOrderTable] = useState<Table | null>(null);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderNote, setOrderNote] = useState("");
  const [sending, setSending] = useState(false);

  const fetchAll = useCallback(async () => {
    const [orders, tbls] = await Promise.all([
      fetch("/api/orders?status=PENDING").then((r) => r.json()),
      fetch("/api/tables").then((r) => r.json()),
    ]);
    setPendingOrders(orders);
    setTables(tbls);
  }, []);

  useEffect(() => {
    fetchAll();
    fetch("/api/categories").then((r) => r.json()).then((cats) => {
      setCategories(cats);
      if (cats.length > 0) setActiveCategory(cats[0].id);
    });
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  async function updateStatus(orderId: number, status: string) {
    await fetch(`/api/orders/${orderId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchAll();
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
    await fetch(`/api/tables/${tableId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "EMPTY" }) });
    setAdisyonTable(null);
    fetchAll();
  }

  function openOrderModal(table: Table) {
    setOrderTable(table);
    setCart([]);
    setOrderNote("");
  }

  function addToCart(product: Product) {
    setCart((prev) => {
      const ex = prev.find((i) => i.product.id === product.id);
      if (ex) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
  }

  function removeFromCart(productId: number) {
    setCart((prev) => {
      const ex = prev.find((i) => i.product.id === productId);
      if (!ex) return prev;
      if (ex.quantity > 1) return prev.map((i) => i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i);
      return prev.filter((i) => i.product.id !== productId);
    });
  }

  async function sendOrder() {
    if (!orderTable || cart.length === 0) return;
    setSending(true);
    await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableId: orderTable.id,
        note: orderNote,
        autoApprove: true,
        items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity, unitPrice: i.product.price })),
      }),
    });
    setSending(false);
    setOrderTable(null);
    setCart([]);
    fetchAll();
  }

  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const adisyonTotal = adisyonOrders.filter((o) => o.status === "APPROVED").reduce((s, o) => s + o.total, 0);
  const activeProducts = categories.find((c) => c.id === activeCategory)?.products ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Bekleyen Siparişler */}
      <div className="lg:col-span-2">
        <h2 className="font-bold text-white mb-3">
          Bekleyen Siparişler
          {pendingOrders.length > 0 && <span className="ml-2 bg-red-600 text-white text-xs rounded-full px-2 py-0.5">{pendingOrders.length}</span>}
        </h2>
        <div className="space-y-3">
          {pendingOrders.length === 0 && (
            <div className="rounded-xl p-8 text-center text-gray-500" style={card}>Bekleyen sipariş yok</div>
          )}
          {pendingOrders.map((order) => (
            <div key={order.id} className="rounded-xl overflow-hidden" style={card}>
              <div className="flex items-center justify-between px-4 py-3" style={divider}>
                <div>
                  <span className="font-bold text-white">{order.table.name}</span>
                  {order.waiter && <span className="ml-2 text-xs text-gray-400">— {order.waiter.name}</span>}
                </div>
                <span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div className="px-4 py-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm py-0.5">
                    <span className="text-gray-200">{item.quantity}× {item.product.name}</span>
                    <span className="text-gray-400">{(item.quantity * item.unitPrice).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</span>
                  </div>
                ))}
                {order.note && <p className="text-xs mt-2 rounded px-2 py-1" style={{ background: "rgba(204,21,21,0.1)", color: "#fca5a5" }}>Not: {order.note}</p>}
                <div className="flex justify-between font-bold mt-2 pt-2 text-white" style={divider}>
                  <span>Toplam</span>
                  <span style={{ color: "#cc1515" }}>{order.total.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</span>
                </div>
              </div>
              <div className="flex gap-2 px-4 py-3" style={{ background: "rgba(0,0,0,0.2)", ...divider }}>
                <button onClick={() => updateStatus(order.id, "APPROVED")} className="flex-1 bg-green-700 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-medium">Onayla</button>
                <button onClick={() => updateStatus(order.id, "REJECTED")} className="flex-1 bg-red-700 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium">Reddet</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tüm Masalar */}
      <div>
        <h2 className="font-bold text-white mb-3">Masalar</h2>
        <div className="space-y-2">
          {tables.length === 0 && <div className="rounded-xl p-6 text-center text-gray-500 text-sm" style={card}>Masa bulunamadı</div>}
          {tables.map((table) => {
            const st = tableStatusStyle[table.status] ?? tableStatusStyle.EMPTY;
            const isOccupied = table.status === "OCCUPIED";
            return (
              <div key={table.id} className="rounded-xl p-3 flex items-center justify-between" style={{ ...card, background: st.bg }}>
                <div>
                  <p className="font-bold text-white text-sm">{table.name}</p>
                  <span className="text-xs font-medium" style={{ color: st.color }}>{st.label}</span>
                </div>
                <div className="flex gap-2">
                  {isOccupied && (
                    <button onClick={() => openAdisyon(table)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                      style={{ background: "rgba(204,21,21,0.6)", border: "1px solid rgba(204,21,21,0.5)" }}>
                      Adisyon
                    </button>
                  )}
                  <button onClick={() => openOrderModal(table)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: "rgba(255,255,255,0.1)", color: "#e5e7eb", border: "1px solid rgba(255,255,255,0.15)" }}>
                    Sipariş Al
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Adisyon Modal */}
      {adisyonTable && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 px-2 sm:px-4">
          <div className="rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col" style={{ background: "#111111", border: "1px solid rgba(204,21,21,0.3)" }}>
            <div className="px-5 py-4 flex items-center justify-between" style={divider}>
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
            <div className="px-5 py-4" style={divider}>
              <div className="flex justify-between font-bold text-lg mb-3">
                <span className="text-white">Toplam</span>
                <span style={{ color: "#cc1515" }}>{adisyonTotal.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</span>
              </div>
              <button onClick={() => closeTable(adisyonTable.id)} className="w-full py-3 rounded-xl font-bold text-white" style={{ background: "#cc1515" }}>
                Adisyonu Kapat & Tahsil Et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kasa Sipariş Modal */}
      {orderTable && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 px-2 sm:px-4">
          <div className="rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col" style={{ background: "#111111", border: "1px solid rgba(204,21,21,0.3)" }}>
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between flex-shrink-0" style={{ borderBottom: "1px solid rgba(204,21,21,0.2)" }}>
              <div>
                <h3 className="font-bold text-lg text-white">Sipariş Al — {orderTable.name}</h3>
                {cartCount > 0 && <p className="text-xs" style={{ color: "#cc1515" }}>{cartCount} ürün · {cartTotal.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</p>}
              </div>
              <button onClick={() => setOrderTable(null)} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
            </div>

            {/* Kategori tabları */}
            <div className="flex gap-1.5 overflow-x-auto px-5 py-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(204,21,21,0.15)" }}>
              {categories.map((cat) => (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                  className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0"
                  style={activeCategory === cat.id
                    ? { background: "#cc1515", color: "#ffffff" }
                    : { background: "rgba(204,21,21,0.1)", color: "#cc1515", border: "1px solid rgba(204,21,21,0.3)" }}>
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Ürünler */}
            <div className="overflow-y-auto flex-1 px-5 py-3 space-y-2">
              {activeProducts.map((product) => {
                const inCart = cart.find((i) => i.product.id === product.id);
                return (
                  <div key={product.id} className="rounded-xl p-3 flex items-center justify-between" style={{ background: "#1a1a1a", border: "1px solid rgba(204,21,21,0.15)" }}>
                    <div>
                      <p className="font-medium text-white text-sm">{product.name}</p>
                      {product.description && <p className="text-xs text-gray-400">{product.description}</p>}
                      <p className="text-sm font-bold mt-0.5" style={{ color: "#cc1515" }}>{product.price.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {inCart && (
                        <>
                          <button onClick={() => removeFromCart(product.id)} className="w-7 h-7 rounded-full bg-red-900/40 text-red-400 font-bold flex items-center justify-center text-lg leading-none">−</button>
                          <span className="w-5 text-center font-semibold text-white">{inCart.quantity}</span>
                        </>
                      )}
                      <button onClick={() => addToCart(product)} className="w-7 h-7 rounded-full font-bold flex items-center justify-center text-lg leading-none" style={{ background: "rgba(204,21,21,0.2)", color: "#cc1515" }}>+</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Not + Gönder */}
            {cartCount > 0 && (
              <div className="px-5 py-4 flex-shrink-0 space-y-3" style={{ borderTop: "1px solid rgba(204,21,21,0.2)" }}>
                <textarea value={orderNote} onChange={(e) => setOrderNote(e.target.value)} rows={2} placeholder="Sipariş notu (isteğe bağlı)..."
                  className="w-full rounded-xl px-3 py-2 text-sm text-white resize-none focus:outline-none placeholder-gray-600"
                  style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(204,21,21,0.25)" }} />
                <button onClick={sendOrder} disabled={sending}
                  className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-50"
                  style={{ background: "#cc1515" }}>
                  {sending ? "Kaydediliyor..." : `Siparişi Onayla — ${cartTotal.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
