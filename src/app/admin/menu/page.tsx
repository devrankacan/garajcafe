"use client";

import { useEffect, useState } from "react";

type Product = { id: number; name: string; description?: string; price: number; imageUrl?: string; isAvailable: boolean; sortOrder: number; categoryId: number };
type Category = { id: number; name: string; sortOrder: number; products: Product[] };

const card = { background: "var(--a-card)", border: "1px solid var(--a-border)" };
const inputCls = "w-full rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none";
const inputStyle = { background: "var(--a-inp)", border: "1px solid var(--a-inp-border)" };
const labelStyle = { color: "#cc1515" };

export default function MenuAdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  const [catModal, setCatModal] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", sortOrder: 0 });
  const [editCatId, setEditCatId] = useState<number | null>(null);

  const [prodModal, setProdModal] = useState(false);
  const [prodForm, setProdForm] = useState({ name: "", description: "", price: "", imageUrl: "", isAvailable: true, sortOrder: 0 });
  const [editProdId, setEditProdId] = useState<number | null>(null);

  // CSV import
  const [importModal, setImportModal] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [clearFirst, setClearFirst] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ productCount: number; categoryCount: number; categories: string[]; errors: string[] } | null>(null);

  async function fetchData() {
    const cats = await fetch("/api/categories").then((r) => r.json());
    setCategories(cats);
    if (cats.length > 0 && !activeCategory) setActiveCategory(cats[0].id);
  }

  useEffect(() => { fetchData(); }, []);

  async function saveCategory() {
    if (editCatId) {
      await fetch(`/api/categories/${editCatId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(catForm) });
    } else {
      await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(catForm) });
    }
    setCatModal(false); setCatForm({ name: "", sortOrder: 0 }); setEditCatId(null);
    fetchData();
  }

  async function deleteCategory(id: number) {
    if (!confirm("Kategoriyi sil?")) return;
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    setActiveCategory(null);
    fetchData();
  }

  async function saveProduct() {
    const data = { ...prodForm, price: parseFloat(prodForm.price), categoryId: activeCategory! };
    if (editProdId) {
      await fetch(`/api/products/${editProdId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    } else {
      await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    }
    setProdModal(false); resetProd();
    fetchData();
  }

  async function deleteProduct(id: number) {
    if (!confirm("Ürünü sil?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    fetchData();
  }

  async function toggleAvailable(p: Product) {
    await fetch(`/api/products/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isAvailable: !p.isAvailable }) });
    fetchData();
  }

  function resetProd() {
    setProdForm({ name: "", description: "", price: "", imageUrl: "", isAvailable: true, sortOrder: 0 });
    setEditProdId(null);
  }

  async function runImport() {
    if (!csvText.trim()) return;
    setImporting(true);
    setImportResult(null);
    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: csvText, clearFirst }),
    });
    const data = await res.json();
    setImportResult(data);
    setImporting(false);
    setActiveCategory(null);
    fetchData();
  }

  const activeProducts = categories.find((c) => c.id === activeCategory)?.products ?? [];

  return (
    <div className="flex gap-5">
      {/* Kategoriler */}
      <div className="w-48 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold uppercase" style={{ color: "#cc1515" }}>Kategoriler</h2>
          <div className="flex gap-2 items-center">
            <button onClick={() => { setImportResult(null); setCsvText(""); setClearFirst(false); setImportModal(true); }}
              className="text-xs font-semibold px-2 py-0.5 rounded"
              style={{ background: "rgba(204,21,21,0.12)", color: "#cc1515", border: "1px solid rgba(204,21,21,0.25)" }}
              title="CSV'den İçe Aktar">
              📥 CSV
            </button>
            <button onClick={() => { setCatForm({ name: "", sortOrder: 0 }); setEditCatId(null); setCatModal(true); }}
              className="text-lg leading-none font-bold hover:opacity-80"
              style={{ color: "#cc1515" }}>+</button>
          </div>
        </div>
        <div className="space-y-1">
          {categories.map((cat) => (
            <div key={cat.id}
              className="rounded-lg px-3 py-2 flex items-center justify-between cursor-pointer transition-all"
              style={activeCategory === cat.id
                ? { background: "#cc1515", color: "#ffffff" }
                : { background: "var(--a-card)", color: "var(--a-text2)", border: "1px solid var(--a-border2)" }}>
              <span onClick={() => setActiveCategory(cat.id)} className="flex-1 text-sm font-medium truncate">{cat.name}</span>
              <div className="flex gap-1 ml-1 flex-shrink-0">
                <button onClick={() => { setCatForm({ name: cat.name, sortOrder: cat.sortOrder }); setEditCatId(cat.id); setCatModal(true); }} className="opacity-60 hover:opacity-100 text-xs">✏️</button>
                <button onClick={() => deleteCategory(cat.id)} className="opacity-60 hover:opacity-100 text-xs">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ürünler */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-white">
            {categories.find((c) => c.id === activeCategory)?.name ?? "Bir kategori seç"}
          </h2>
          {activeCategory && (
            <button onClick={() => { resetProd(); setProdModal(true); }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-white"
              style={{ background: "#cc1515" }}>
              + Ürün Ekle
            </button>
          )}
        </div>
        <div className="space-y-2">
          {activeProducts.map((p) => (
            <div key={p.id} className="rounded-xl p-3 flex items-center gap-3" style={card}>
              {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{p.name}</p>
                {p.description && <p className="text-xs text-gray-400 truncate">{p.description}</p>}
                <p className="font-bold text-sm" style={{ color: "#cc1515" }}>{p.price.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toggleAvailable(p)}
                  className="text-xs px-2 py-1 rounded-full font-medium"
                  style={p.isAvailable
                    ? { background: "rgba(34,197,94,0.15)", color: "#4ade80" }
                    : { background: "rgba(100,100,100,0.15)", color: "#9ca3af" }}>
                  {p.isAvailable ? "Aktif" : "Pasif"}
                </button>
                <button onClick={() => { setProdForm({ name: p.name, description: p.description ?? "", price: String(p.price), imageUrl: p.imageUrl ?? "", isAvailable: p.isAvailable, sortOrder: p.sortOrder }); setEditProdId(p.id); setProdModal(true); }}
                  className="text-gray-400 hover:text-gray-200">✏️</button>
                <button onClick={() => deleteProduct(p.id)} className="text-gray-400 hover:text-red-400">🗑️</button>
              </div>
            </div>
          ))}
          {activeProducts.length === 0 && activeCategory && (
            <p className="text-gray-500 text-sm text-center py-10">Bu kategoride ürün yok.</p>
          )}
        </div>
      </div>

      {/* ── CSV İçe Aktar Modal ── */}
      {importModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="rounded-2xl w-full max-w-lg flex flex-col" style={{ background: "var(--a-card2)", border: "1px solid var(--a-acc-border)", maxHeight: "90vh" }}>
            <div className="px-5 py-4 flex items-center justify-between flex-shrink-0" style={{ borderBottom: "1px solid var(--a-border2)" }}>
              <h3 className="font-bold text-lg text-white">📥 CSV'den Menü İçe Aktar</h3>
              <button onClick={() => setImportModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="px-5 py-4 overflow-y-auto space-y-4">
              <div className="rounded-xl px-4 py-3 text-xs leading-relaxed" style={{ background: "rgba(204,21,21,0.08)", border: "1px solid rgba(204,21,21,0.2)", color: "#d1d5db" }}>
                <p className="font-semibold mb-1" style={{ color: "#cc1515" }}>Beklenen format (Tab ile ayrılmış):</p>
                <code className="font-mono">Kategori → Ürün Adı → Açıklama → Fiyat</code>
                <p className="mt-1 text-gray-500">Excel/Google Sheets'ten direkt kopyala-yapıştır çalışır.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase mb-1.5" style={labelStyle}>CSV / TSV İçeriği</label>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  rows={10}
                  placeholder={"Kategori\tÜrün Adı\tAçıklama\tFiyat\nSıcak İçecekler\tÇay\tGeleneksel Türk çayı.\t30₺"}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none font-mono resize-none"
                  style={{ background: "var(--a-inp)", border: "1px solid var(--a-inp-border)" }}
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer rounded-xl px-4 py-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <input type="checkbox" checked={clearFirst} onChange={(e) => setClearFirst(e.target.checked)} className="mt-0.5 accent-red-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#f87171" }}>Mevcut tüm kategorileri ve ürünleri sil</p>
                  <p className="text-xs text-gray-500 mt-0.5">İşaretlenirse mevcut menü tamamen silinir, yerine CSV'deki veriler yüklenir. Geri alınamaz.</p>
                </div>
              </label>

              {importResult && (
                <div className="rounded-xl px-4 py-3 space-y-1" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)" }}>
                  <p className="text-sm font-bold" style={{ color: "#4ade80" }}>
                    ✓ {importResult.productCount} ürün, {importResult.categoryCount} kategori içe aktarıldı
                  </p>
                  <p className="text-xs text-gray-400">{importResult.categories.join(" · ")}</p>
                  {importResult.errors.length > 0 && (
                    <p className="text-xs text-yellow-400 mt-1">{importResult.errors.length} satır atlandı</p>
                  )}
                </div>
              )}
            </div>

            <div className="px-5 pb-5 pt-3 flex gap-2 flex-shrink-0" style={{ borderTop: "1px solid var(--a-border2)" }}>
              <button onClick={() => setImportModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm text-gray-300"
                style={{ background: "var(--a-btn2)", border: "1px solid var(--a-border2)" }}>
                Kapat
              </button>
              <button onClick={runImport} disabled={importing || !csvText.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                style={{ background: "#cc1515" }}>
                {importing ? "İçe Aktarılıyor..." : "İçe Aktar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kategori Modal */}
      {catModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="rounded-2xl p-6 w-full max-w-sm" style={{ background: "var(--a-card2)", border: "1px solid var(--a-acc-border)" }}>
            <h3 className="font-bold text-lg text-white mb-4">{editCatId ? "Kategori Düzenle" : "Kategori Ekle"}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase mb-1" style={labelStyle}>Kategori Adı</label>
                <input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase mb-1" style={labelStyle}>Sıra</label>
                <input type="number" value={catForm.sortOrder} onChange={(e) => setCatForm({ ...catForm, sortOrder: Number(e.target.value) })} className={inputCls} style={inputStyle} />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setCatModal(false)}
                className="flex-1 py-2 rounded-xl text-sm text-gray-300"
                style={{ background: "var(--a-btn2)", border: "1px solid var(--a-border2)" }}>
                İptal
              </button>
              <button onClick={saveCategory}
                className="flex-1 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: "#cc1515" }}>
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ürün Modal */}
      {prodModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="rounded-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto" style={{ background: "var(--a-card2)", border: "1px solid var(--a-acc-border)" }}>
            <h3 className="font-bold text-lg text-white mb-4">{editProdId ? "Ürün Düzenle" : "Ürün Ekle"}</h3>
            <div className="space-y-3">
              {[
                { label: "Ürün Adı", key: "name", type: "text" },
                { label: "Açıklama", key: "description", type: "text" },
                { label: "Fiyat (₺)", key: "price", type: "number" },
                { label: "Görsel URL", key: "imageUrl", type: "text" },
                { label: "Sıra", key: "sortOrder", type: "number" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold uppercase mb-1" style={labelStyle}>{label}</label>
                  <input type={type} value={String(prodForm[key as keyof typeof prodForm])} onChange={(e) => setProdForm({ ...prodForm, [key]: e.target.value })} className={inputCls} style={inputStyle} />
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="avail" checked={prodForm.isAvailable} onChange={(e) => setProdForm({ ...prodForm, isAvailable: e.target.checked })} className="accent-red-600" />
                <label htmlFor="avail" className="text-sm text-gray-300">Aktif (menüde görünsün)</label>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => { setProdModal(false); resetProd(); }}
                className="flex-1 py-2 rounded-xl text-sm text-gray-300"
                style={{ background: "var(--a-btn2)", border: "1px solid var(--a-border2)" }}>
                İptal
              </button>
              <button onClick={saveProduct}
                className="flex-1 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: "#cc1515" }}>
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

