"use client";

import { useEffect, useRef, useState } from "react";

type Product = { id: number; name: string; description?: string; price: number; imageUrl?: string };
type Category = { id: number; name: string; products: Product[] & { categoryName?: string } };
type Settings = {
  businessName?: string; about?: string; logoUrl?: string; coverUrl?: string;
  address?: string; hours?: string; email?: string; phone?: string; mapUrl?: string;
  wifi?: string; instagram?: string; facebook?: string; twitter?: string;
};

const BG_CARDS = [
  { rank: "A",  suit: "♠", left: "-14%", top: "10%",  rotate: "-20deg", size: 88 },
  { rank: "A",  suit: "♦", left: "76%",  top: "6%",   rotate: "16deg",  size: 80 },
  { rank: "K",  suit: "♥", left: "-10%", top: "40%",  rotate: "24deg",  size: 82 },
  { rank: "J",  suit: "♣", left: "78%",  top: "36%",  rotate: "-18deg", size: 76 },
  { rank: "Q",  suit: "♦", left: "-12%", top: "68%",  rotate: "-14deg", size: 80 },
  { rank: "10", suit: "♠", left: "75%",  top: "63%",  rotate: "22deg",  size: 74 },
];

function BgCard({ rank, suit, left, top, rotate, size }: typeof BG_CARDS[0]) {
  const isRed = suit === "♦" || suit === "♥";
  const clr = isRed ? "#cc1515" : "#111111";
  const h = Math.round(size * 1.42);
  return (
    <div style={{
      position: "fixed", left, top,
      width: size, height: h,
      transform: `rotate(${rotate})`,
      opacity: 0.10,
      pointerEvents: "none",
      zIndex: 0,
      background: "#f5f0e8",
      borderRadius: size * 0.1,
      boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
      display: "flex",
      flexDirection: "column",
      padding: size * 0.08,
      userSelect: "none",
      fontFamily: "Georgia, serif",
    }}>
      <div style={{ color: clr, fontSize: size * 0.18, fontWeight: "bold", lineHeight: 1.1 }}>
        <div>{rank}</div>
        <div style={{ fontSize: size * 0.17 }}>{suit}</div>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, color: clr }}>
        {suit}
      </div>
      <div style={{ color: clr, fontSize: size * 0.18, fontWeight: "bold", lineHeight: 1.1, transform: "rotate(180deg)", alignSelf: "flex-end" }}>
        <div>{rank}</div>
        <div style={{ fontSize: size * 0.17 }}>{suit}</div>
      </div>
    </div>
  );
}

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

      {/* Arka plan kart dekorasyonu */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        {BG_CARDS.map((c, i) => <BgCard key={i} {...c} />)}
      </div>

      {/* İçerik katmanı */}
      <div style={{ position: "relative", zIndex: 1 }}>

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

              {/* Hakkımızda */}
              {settings.about && (
                <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(204,21,21,0.1)" }}>
                  <p className="text-xs font-semibold uppercase mb-1.5" style={{ color: "#cc1515" }}>Hakkımızda</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{settings.about}</p>
                </div>
              )}

              {/* İşletme Bilgileri */}
              {(settings.address || settings.hours || settings.email || settings.phone || settings.mapUrl) && (
                <div className="px-5 pt-4 pb-2" style={{ borderBottom: "1px solid rgba(204,21,21,0.1)" }}>
                  <p className="text-xs font-semibold uppercase mb-3" style={{ color: "#cc1515" }}>İşletme Bilgileri</p>
                  <div className="space-y-3">
                    {settings.address && (
                      <div className="flex items-start gap-3">
                        <svg className="flex-shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cc1515" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                          <circle cx="12" cy="9" r="2.5"/>
                        </svg>
                        <p className="text-sm text-gray-300 leading-snug">{settings.address}</p>
                      </div>
                    )}
                    {settings.hours && (
                      <div className="flex items-center gap-3">
                        <svg className="flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cc1515" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <p className="text-sm text-gray-300">{settings.hours}</p>
                      </div>
                    )}
                    {settings.email && (
                      <a href={`mailto:${settings.email}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <svg className="flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cc1515" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                          <polyline points="22,6 12,13 2,6"/>
                        </svg>
                        <p className="text-sm text-gray-300">{settings.email}</p>
                      </a>
                    )}
                    {settings.phone && (
                      <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <svg className="flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cc1515" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.56 3.44 2 2 0 0 1 3.53 1.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.75a16 16 0 0 0 6 6l.87-.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z"/>
                        </svg>
                        <p className="text-sm text-gray-300">{settings.phone}</p>
                      </a>
                    )}
                    {settings.mapUrl && (
                      <a href={settings.mapUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <svg className="flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cc1515" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                        </svg>
                        <p className="text-sm" style={{ color: "#cc1515" }}>Haritada Gör →</p>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Wi-Fi */}
              {settings.wifi && (
                <div className="px-5 py-4 flex items-center gap-4" style={{ borderBottom: "1px solid rgba(204,21,21,0.1)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(204,21,21,0.12)", border: "1px solid rgba(204,21,21,0.2)" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cc1515" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
                      <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
                      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
                      <circle cx="12" cy="20" r="1" fill="#cc1515"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#cc1515" }}>Wi-Fi Şifresi</p>
                    <p className="text-sm font-mono font-bold text-white mt-0.5">{settings.wifi}</p>
                  </div>
                </div>
              )}

              {/* Sosyal Medya */}
              {(settings.instagram || settings.facebook || settings.twitter) && (
                <div className="px-5 pt-4 pb-4" style={{ borderBottom: "1px solid rgba(204,21,21,0.1)" }}>
                  <p className="text-xs font-semibold uppercase mb-3" style={{ color: "#cc1515" }}>Sosyal Medya Hesaplarımız</p>
                  <div className="space-y-3">
                    {settings.instagram && (
                      <a href={`https://instagram.com/${settings.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#cc1515" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                          <circle cx="12" cy="12" r="4"/>
                          <circle cx="17.5" cy="6.5" r="1" fill="#cc1515" stroke="none"/>
                        </svg>
                        <p className="text-sm text-gray-300">{settings.instagram}</p>
                      </a>
                    )}
                    {settings.facebook && (
                      <a href={`https://facebook.com/${settings.facebook.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#cc1515" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                        </svg>
                        <p className="text-sm text-gray-300">{settings.facebook}</p>
                      </a>
                    )}
                    {settings.twitter && (
                      <a href={`https://twitter.com/${settings.twitter.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#cc1515" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
                        </svg>
                        <p className="text-sm text-gray-300">{settings.twitter}</p>
                      </a>
                    )}
                  </div>
                </div>
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

      {/* Sticky kategori kartları */}
      <div className="sticky top-0 z-10 py-3" style={{ background: "#0d0d0d", borderBottom: "1px solid rgba(204,21,21,0.2)" }}>
        {!searchQuery.trim() && (
          <div className="max-w-xl mx-auto flex overflow-x-auto gap-2 px-4 pb-0.5" style={{ scrollbarWidth: "none" }}>
            {categories.map((cat, index) => {
              const suits = ["♠", "♣", "♥", "♦"];
              const suit = suits[index % 4];
              const redSuit = index % 4 >= 2;
              const isActive = activeCategory === cat.id;
              return (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                  className="flex-shrink-0 rounded-xl transition-all text-left relative overflow-hidden"
                  style={{
                    background: isActive ? "#cc1515" : "#1a1a1a",
                    border: isActive ? "1.5px solid #ff3333" : "1px solid rgba(204,21,21,0.3)",
                    width: "72px", minHeight: "80px", padding: "8px",
                    boxShadow: isActive ? "0 0 12px rgba(204,21,21,0.4)" : "none",
                  }}>
                  <span className="absolute top-1.5 right-2 text-xs font-bold leading-none"
                    style={{ color: isActive ? "rgba(255,255,255,0.6)" : redSuit ? "#cc1515" : "rgba(255,255,255,0.35)" }}>
                    {suit}
                  </span>
                  <span className="absolute bottom-1.5 left-2 text-xs font-bold leading-none rotate-180 block"
                    style={{ color: isActive ? "rgba(255,255,255,0.6)" : redSuit ? "#cc1515" : "rgba(255,255,255,0.35)" }}>
                    {suit}
                  </span>
                  <div className="flex flex-col items-center justify-center h-full gap-1 pt-1">
                    <span className="text-xl leading-none"
                      style={{ color: isActive ? "#ffffff" : redSuit ? "#cc1515" : "#e5e7eb" }}>
                      {suit}
                    </span>
                    <span className="text-center font-semibold leading-tight" style={{ fontSize: "10px", color: isActive ? "#ffffff" : "#d1d5db", wordBreak: "break-word" }}>
                      {cat.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Ürünler — 2 sütun grid */}
      <main className="max-w-xl mx-auto px-4 py-4">
        {searchQuery.trim().length > 1 && (
          <p className="text-xs mb-3" style={{ color: "rgba(204,21,21,0.6)" }}>
            &quot;{searchQuery}&quot; için {searchResults.length} sonuç
          </p>
        )}
        {displayProducts.length === 0 && (
          <p className="text-center text-gray-500 py-16">
            {searchQuery.trim().length > 1 ? "Ürün bulunamadı." : "Bu kategoride ürün bulunmuyor."}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          {displayProducts.map((product) => (
            <div key={product.id} className="rounded-xl overflow-hidden flex flex-col fade-in"
              style={{ background: "#1a1a1a", border: "1px solid rgba(204,21,21,0.25)" }}>
              {product.imageUrl && (
                <img src={product.imageUrl} alt={product.name} className="w-full h-28 object-cover" />
              )}
              <div className="p-3 flex flex-col flex-1 text-center">
                <h3 className="font-bold text-white text-sm leading-snug">{product.name}</h3>
                {product.description && (
                  <p className="text-xs text-gray-400 mt-1.5 leading-snug line-clamp-3 italic flex-1">{product.description}</p>
                )}
                {"categoryName" in product && searchQuery.trim().length > 1 && (
                  <p className="text-xs mt-1 font-medium" style={{ color: "rgba(204,21,21,0.5)" }}>
                    {(product as typeof product & { categoryName: string }).categoryName}
                  </p>
                )}
                <p className="font-bold text-xl mt-2" style={{ color: "#f59e0b" }}>
                  {product.price.toLocaleString("tr-TR")} ₺
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center py-6" style={{ color: "rgba(204,21,21,0.3)", fontSize: "1.5rem", letterSpacing: "0.5em" }}>♠ ♥ ♦ ♣</p>
      </main>
      </div>{/* /içerik katmanı */}
    </div>
  );
}
