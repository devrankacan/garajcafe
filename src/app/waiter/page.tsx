"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Waiter = { id: number; name: string };
type Table = { id: number; number: number; name: string; status: string };
type Product = { id: number; name: string; price: number; description?: string };
type Category = { id: number; name: string; products: Product[] };
type CartItem = { product: Product; quantity: number };

const tableStatus = (s: string) =>
  s === "EMPTY"
    ? { label: "Boş", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.4)", text: "#4ade80" }
    : s === "OCCUPIED"
    ? { label: "Dolu", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.4)", text: "#f87171" }
    : { label: "Açık", bg: "rgba(234,179,8,0.1)", border: "rgba(234,179,8,0.4)", text: "#facc15" };

export default function WaiterPage() {
  const router = useRouter();
  const [waiter, setWaiter] = useState<Waiter | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [note, setNote] = useState("");
  const [step, setStep] = useState<"table" | "menu" | "cart">("table");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((data) => {
      if (!data) { router.replace("/waiter/login"); return; }
      setWaiter(data);
      setAuthChecked(true);
    });
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    fetch("/api/tables").then((r) => r.json()).then(setTables);
    fetch("/api/categories").then((r) => r.json()).then((cats) => {
      setCategories(cats);
      if (cats.length > 0) setActiveCategory(cats[0].id);
    });
  }, [authChecked]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/waiter/login");
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
      if (ex && ex.quantity > 1) return prev.map((i) => i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i);
      return prev.filter((i) => i.product.id !== productId);
    });
  }

  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const activeProducts = categories.find((c) => c.id === activeCategory)?.products ?? [];

  async function sendOrder() {
    if (!selectedTable || cart.length === 0) return;
    setSending(true);
    await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableId: selectedTable.id, note,
        items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity, unitPrice: i.product.price })),
      }),
    });
    setSending(false);
    setSuccess(true);
    setCart([]); setNote(""); setStep("table"); setSelectedTable(null);
    setTables((prev) => prev.map((t) => t.id === selectedTable.id ? { ...t, status: "OCCUPIED" } : t));
    setTimeout(() => setSuccess(false), 3000);
  }

  if (!authChecked)
    return (
      <div className="felt-bg min-h-screen flex items-center justify-center">
        <p className="animate-pulse" style={{ color: "#c9a84c" }}>Yükleniyor...</p>
      </div>
    );

  return (
    <div className="felt-bg min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20" style={{ background: "#071510", borderBottom: "1px solid rgba(201,168,76,0.3)" }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg" style={{ color: "#c9a84c" }}>♠ Garson Paneli</h1>
            <p className="text-xs text-gray-400">{waiter?.name}</p>
          </div>
          <div className="flex gap-2 items-center">
            {step !== "table" && (
              <>
                <button onClick={() => setStep("menu")}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium"
                  style={step === "menu" ? { background: "#c9a84c", color: "#0a2015" } : { background: "rgba(201,168,76,0.12)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.3)" }}>
                  Menü
                </button>
                <button onClick={() => setStep("cart")}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium relative"
                  style={step === "cart" ? { background: "#c9a84c", color: "#0a2015" } : { background: "rgba(201,168,76,0.12)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.3)" }}>
                  Sepet
                  {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{cartCount}</span>}
                </button>
              </>
            )}
            <button onClick={logout} className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white border border-gray-600">Çıkış</button>
          </div>
        </div>
      </header>

      {success && (
        <div className="text-center py-2 text-sm font-semibold" style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", borderBottom: "1px solid rgba(34,197,94,0.3)" }}>
          ✓ Sipariş onaya gönderildi!
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Masa Seç */}
        {step === "table" && (
          <div>
            <h2 className="font-semibold mb-4" style={{ color: "#c9a84c" }}>♦ Masa Seç</h2>
            <div className="grid grid-cols-3 gap-3">
              {tables.map((table) => {
                const st = tableStatus(table.status);
                return (
                  <button key={table.id} onClick={() => { setSelectedTable(table); setStep("menu"); }}
                    className="rounded-xl p-4 text-center transition-all hover:scale-105"
                    style={{ background: st.bg, border: `2px solid ${st.border}` }}>
                    <div className="text-2xl mb-1">🃏</div>
                    <div className="font-semibold text-white text-sm">{table.name}</div>
                    <div className="text-xs mt-1 font-medium" style={{ color: st.text }}>{st.label}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Menü */}
        {step === "menu" && (
          <div>
            <p className="text-sm mb-3" style={{ color: "#c9a84c" }}>♣ Masa: <span className="font-bold text-white">{selectedTable?.name}</span></p>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
              {categories.map((cat) => (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                  className="whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-semibold"
                  style={activeCategory === cat.id
                    ? { background: "#c9a84c", color: "#0a2015" }
                    : { background: "rgba(201,168,76,0.12)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.3)" }}>
                  {cat.name}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {activeProducts.map((product) => {
                const inCart = cart.find((i) => i.product.id === product.id);
                return (
                  <div key={product.id} className="rounded-xl p-3 flex items-center justify-between"
                    style={{ background: "#132e1e", border: "1px solid rgba(201,168,76,0.2)" }}>
                    <div>
                      <p className="font-medium text-white text-sm">{product.name}</p>
                      {product.description && <p className="text-xs text-gray-400">{product.description}</p>}
                      <p className="text-sm font-bold mt-0.5" style={{ color: "#c9a84c" }}>{product.price.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {inCart && (
                        <>
                          <button onClick={() => removeFromCart(product.id)} className="w-7 h-7 rounded-full bg-red-900/40 text-red-400 font-bold flex items-center justify-center">−</button>
                          <span className="w-5 text-center font-semibold text-white">{inCart.quantity}</span>
                        </>
                      )}
                      <button onClick={() => addToCart(product)} className="w-7 h-7 rounded-full font-bold flex items-center justify-center" style={{ background: "rgba(201,168,76,0.2)", color: "#c9a84c" }}>+</button>
                    </div>
                  </div>
                );
              })}
            </div>
            {cartCount > 0 && (
              <button onClick={() => setStep("cart")}
                className="fixed bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg font-semibold text-sm"
                style={{ background: "#c9a84c", color: "#0a2015" }}>
                Sepet ({cartCount}) — {cartTotal.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
              </button>
            )}
          </div>
        )}

        {/* Sepet */}
        {step === "cart" && (
          <div>
            <h2 className="font-semibold mb-3" style={{ color: "#c9a84c" }}>♥ Sipariş — {selectedTable?.name}</h2>
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-12">Sepet boş</p>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {cart.map((item) => (
                    <div key={item.product.id} className="rounded-xl p-3 flex items-center justify-between"
                      style={{ background: "#132e1e", border: "1px solid rgba(201,168,76,0.2)" }}>
                      <div>
                        <p className="font-medium text-white text-sm">{item.product.name}</p>
                        <p className="text-xs text-gray-400">{item.quantity} × {item.product.price.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => removeFromCart(item.product.id)} className="w-7 h-7 rounded-full bg-red-900/40 text-red-400 font-bold flex items-center justify-center">−</button>
                        <span className="font-semibold text-white">{item.quantity}</span>
                        <button onClick={() => addToCart(item.product)} className="w-7 h-7 rounded-full font-bold flex items-center justify-center" style={{ background: "rgba(201,168,76,0.2)", color: "#c9a84c" }}>+</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl p-3 mb-4" style={{ background: "#132e1e", border: "1px solid rgba(201,168,76,0.2)" }}>
                  <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: "#c9a84c" }}>Not</label>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
                    className="w-full rounded-lg p-2 text-sm text-white resize-none focus:outline-none"
                    style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(201,168,76,0.2)" }}
                    placeholder="Örn: Az şekerli..." />
                </div>
                <div className="flex justify-between font-bold text-lg mb-4 px-1">
                  <span className="text-white">Toplam</span>
                  <span style={{ color: "#c9a84c" }}>{cartTotal.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</span>
                </div>
                <button onClick={sendOrder} disabled={sending}
                  className="w-full py-3 rounded-xl font-bold text-lg disabled:opacity-50"
                  style={{ background: "#c9a84c", color: "#0a2015" }}>
                  {sending ? "Gönderiliyor..." : "Siparişi Onaya Gönder"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
