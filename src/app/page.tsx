"use client";

import { useEffect, useRef, useState } from "react";

type Product = { id: number; name: string; description?: string; price: number; imageUrl?: string };
type Category = { id: number; name: string; products: Product[] };
type Settings = { businessName?: string; about?: string; wifi?: string; instagram?: string; mapUrl?: string; logoUrl?: string };

const SUITS = "♠  ♥  ♦  ♣";

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Settings>({});
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);

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

  // Dışarı tıklayınca info dropdown kapansın
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (infoRef.current && !infoRef.current.contains(e.target as Node)) {
        setInfoOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Arama açılınca input'a focus
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  // Arama sonuçları — tüm kategorilerdeki ürünlerde arar
  const allProducts = categories.flatMap((c) => c.products.map((p) => ({ ...p, categoryName: c.name })));
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
          <p className="animate-pulse text-lg font-medium" style={{ color: "#c9a84c" }}>Menü yükleniyor...</p>
        </div>
      </div>
    );

  return (
    <div className="felt-bg min-h-screen">
      <header className="sticky top-0 z-20" style={{ background: "linear-gradient(180deg, #071510 0%, #0a2015 100%)", borderBottom: "1px solid rgba(201,168,76,0.3)" }}>
        <div className="max-w-xl mx-auto px-4 py-3">

          {/* Üst bar: sol=bilgi, orta=logo+isim, sağ=arama */}
          <div className="flex items-center justify-between mb-2">

            {/* Sol: Bilgi butonu */}
            <div className="relative" ref={infoRef}>
              <button
                onClick={() => setInfoOpen(!infoOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
                style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.35)", color: "#c9a84c" }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
                </svg>
                <span>Bilgi</span>
                <svg className={`w-3.5 h-3.5 transition-transform ${infoOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {infoOpen && (
                <div className="absolute left-0 mt-2 w-64 rounded-xl shadow-2xl z-30 overflow-hidden fade-in"
                  style={{ background: "#132e1e", border: "1px solid rgba(201,168,76,0.4)" }}>
                  {settings.about && (
                    <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(201,168,76,0.2)" }}>
                      <p className="text-xs font-semibold uppercase mb-1" style={{ color: "#c9a84c" }}>Hakkımızda</p>
                      <p className="text-sm text-gray-300">{settings.about}</p>
                    </div>
                  )}
                  {settings.wifi && (
                    <div className="px-4 py-3 border-b flex items-center gap-3" style={{ borderColor: "rgba(201,168,76,0.2)" }}>
                      <span className="text-xl">📶</span>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: "#c9a84c" }}>Wi-Fi Şifresi</p>
                        <p className="text-sm font-mono font-bold text-white">{settings.wifi}</p>
                      </div>
                    </div>
                  )}
                  {settings.instagram && (
                    <a href={`https://instagram.com/${settings.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                      className="px-4 py-3 border-b flex items-center gap-3 hover:bg-white/5 transition-colors"
                      style={{ borderColor: "rgba(201,168,76,0.2)" }}>
                      <span className="text-xl">📸</span>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: "#c9a84c" }}>Instagram</p>
                        <p className="text-sm text-gray-300">{settings.instagram}</p>
                      </div>
                    </a>
                  )}
                  {settings.mapUrl && (
                    <a href={settings.mapUrl} target="_blank" rel="noopener noreferrer"
                      className="px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors">
                      <span className="text-xl">📍</span>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: "#c9a84c" }}>Konum</p>
                        <p className="text-sm text-gray-300">Haritada Gör</p>
                      </div>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Orta: Logo + İsim */}
            <div className="flex items-center gap-2">
              {settings.logoUrl && (
                <img src={settings.logoUrl} alt="logo" className="h-9 w-9 object-contain rounded-lg" />
              )}
              <div className="text-center">
                <h1 className="text-lg font-bold leading-tight" style={{ color: "#c9a84c" }}>
                  {settings.businessName ?? "Garaj Cafe"}
                </h1>
                <p className="text-xs" style={{ color: "rgba(201,168,76,0.5)", letterSpacing: "0.3em" }}>{SUITS}</p>
              </div>
            </div>

            {/* Sağ: Arama butonu */}
            <button
              onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) setSearchQuery(""); }}
              className="flex items-center justify-center w-10 h-10 rounded-lg"
              style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.35)", color: "#c9a84c" }}
            >
              {searchOpen
                ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" /></svg>
              }
            </button>
          </div>

          {/* Arama kutusu */}
          {searchOpen && (
            <div className="mb-2 fade-in">
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ürün ara..."
                className="w-full rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none"
                style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(201,168,76,0.35)" }}
              />
            </div>
          )}

          {/* Kategori tablları — aramada gizlenir */}
          {!searchQuery.trim() && (
            <div className="flex overflow-x-auto gap-1.5 pb-1">
              {categories.map((cat) => (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                  className="whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
                  style={activeCategory === cat.id
                    ? { background: "#c9a84c", color: "#0a2015" }
                    : { background: "rgba(201,168,76,0.12)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.3)" }
                  }>
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Ürünler */}
      <main className="max-w-xl mx-auto px-4 py-4 space-y-3">
        {searchQuery.trim().length > 1 && (
          <p className="text-xs mb-1" style={{ color: "rgba(201,168,76,0.6)" }}>
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
            style={{ background: "#132e1e", border: "1px solid rgba(201,168,76,0.25)" }}>
            {product.imageUrl && (
              <img src={product.imageUrl} alt={product.name} className="w-24 h-24 object-cover flex-shrink-0" />
            )}
            <div className="p-3 flex flex-col justify-center flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-white text-sm leading-snug">{product.name}</h3>
                <span className="font-bold whitespace-nowrap text-sm" style={{ color: "#c9a84c" }}>
                  {product.price.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                </span>
              </div>
              {product.description && (
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{product.description}</p>
              )}
              {"categoryName" in product && searchQuery.trim().length > 1 && (
                <p className="text-xs mt-1 font-medium" style={{ color: "rgba(201,168,76,0.5)" }}>
                  {(product as Product & { categoryName: string }).categoryName}
                </p>
              )}
            </div>
          </div>
        ))}
        <p className="text-center py-6" style={{ color: "rgba(201,168,76,0.3)", fontSize: "1.5rem", letterSpacing: "0.5em" }}>♠ ♥ ♦ ♣</p>
      </main>
    </div>
  );
}
