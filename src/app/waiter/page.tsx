"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Waiter = { id: number; name: string };
type Table = { id: number; number: number; name: string; status: string };
type Product = { id: number; name: string; price: number; description?: string };
type Category = { id: number; name: string; products: Product[] };
type CartItem = { product: Product; quantity: number };

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
      if (!data) {
        router.replace("/waiter/login");
      } else {
        setWaiter(data);
        setAuthChecked(true);
      }
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
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
  }

  function removeFromCart(productId: number) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === productId);
      if (existing && existing.quantity > 1)
        return prev.map((i) => i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i);
      return prev.filter((i) => i.product.id !== productId);
    });
  }

  const cartTotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const activeProducts = categories.find((c) => c.id === activeCategory)?.products ?? [];

  async function sendOrder() {
    if (!selectedTable || cart.length === 0) return;
    setSending(true);
    await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableId: selectedTable.id,
        note,
        items: cart.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          unitPrice: i.product.price,
        })),
      }),
    });
    setSending(false);
    setSuccess(true);
    setCart([]);
    setNote("");
    setStep("table");
    setSelectedTable(null);
    setTables((prev) =>
      prev.map((t) => t.id === selectedTable.id ? { ...t, status: "OCCUPIED" } : t)
    );
    setTimeout(() => setSuccess(false), 3000);
  }

  const statusColor = (s: string) =>
    s === "EMPTY" ? "bg-green-100 border-green-400 text-green-800"
    : s === "OCCUPIED" ? "bg-red-100 border-red-400 text-red-800"
    : "bg-yellow-100 border-yellow-400 text-yellow-800";

  const statusLabel = (s: string) =>
    s === "EMPTY" ? "Boş" : s === "OCCUPIED" ? "Dolu" : "Açık";

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-800">
        <p className="text-white animate-pulse">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-800 text-white px-4 py-3 shadow">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Garson Paneli</h1>
            <p className="text-slate-300 text-xs">{waiter?.name}</p>
          </div>
          <div className="flex gap-2 items-center">
            {step !== "table" && (
              <>
                <button onClick={() => setStep("menu")} className={`px-3 py-1 rounded text-sm ${step === "menu" ? "bg-amber-600" : "bg-slate-600"}`}>Menü</button>
                <button onClick={() => setStep("cart")} className={`px-3 py-1 rounded text-sm relative ${step === "cart" ? "bg-amber-600" : "bg-slate-600"}`}>
                  Sepet
                  {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{cartCount}</span>}
                </button>
              </>
            )}
            <button onClick={logout} className="bg-slate-600 hover:bg-slate-500 px-3 py-1 rounded text-sm">Çıkış</button>
          </div>
        </div>
      </header>

      {success && (
        <div className="bg-green-500 text-white text-center py-2 font-medium">
          Sipariş onaya gönderildi!
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-4">
        {step === "table" && (
          <div>
            <h2 className="text-lg font-semibold text-slate-700 mb-3">Masa Seç</h2>
            <div className="grid grid-cols-3 gap-3">
              {tables.map((table) => (
                <button
                  key={table.id}
                  onClick={() => { setSelectedTable(table); setStep("menu"); }}
                  className={`border-2 rounded-xl p-4 text-center font-semibold ${statusColor(table.status)}`}
                >
                  <div className="text-2xl mb-1">🪑</div>
                  <div>{table.name}</div>
                  <div className="text-xs mt-1">{statusLabel(table.status)}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "menu" && (
          <div>
            <p className="text-slate-600 mb-3 font-medium">Masa: <span className="text-amber-700">{selectedTable?.name}</span></p>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium ${activeCategory === cat.id ? "bg-amber-700 text-white" : "bg-amber-100 text-amber-800"}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {activeProducts.map((product) => {
                const inCart = cart.find((i) => i.product.id === product.id);
                return (
                  <div key={product.id} className="bg-white rounded-xl p-3 flex items-center justify-between shadow-sm">
                    <div>
                      <p className="font-medium text-gray-800">{product.name}</p>
                      {product.description && <p className="text-xs text-gray-500">{product.description}</p>}
                      <p className="text-amber-700 font-bold text-sm">{product.price.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {inCart && (
                        <>
                          <button onClick={() => removeFromCart(product.id)} className="w-7 h-7 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center">−</button>
                          <span className="w-5 text-center font-semibold">{inCart.quantity}</span>
                        </>
                      )}
                      <button onClick={() => addToCart(product)} className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center">+</button>
                    </div>
                  </div>
                );
              })}
            </div>
            {cartCount > 0 && (
              <button onClick={() => setStep("cart")} className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-amber-700 text-white px-6 py-3 rounded-full shadow-lg font-semibold">
                Sepeti Gör ({cartCount} ürün) — {cartTotal.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
              </button>
            )}
          </div>
        )}

        {step === "cart" && (
          <div>
            <h2 className="text-lg font-semibold text-slate-700 mb-3">Sipariş Özeti — {selectedTable?.name}</h2>
            {cart.length === 0 ? (
              <p className="text-gray-400 text-center py-10">Sepet boş</p>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {cart.map((item) => (
                    <div key={item.product.id} className="bg-white rounded-xl p-3 flex items-center justify-between shadow-sm">
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-xs text-gray-500">
                          {item.quantity} × {item.product.price.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => removeFromCart(item.product.id)} className="w-7 h-7 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center">−</button>
                        <span className="font-semibold">{item.quantity}</span>
                        <button onClick={() => addToCart(item.product)} className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center">+</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl p-3 shadow-sm mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Not (isteğe bağlı)</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    className="w-full border rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="Örn: Az şekerli, ek sosla..."
                  />
                </div>
                <div className="flex items-center justify-between font-bold text-lg mb-4 px-1">
                  <span>Toplam</span>
                  <span className="text-amber-700">{cartTotal.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</span>
                </div>
                <button
                  onClick={sendOrder}
                  disabled={sending}
                  className="w-full bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-lg"
                >
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
