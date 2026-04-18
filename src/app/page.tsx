"use client";

import { useEffect, useState } from "react";

type Product = { id: number; name: string; description?: string; price: number; imageUrl?: string };
type Category = { id: number; name: string; products: Product[] };
type Settings = { businessName?: string; about?: string; wifi?: string; instagram?: string; mapUrl?: string; logoUrl?: string };

const SUITS = "♠  ♥  ♦  ♣";

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Settings>({});
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const activeProducts = categories.find((c) => c.id === activeCategory)?.products ?? [];

  if (loading)
    return (
      <div className="felt-bg min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">♠</p>
          <p className="text-[#c9a84c] animate-pulse text-lg font-medium">Menü yükleniyor...</p>
        </div>
      </div>
    );

  return (
    <div className="felt-bg min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20" style={{ background: "linear-gradient(180deg, #071510 0%, #0a2015 100%)", borderBottom: "1px solid rgba(201,168,76,0.3)" }}>
        <div className="max-w-xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <div>
                <div className="flex items-center gap-3">
                {settings.logoUrl && (
                  <img src={settings.logoUrl} alt="logo" className="h-10 w-10 object-contain rounded-lg" />
                )}
                <div>
                  <h1 className="text-xl font-bold" style={{ color: "#c9a84c" }}>
                    {settings.businessName ?? "Garaj Cafe"}
                  </h1>
                  <p className="card-suit text-xs" style={{ color: "#c9a84c" }}>{SUITS}</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <button
                onClick={() => setInfoOpen(!infoOpen)}
                style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.4)", color: "#c9a84c" }}
                className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1"
              >
                <span>Bilgi</span>
                <svg className={`w-4 h-4 transition-transform ${infoOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {infoOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl shadow-2xl z-30 overflow-hidden fade-in"
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
          </div>
        </div>

        {/* Category Tabs */}
        <div className="max-w-xl mx-auto flex overflow-x-auto gap-1.5 px-4 pb-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
              style={activeCategory === cat.id
                ? { background: "#c9a84c", color: "#0a2015" }
                : { background: "rgba(201,168,76,0.12)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.3)" }
              }
            >
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      {/* Products */}
      <main className="max-w-xl mx-auto px-4 py-4 space-y-3">
        {activeProducts.length === 0 && (
          <p className="text-center text-gray-500 py-16">Bu kategoride ürün bulunmuyor.</p>
        )}
        {activeProducts.map((product) => (
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
            </div>
          </div>
        ))}

        {/* Footer */}
        <p className="text-center py-6" style={{ color: "rgba(201,168,76,0.3)", fontSize: "1.5rem", letterSpacing: "0.5em" }}>♠ ♥ ♦ ♣</p>
      </main>
    </div>
  );
}
