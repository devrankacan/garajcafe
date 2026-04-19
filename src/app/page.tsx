"use client";

import { useEffect, useRef, useState } from "react";

type Product = { id: number; name: string; description?: string; price: number; imageUrl?: string };
type Category = { id: number; name: string; products: Product[] & { categoryName?: string } };
type Settings = { businessName?: string; about?: string; wifi?: string; instagram?: string; mapUrl?: string; logoUrl?: string; coverUrl?: string };

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Settings>({});
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]).then(([cats, sett]) => {
      setCategories(cats);
      setSettings(sett);
      if (cats.length > 0) setActiveCategory(cats[0].id);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
    else setSearchQuery("");
  }, [searchOpen]);

  const allProducts = categories.flatMap((c) =>
    c.products.map((p) => ({ ...p, categoryName: c.name }))
  );
  const searchResults = searchQuery.trim().length > 1
    ? allProducts.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const activeProducts = categories.find((c) => c.id === activeCategory)?.products ?? [];
  const displayProducts = searchQuery.trim().length > 1 ? searchResults : activeProducts;

  if (loading)
    return (
      <div className="felt-bg min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">♠</p>
          <p className="animate-pulse text-lg font-medium" style={{ color: "#cc1515" }}>Menü yükleniyor...</p>
        </div>
      </div>
    );

  return (
    <div className="felt-bg min-h-screen">

      {/* Sol Çekmece (Drawer) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
          {/* Panel */}
          <div className="relative w-72 max-w-[85vw] h-full flex flex-col fade-in"
            style={{ background: "#111111", borderRight: "1px solid rgba(204,21,21,0.3)" }}>
            {/* Drawer Header */}
            <div className="px-5 py-5 flex items-center justify-between"
              style={{ borderBottom: "1px solid rgba(204,21,21,0.2)" }}>
              <div className="flex items-center gap-3">
                {settings.logoUrl && (
                  <img src={settings.logoUrl} alt="logo" className="w-10 h-10 rounded-full object-contain bg-white p-0.5" />
                )}
                <span className="font-bold" style={{ color: "#cc1515" }}>{settings.businessName ?? "Menü"}</span>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
            </div>

            {/* Drawer Items */}
            <div className="flex-1 overflow-y-auto py-2">
              {settings.about && (
                <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(204,21,21,0.1)" }}>
                  <p className="text-xs font-semibold uppercase mb-1.5" style={{ color: "#cc1515" }}>Hakkımızda</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{settings.about}</p>
                </div>
              )}
              {settings.wifi && (
                <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(204,21,21,0.1)" }}>
                  <span className="text-2xl">📶</span>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "#cc1515" }}>Wi-Fi Şifresi</p>
                    <p className="text-sm font-mono font-bold text-white mt-0.5">{settings.wifi}</p>
                  </div>
                </div>
              )}
              {settings.instagram && (
                <a href={`https://instagram.com/${settings.instagram.replace("@", "")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="px-5 py-4 flex items-center gap-3 hover:bg-white/5 transition-colors"
                  style={{ borderBottom: "1px solid rgba(204,21,21,0.1)" }}>
                  <span className="text-2xl">📸</span>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "#cc1515" }}>Instagram</p>
                    <p className="text-sm text-gray-300 mt-0.5">{settings.instagram}</p>
                  </div>
                </a>
              )}
              {settings.mapUrl && (
                <a href={settings.mapUrl} target="_blank" rel="noopener noreferrer"
                  className="px-5 py-4 flex items-center gap-3 hover:bg-white/5 transition-colors">
                  <span className="text-2xl">📍</span>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "#cc1515" }}>Konum</p>
                    <p className="text-sm text-gray-300 mt-0.5">Haritada Gör</p>
                  </div>
                </a>
              )}
            </div>

            <div className="px-5 py-4" style={{ borderTop: "1px solid rgba(204,21,21,0.2)" }}>
              <p className="text-center" style={{ color: "rgba(204,21,21,0.3)", letterSpacing: "0.4em" }}>♠ ♥ ♦ ♣</p>
            </div>
          </div>
        </div>
      )}

      {/* KAPAK + LOGO HEADER */}
      <div className="relative w-full" style={{ paddingBottom: "56px" }}>
        {/* Kapak görseli */}
        <div className="relative w-full overflow-hidden" style={{ height: "240px" }}>
          {settings.coverUrl
            ? <img src={settings.coverUrl} alt="kapak" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #080808 0%, #222222 100%)" }}>
                <p style={{ color: "rgba(204,21,21,0.2)", fontSize: "4rem", letterSpacing: "0.5em" }}>♠♥♦♣</p>
              </div>
          }
          {/* Gradient overlay */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 60%, rgba(10,32,21,0.8) 100%)" }} />

          {/* ☰ Sol buton */}
          <button onClick={() => setDrawerOpen(true)}
            className="absolute top-4 left-4 w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
            style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(4px)" }}>
            <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* 🔍 Sağ buton */}
          <button onClick={() => setSearchOpen(!searchOpen)}
            className="absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
            style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(4px)" }}>
            {searchOpen
              ? <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              : <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" /></svg>
            }
          </button>
        </div>

        {/* Circular Logo — kapak ile içerik arası */}
        <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: 0 }}>
          <div className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center shadow-xl"
            style={{ background: "white", border: "4px solid #cc1515" }}>
            {settings.logoUrl
              ? <img src={settings.logoUrl} alt="logo" className="w-full h-full object-contain p-2" />
              : <span style={{ fontSize: "2.5rem", color: "#cc1515" }}>♠</span>
            }
          </div>
        </div>
      </div>

      {/* İşletme adı */}
      <div className="text-center pt-3 pb-2 px-4">
        <h1 className="text-xl font-bold" style={{ color: "#cc1515" }}>{settings.businessName ?? "Garaj Cafe"}</h1>
      </div>

      {/* Arama kutusu */}
      {searchOpen && (
        <div className="max-w-xl mx-auto px-4 pb-3 fade-in">
          <input ref={searchInputRef} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ürün ara..."
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none"
            style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(204,21,21,0.35)" }} />
        </div>
      )}

      {/* Sticky kategori tabları */}
      <div className="sticky top-0 z-10 py-2" style={{ background: "#0d0d0d", borderBottom: "1px solid rgba(204,21,21,0.2)" }}>
        {!searchQuery.trim() && (
          <div className="max-w-xl mx-auto flex overflow-x-auto gap-1.5 px-4">
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className="whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
                style={activeCategory === cat.id
                  ? { background: "#cc1515", color: "#ffffff" }
                  : { background: "rgba(204,21,21,0.12)", color: "#cc1515", border: "1px solid rgba(204,21,21,0.3)" }
                }>
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Ürünler */}
      <main className="max-w-xl mx-auto px-4 py-4 space-y-3">
        {searchQuery.trim().length > 1 && (
          <p className="text-xs" style={{ color: "rgba(204,21,21,0.6)" }}>
            &quot;{searchQuery}&quot; için {searchResults.length} sonuç
          </p>
        )}
        {displayProducts.length === 0 && (
          <p className="text-center text-gray-500 py-16">
            {searchQuery.trim().length > 1 ? "Ürün bulunamadı." : "Bu kategoride ürün bulunmuyor."}
          </p>
        )}
        {displayProducts.map((product) => (
          <div key={product.id} className="rounded-xl overflow-hidden flex fade-in"
            style={{ background: "#1a1a1a", border: "1px solid rgba(204,21,21,0.25)" }}>
            {product.imageUrl && (
              <img src={product.imageUrl} alt={product.name} className="w-24 h-24 object-cover flex-shrink-0" />
            )}
            <div className="p-3 flex flex-col justify-center flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-white text-sm leading-snug">{product.name}</h3>
                <span className="font-bold whitespace-nowrap text-sm" style={{ color: "#cc1515" }}>
                  {product.price.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                </span>
              </div>
              {product.description && (
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{product.description}</p>
              )}
              {"categoryName" in product && searchQuery.trim().length > 1 && (
                <p className="text-xs mt-1 font-medium" style={{ color: "rgba(204,21,21,0.5)" }}>
                  {(product as typeof product & { categoryName: string }).categoryName}
                </p>
              )}
            </div>
          </div>
        ))}
        <p className="text-center py-6" style={{ color: "rgba(204,21,21,0.3)", fontSize: "1.5rem", letterSpacing: "0.5em" }}>♠ ♥ ♦ ♣</p>
      </main>
    </div>
  );
}
