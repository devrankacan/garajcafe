"use client";

import { useEffect, useState } from "react";

type Product = { id: number; name: string; description?: string; price: number; imageUrl?: string; isAvailable: boolean; sortOrder: number; categoryId: number };
type Category = { id: number; name: string; sortOrder: number; products: Product[] };

export default function MenuAdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  const [catModal, setCatModal] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", sortOrder: 0 });
  const [editCatId, setEditCatId] = useState<number | null>(null);

  const [prodModal, setProdModal] = useState(false);
  const [prodForm, setProdForm] = useState({ name: "", description: "", price: "", imageUrl: "", isAvailable: true, sortOrder: 0 });
  const [editProdId, setEditProdId] = useState<number | null>(null);

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

  const activeProducts = categories.find((c) => c.id === activeCategory)?.products ?? [];

  return (
    <div className="flex gap-5">
      {/* Kategoriler */}
      <div className="w-48 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-slate-500 uppercase">Kategoriler</h2>
          <button onClick={() => { setCatForm({ name: "", sortOrder: 0 }); setEditCatId(null); setCatModal(true); }} className="text-amber-700 hover:text-amber-600 text-lg leading-none font-bold">+</button>
        </div>
        <div className="space-y-1">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`rounded-lg px-3 py-2 flex items-center justify-between cursor-pointer ${activeCategory === cat.id ? "bg-amber-700 text-white" : "bg-white hover:bg-amber-50 text-slate-700"}`}
            >
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
          <h2 className="font-semibold text-slate-700">
            {categories.find((c) => c.id === activeCategory)?.name ?? "Bir kategori seç"}
          </h2>
          {activeCategory && (
            <button onClick={() => { resetProd(); setProdModal(true); }} className="bg-amber-700 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
              + Ürün Ekle
            </button>
          )}
        </div>
        <div className="space-y-2">
          {activeProducts.map((p) => (
            <div key={p.id} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm">
              {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 truncate">{p.name}</p>
                {p.description && <p className="text-xs text-slate-500 truncate">{p.description}</p>}
                <p className="text-amber-700 font-bold text-sm">{p.price.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toggleAvailable(p)} className={`text-xs px-2 py-1 rounded-full font-medium ${p.isAvailable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {p.isAvailable ? "Aktif" : "Pasif"}
                </button>
                <button onClick={() => { setProdForm({ name: p.name, description: p.description ?? "", price: String(p.price), imageUrl: p.imageUrl ?? "", isAvailable: p.isAvailable, sortOrder: p.sortOrder }); setEditProdId(p.id); setProdModal(true); }} className="text-slate-400 hover:text-slate-700">✏️</button>
                <button onClick={() => deleteProduct(p.id)} className="text-slate-400 hover:text-red-600">🗑️</button>
              </div>
            </div>
          ))}
          {activeProducts.length === 0 && activeCategory && (
            <p className="text-gray-400 text-sm text-center py-10">Bu kategoride ürün yok.</p>
          )}
        </div>
      </div>

      {/* Kategori Modal */}
      {catModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-lg mb-4">{editCatId ? "Kategori Düzenle" : "Kategori Ekle"}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori Adı</label>
                <input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sıra</label>
                <input type="number" value={catForm.sortOrder} onChange={(e) => setCatForm({ ...catForm, sortOrder: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setCatModal(false)} className="flex-1 border rounded-xl py-2 text-sm">İptal</button>
              <button onClick={saveCategory} className="flex-1 bg-amber-700 text-white rounded-xl py-2 text-sm font-medium">Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {/* Ürün Modal */}
      {prodModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">{editProdId ? "Ürün Düzenle" : "Ürün Ekle"}</h3>
            <div className="space-y-3">
              {[
                { label: "Ürün Adı", key: "name", type: "text" },
                { label: "Açıklama", key: "description", type: "text" },
                { label: "Fiyat (₺)", key: "price", type: "number" },
                { label: "Görsel URL", key: "imageUrl", type: "text" },
                { label: "Sıra", key: "sortOrder", type: "number" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input type={type} value={String(prodForm[key as keyof typeof prodForm])} onChange={(e) => setProdForm({ ...prodForm, [key]: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="avail" checked={prodForm.isAvailable} onChange={(e) => setProdForm({ ...prodForm, isAvailable: e.target.checked })} />
                <label htmlFor="avail" className="text-sm font-medium text-gray-700">Aktif (menüde görünsün)</label>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => { setProdModal(false); resetProd(); }} className="flex-1 border rounded-xl py-2 text-sm">İptal</button>
              <button onClick={saveProduct} className="flex-1 bg-amber-700 text-white rounded-xl py-2 text-sm font-medium">Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
