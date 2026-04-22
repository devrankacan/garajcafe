"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";

function formatDuration(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}dk`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}sa ${m}dk` : `${h}sa`;
}

type OrderItem = { id: number; quantity: number; unitPrice: number; product: { name: string } };
type Order = {
  id: number; status: string; total: number; note?: string; createdAt: string;
  table: { id: number; name: string };
  waiter?: { name: string } | null;
  items: OrderItem[];
};
type Table = { id: number; name: string; status: string; number: number };
type Product = { id: number; name: string; price: number; description?: string };
type Category = { id: number; name: string; products: Product[] };
type CartItem = { product: Product; quantity: number };

const card = { background: "var(--a-card)", border: "1px solid var(--a-border)" };

export default function OrdersPage() {
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Floor plan
  const [positions, setPositions] = useState<Record<number, { x: number; y: number }>>({});
  const positionsRef = useRef<Record<number, { x: number; y: number }>>({});
  const [editMode, setEditMode] = useState(false);
  const [dragging, setDragging] = useState<{ tableId: number; ox: number; oy: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Masa modal
  const [tableModal, setTableModal] = useState<Table | null>(null);
  const [tableOrders, setTableOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Transfer modal
  const [transferModal, setTransferModal] = useState(false);

  // Kısmi tahsilat modal
  const [partialModal, setPartialModal] = useState(false);
  const [partialAmount, setPartialAmount] = useState("");

  const fetchAll = useCallback(async () => {
    const [orders, tbls] = await Promise.all([
      fetch("/api/orders?status=PENDING,APPROVED").then((r) => r.json()),
      fetch("/api/tables").then((r) => r.json()),
    ]);
    setActiveOrders(Array.isArray(orders) ? orders : []);
    setTables(Array.isArray(tbls) ? tbls : []);
  }, []);

  const pendingOrders = useMemo(() => activeOrders.filter((o) => o.status === "PENDING"), [activeOrders]);

  const tableOpenedAt = useMemo(() => {
    const map: Record<number, string> = {};
    for (const o of activeOrders) {
      const tid = o.table.id;
      if (!map[tid] || new Date(o.createdAt) < new Date(map[tid])) map[tid] = o.createdAt;
    }
    return map;
  }, [activeOrders]);

  const tableTotal = useMemo(() => {
    const map: Record<number, number> = {};
    for (const o of activeOrders) {
      if (o.status === "APPROVED") map[o.table.id] = (map[o.table.id] ?? 0) + o.total;
    }
    return map;
  }, [activeOrders]);

  const tablePending = useMemo(() => {
    const map: Record<number, number> = {};
    for (const o of activeOrders) {
      if (o.status === "PENDING") map[o.table.id] = (map[o.table.id] ?? 0) + 1;
    }
    return map;
  }, [activeOrders]);

  // Load positions from localStorage when tables change
  useEffect(() => {
    if (tables.length === 0) return;
    const saved: Record<number, { x: number; y: number }> = (() => {
      try { return JSON.parse(localStorage.getItem("floorPlanPositions") ?? "{}"); } catch { return {}; }
    })();
    const cols = Math.max(1, Math.ceil(Math.sqrt(tables.length)));
    const newPos: Record<number, { x: number; y: number }> = {};
    tables.forEach((t, i) => {
      newPos[t.id] = saved[t.id] ?? { x: 20 + (i % cols) * 160, y: 20 + Math.floor(i / cols) * 160 };
    });
    positionsRef.current = newPos;
    setPositions(newPos);
  }, [tables]);

  // Global drag listeners
  useEffect(() => {
    if (!dragging) return;
    function onMove(e: MouseEvent) {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width - 136, e.clientX - rect.left - dragging!.ox));
      const y = Math.max(0, Math.min(rect.height - 150, e.clientY - rect.top - dragging!.oy));
      positionsRef.current = { ...positionsRef.current, [dragging!.tableId]: { x, y } };
      setPositions({ ...positionsRef.current });
    }
    function onUp() {
      localStorage.setItem("floorPlanPositions", JSON.stringify(positionsRef.current));
      setDragging(null);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [dragging]);

  useEffect(() => {
    fetchAll();
    fetch("/api/categories").then((r) => r.json()).then((cats) => {
      setCategories(cats);
      if (cats.length > 0) setActiveCategory(cats[0].id);
    });
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  function handleMouseDown(e: React.MouseEvent, tableId: number) {
    if (!editMode) return;
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    const pos = positionsRef.current[tableId] ?? { x: 0, y: 0 };
    setDragging({ tableId, ox: e.clientX - rect.left - pos.x, oy: e.clientY - rect.top - pos.y });
  }

  function resetFloor() {
    localStorage.removeItem("floorPlanPositions");
    const cols = Math.max(1, Math.ceil(Math.sqrt(tables.length)));
    const newPos: Record<number, { x: number; y: number }> = {};
    tables.forEach((t, i) => {
      newPos[t.id] = { x: 20 + (i % cols) * 160, y: 20 + Math.floor(i / cols) * 160 };
    });
    positionsRef.current = newPos;
    setPositions(newPos);
  }

  async function addTable() {
    const num = tables.length > 0 ? Math.max(...tables.map((t) => t.number)) + 1 : 1;
    await fetch("/api/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number: num, name: `Masa ${num}` }),
    });
    fetchAll();
  }

  async function deleteLastTable() {
    if (tables.length === 0) return;
    const last = tables[tables.length - 1];
    if (!confirm(`"${last.name}" silinecek. Emin misiniz?`)) return;
    await fetch(`/api/tables/${last.id}`, { method: "DELETE" });
    fetchAll();
  }

  async function updateStatus(orderId: number, status: string) {
    await fetch(`/api/orders/${orderId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchAll();
    if (tableModal) refreshTableOrders(tableModal.id);
  }

  async function refreshTableOrders(tableId: number) {
    const orders = await fetch(`/api/orders?tableId=${tableId}&status=PENDING,APPROVED`).then((r) => r.json());
    setTableOrders(orders);
  }

  async function openTableModal(table: Table) {
    const orders = await fetch(`/api/orders?tableId=${table.id}&status=PENDING,APPROVED`).then((r) => r.json());
    setTableOrders(orders);
    setTableModal(table);
    setCart([]);
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

  async function saveToTable() {
    if (!tableModal || cart.length === 0) return;
    setSaving(true);
    await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableId: tableModal.id, autoApprove: true,
        items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity, unitPrice: i.product.price })),
      }),
    });
    setCart([]);
    await refreshTableOrders(tableModal.id);
    fetchAll();
    setSaving(false);
  }

  async function closeTableWith(method: string) {
    if (!tableModal) return;
    setSaving(true);
    if (cart.length > 0) {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId: tableModal.id, autoApprove: true, note: `Ödeme: ${method}`,
          items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity, unitPrice: i.product.price })),
        }),
      });
    }
    const approved = await fetch(`/api/orders?tableId=${tableModal.id}&status=APPROVED,PENDING`).then((r) => r.json());
    await Promise.all(approved.map((o: Order) =>
      fetch(`/api/orders/${o.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "CLOSED", paymentMethod: method }) })
    ));
    await fetch(`/api/tables/${tableModal.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "EMPTY" }) });
    setTableModal(null); setCart([]);
    fetchAll();
    setSaving(false);
  }

  async function cancelTable() {
    if (!tableModal || !confirm("Tüm siparişler iptal edilecek. Emin misiniz?")) return;
    const orders = await fetch(`/api/orders?tableId=${tableModal.id}&status=PENDING,APPROVED`).then((r) => r.json());
    await Promise.all(orders.map((o: Order) =>
      fetch(`/api/orders/${o.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "REJECTED" }) })
    ));
    await fetch(`/api/tables/${tableModal.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "EMPTY" }) });
    setTableModal(null); setCart([]);
    fetchAll();
  }

  async function transferTable(targetTable: Table) {
    if (!tableModal) return;
    setSaving(true);
    const openOrders = tableOrders.filter((o) => ["PENDING", "APPROVED"].includes(o.status));
    await Promise.all(openOrders.map((o) =>
      fetch(`/api/orders/${o.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tableId: targetTable.id }) })
    ));
    if (cart.length > 0) {
      await fetch("/api/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId: targetTable.id, autoApprove: true, items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity, unitPrice: i.product.price })) }),
      });
    }
    await fetch(`/api/tables/${tableModal.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "EMPTY" }) });
    await fetch(`/api/tables/${targetTable.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "OCCUPIED" }) });
    setTableModal(null); setCart([]); setTransferModal(false);
    fetchAll();
    setSaving(false);
  }

  async function collectPartial() {
    const amount = parseFloat(partialAmount.replace(",", "."));
    if (!amount || amount <= 0 || !tableModal) return;
    setSaving(true);
    const approved = [...tableOrders.filter((o) => o.status === "APPROVED")].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    let remaining = amount;
    for (const order of approved) {
      if (remaining <= 0) break;
      if (order.total <= remaining + 0.01) {
        await fetch(`/api/orders/${order.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "CLOSED", paymentMethod: "Kısmi" }) });
        remaining -= order.total;
      }
    }
    await refreshTableOrders(tableModal.id);
    fetchAll();
    setPartialModal(false); setPartialAmount("");
    setSaving(false);
  }

  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const savedTotal = tableOrders.filter((o) => o.status === "APPROVED").reduce((s, o) => s + o.total, 0);
  const grandTotal = savedTotal + cartTotal;
  const activeProducts = categories.find((c) => c.id === activeCategory)?.products ?? [];

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 140px)" }}>

      {/* Üst toolbar */}
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <button
          onClick={() => setEditMode((e) => !e)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={editMode
            ? { background: "#cc1515", color: "#fff", border: "1px solid #cc1515" }
            : { background: "var(--a-card)", color: "var(--a-text)", border: "1px solid var(--a-border)" }}>
          {editMode ? "✓ Düzenlemeyi Bitir" : "+ Krokiyi / İsimleri Düzenle (Sürükle-Bırak)"}
        </button>
        {pendingOrders.length > 0 && (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(234,179,8,0.15)", color: "#facc15", border: "1px solid rgba(234,179,8,0.3)" }}>
            ⏳ {pendingOrders.length} bekleyen
          </span>
        )}
      </div>

      {/* Kanvas */}
      <div
        ref={canvasRef}
        className="flex-1 relative rounded-xl overflow-hidden select-none"
        style={{
          background: "var(--a-card)",
          border: "1px solid var(--a-border)",
          cursor: dragging ? "grabbing" : editMode ? "grab" : "default",
        }}
      >
        {tables.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
            Henüz masa eklenmedi
          </div>
        )}
        {tables.map((table) => {
          const pos = positions[table.id] ?? { x: 20, y: 20 };
          const isOccupied = table.status === "OCCUPIED" || table.status === "OPEN";
          const total = tableTotal[table.id] ?? 0;
          const openedAt = tableOpenedAt[table.id];
          const pending = tablePending[table.id] ?? 0;
          return (
            <div
              key={table.id}
              style={{ position: "absolute", left: pos.x, top: pos.y, width: 130, zIndex: dragging?.tableId === table.id ? 20 : 1 }}
              onMouseDown={(e) => handleMouseDown(e, table.id)}
            >
              {pending > 0 && (
                <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold z-10"
                  style={{ background: "#facc15", color: "#111" }}>
                  {pending}
                </div>
              )}
              <div
                className="rounded-xl p-3 flex flex-col items-center gap-1.5 text-center"
                style={{
                  background: isOccupied ? "rgba(204,21,21,0.18)" : "rgba(34,197,94,0.10)",
                  border: `1.5px solid ${isOccupied ? "rgba(204,21,21,0.5)" : "rgba(34,197,94,0.5)"}`,
                  cursor: editMode ? "grab" : "pointer",
                }}
                onClick={!editMode ? () => openTableModal(table) : undefined}
              >
                <svg width="28" height="22" viewBox="0 0 28 22" fill="none">
                  <circle cx="9" cy="6" r="4" fill={isOccupied ? "#f87171" : "#4ade80"} opacity="0.9" />
                  <circle cx="19" cy="6" r="4" fill={isOccupied ? "#f87171" : "#4ade80"} opacity="0.9" />
                  <circle cx="14" cy="6" r="4" fill={isOccupied ? "#ef4444" : "#22c55e"} />
                  <path d="M2 22c0-5 4-8 12-8s12 3 12 8" stroke={isOccupied ? "#f87171" : "#4ade80"} strokeWidth="2" strokeLinecap="round" />
                </svg>
                <p className="font-bold text-sm leading-tight" style={{ color: "var(--a-text)" }}>{table.name}</p>
                <p className="text-xs font-semibold" style={{ color: isOccupied ? "#f87171" : "#4ade80" }}>
                  {total.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₺
                </p>
                {isOccupied && openedAt && (
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>⏱ {formatDuration(openedAt)}</p>
                )}
                <button
                  className="w-full mt-0.5 py-1.5 rounded-lg text-xs font-bold"
                  style={isOccupied
                    ? { background: "#cc1515", color: "#fff" }
                    : { background: "rgba(34,197,94,0.25)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.4)" }}
                  onClick={(e) => { e.stopPropagation(); if (!editMode) openTableModal(table); }}>
                  {isOccupied ? "Adisyonu Aç" : "Masayı Aç"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alt toolbar */}
      <div className="flex items-center gap-2 mt-3 flex-shrink-0">
        <button onClick={addTable}
          className="px-4 py-2 rounded-lg text-xs font-bold"
          style={{ background: "#854d0e", color: "#fde68a", border: "1px solid #a16207" }}>
          + Yeni Masa Ekle
        </button>
        <button onClick={deleteLastTable} disabled={tables.length === 0}
          className="px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-40"
          style={{ background: "var(--a-card)", color: "var(--a-text)", border: "1px solid var(--a-border)" }}>
          — Son Masayı Sil
        </button>
        <button onClick={resetFloor}
          className="px-4 py-2 rounded-lg text-xs font-semibold"
          style={{ background: "var(--a-card)", color: "var(--a-text)", border: "1px solid var(--a-border)" }}>
          ↺ Krokiyi Sıfırla
        </button>
        <span className="text-xs ml-2" style={{ color: "var(--a-text2)" }}>
          (Şu an toplam {tables.length} masa var)
        </span>
      </div>

      {/* ── POS Masa Modalı ── */}
      {tableModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-3">
          <div className="rounded-2xl w-full flex flex-col overflow-hidden"
            style={{ background: "var(--a-pos)", border: "1px solid var(--a-acc-border)", maxWidth: "900px", height: "min(85vh, 640px)" }}>

            <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
              style={{ background: "var(--a-card2)", borderBottom: "1px solid var(--a-border2)" }}>
              <h3 className="font-bold text-lg" style={{ color: "#cc1515" }}>{tableModal.name} Adisyonu</h3>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-lg">{grandTotal.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</span>
                <button onClick={() => setTransferModal(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: "#1d4ed8", color: "#fff" }}>
                  ⇄ Masayı Aktar
                </button>
                <button onClick={() => { setTableModal(null); setCart([]); }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10">✕</button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="flex flex-col flex-shrink-0 overflow-hidden"
                style={{ width: "280px", borderRight: "1px solid var(--a-border)" }}>
                <div className="px-4 py-2.5 flex-shrink-0" style={{ borderBottom: "1px solid var(--a-border2)" }}>
                  <p className="text-xs font-semibold uppercase" style={{ color: "#cc1515" }}>≡ Sipariş Listesi</p>
                </div>
                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                  {tableOrders.filter(o => o.status === "APPROVED").map((order) =>
                    order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg" style={{ background: "rgba(34,197,94,0.06)" }}>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xs text-green-400 font-bold">{item.quantity}×</span>
                          <span className="text-xs text-gray-200 truncate">{item.product.name}</span>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-1">{(item.quantity * item.unitPrice).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}₺</span>
                      </div>
                    ))
                  )}
                  {tableOrders.filter(o => o.status === "PENDING").map((order) =>
                    order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg" style={{ background: "rgba(234,179,8,0.06)" }}>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xs text-yellow-400 font-bold">{item.quantity}×</span>
                          <span className="text-xs text-gray-200 truncate">{item.product.name}</span>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-1">{(item.quantity * item.unitPrice).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}₺</span>
                      </div>
                    ))
                  )}
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg" style={{ background: "rgba(204,21,21,0.08)" }}>
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <button onClick={() => removeFromCart(item.product.id)} className="w-5 h-5 rounded-full bg-red-900/50 text-red-400 text-xs font-bold flex items-center justify-center flex-shrink-0">−</button>
                        <span className="text-xs text-white font-bold px-1">{item.quantity}</span>
                        <button onClick={() => addToCart(item.product)} className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: "rgba(204,21,21,0.3)", color: "#cc1515" }}>+</button>
                        <span className="text-xs text-gray-200 truncate ml-1">{item.product.name}</span>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-1">{(item.product.price * item.quantity).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}₺</span>
                    </div>
                  ))}
                  {tableOrders.length === 0 && cart.length === 0 && (
                    <p className="text-xs text-gray-500 text-center py-6">Henüz ürün eklenmedi</p>
                  )}
                </div>
                <div className="flex-shrink-0 px-3 py-3 space-y-2" style={{ borderTop: "1px solid var(--a-border)" }}>
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase">Toplam</span>
                    <span className="font-bold text-white">{grandTotal.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button onClick={saveToTable} disabled={saving || cart.length === 0}
                      className="col-span-2 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-40"
                      style={{ background: "#1d4ed8" }}>
                      💾 Masaya Kaydet
                    </button>
                    <button onClick={() => { setPartialAmount(""); setPartialModal(true); }} disabled={grandTotal === 0}
                      className="col-span-2 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-40"
                      style={{ background: "#c2410c" }}>
                      ✂ Kısmi Tahsilat Al
                    </button>
                    <button onClick={() => closeTableWith("Nakit")} disabled={saving || grandTotal === 0}
                      className="py-2 rounded-lg text-xs font-bold text-white disabled:opacity-40"
                      style={{ background: "#15803d" }}>
                      💵 Nakit
                    </button>
                    <button onClick={() => closeTableWith("Kart")} disabled={saving || grandTotal === 0}
                      className="py-2 rounded-lg text-xs font-bold text-white disabled:opacity-40"
                      style={{ background: "#0f766e" }}>
                      💳 Kart
                    </button>
                    <button onClick={() => closeTableWith("İBAN")} disabled={saving || grandTotal === 0}
                      className="py-2 rounded-lg text-xs font-bold text-white disabled:opacity-40"
                      style={{ background: "#6d28d9" }}>
                      🏦 İBAN
                    </button>
                    <button onClick={cancelTable}
                      className="py-2 rounded-lg text-xs font-bold text-white"
                      style={{ background: "#b91c1c" }}>
                      🗑 Komple İptal
                    </button>
                  </div>
                  <button onClick={() => { setTableModal(null); setCart([]); }}
                    className="w-full py-1.5 rounded-lg text-xs text-gray-400"
                    style={{ background: "var(--a-card2)", border: "1px solid var(--a-border2)" }}>
                    ✕ Pencereyi Kapat
                  </button>
                </div>
              </div>

              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex gap-1.5 overflow-x-auto px-4 py-3 flex-shrink-0"
                  style={{ borderBottom: "1px solid var(--a-border2)" }}>
                  {categories.map((cat) => (
                    <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                      className="whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold flex-shrink-0 transition-all"
                      style={activeCategory === cat.id
                        ? { background: "#cc1515", color: "#fff" }
                        : { background: "var(--a-btn2b)", color: "var(--a-text2)", border: "1px solid var(--a-border2)" }}>
                      {cat.name}
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="grid grid-cols-2 gap-2">
                    {activeProducts.map((product) => (
                      <button key={product.id} onClick={() => addToCart(product)}
                        className="rounded-xl p-3 text-center transition-all hover:brightness-125 active:scale-95"
                        style={{ background: "var(--a-prod)", border: "1px solid var(--a-border2)" }}>
                        <p className="font-semibold text-white text-sm leading-snug">{product.name}</p>
                        <p className="font-bold mt-1 text-sm" style={{ color: "#f59e0b" }}>
                          {product.price.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                        </p>
                      </button>
                    ))}
                  </div>
                  {activeProducts.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-12">Bu kategoride ürün yok</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Masayı Aktar Modal ── */}
      {transferModal && tableModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="rounded-2xl w-full max-w-xs" style={{ background: "var(--a-card2)", border: "1px solid rgba(29,78,216,0.5)" }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--a-border2)" }}>
              <h3 className="font-bold text-white">Masayı Aktar</h3>
              <button onClick={() => setTransferModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs text-gray-400 mb-3">
                <span style={{ color: "#cc1515" }}>{tableModal.name}</span> masasındaki tüm siparişler seçilen masaya taşınacak.
              </p>
              <div className="space-y-1.5">
                {tables.filter((t) => t.id !== tableModal.id).map((t) => {
                  const isOcc = t.status === "OCCUPIED" || t.status === "OPEN";
                  return (
                    <button key={t.id} onClick={() => transferTable(t)} disabled={saving}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all hover:brightness-125 disabled:opacity-40"
                      style={{ background: "var(--a-card)", border: "1px solid var(--a-border2)" }}>
                      <span className="font-semibold text-white text-sm">{t.name}</span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(0,0,0,0.4)", color: isOcc ? "#f87171" : "#4ade80" }}>
                        {isOcc ? "Dolu" : "Boş"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="px-4 pb-4">
              <button onClick={() => setTransferModal(false)}
                className="w-full py-2 rounded-xl text-sm text-gray-400 mt-1"
                style={{ background: "var(--a-btn2)", border: "1px solid var(--a-border2)" }}>
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Kısmi Tahsilat Modal ── */}
      {partialModal && tableModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="rounded-2xl w-full max-w-xs" style={{ background: "var(--a-card2)", border: "1px solid rgba(194,65,12,0.5)" }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--a-border2)" }}>
              <h3 className="font-bold text-white">Kısmi Tahsilat</h3>
              <button onClick={() => setPartialModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Toplam Tutar</span>
                <span className="font-bold text-white">{grandTotal.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</span>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: "#c2410c" }}>Tahsil Edilecek Tutar (₺)</label>
                <input
                  type="number" value={partialAmount} onChange={(e) => setPartialAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full rounded-xl px-4 py-3 text-white text-lg font-bold text-center focus:outline-none"
                  style={{ background: "var(--a-inp)", border: "1px solid rgba(194,65,12,0.4)" }}
                  autoFocus
                />
              </div>
              {partialAmount && parseFloat(partialAmount.replace(",", ".")) > 0 && (
                <div className="flex justify-between text-sm px-1">
                  <span className="text-gray-400">Kalan Bakiye</span>
                  <span className="font-bold" style={{ color: "#f87171" }}>
                    {Math.max(0, grandTotal - parseFloat(partialAmount.replace(",", "."))).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                  </span>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => setPartialModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm text-gray-300"
                  style={{ background: "var(--a-btn2)", border: "1px solid var(--a-border2)" }}>
                  İptal
                </button>
                <button onClick={collectPartial} disabled={saving || !partialAmount}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                  style={{ background: "#c2410c" }}>
                  {saving ? "İşleniyor..." : "Tahsil Et"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
