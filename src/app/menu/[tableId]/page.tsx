"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Product = {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
};

type Category = {
  id: number;
  name: string;
  products: Product[];
};

type Settings = {
  businessName?: string;
  about?: string;
  wifi?: string;
  instagram?: string;
  mapUrl?: string;
};

export default function MenuPage() {
  const { tableId } = useParams();
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

  const activeProducts =
    categories.find((c) => c.id === activeCategory)?.products ?? [];

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-amber-50">
        <p className="text-amber-700 text-lg font-medium animate-pulse">Menü yükleniyor...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <header className="bg-amber-800 text-white sticky top-0 z-10 shadow-md">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{settings.businessName ?? "Menü"}</h1>
            <p className="text-amber-200 text-xs">Masa {tableId}</p>
          </div>
          <div className="relative">
            <button
              onClick={() => setInfoOpen(!infoOpen)}
              className="bg-amber-700 hover:bg-amber-600 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1"
            >
              <span>Bilgi</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {infoOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg text-gray-800 z-20 overflow-hidden">
                {settings.about && (
                  <div className="px-4 py-3 border-b">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Hakkımızda</p>
                    <p className="text-sm">{settings.about}</p>
                  </div>
                )}
                {settings.wifi && (
                  <div className="px-4 py-3 border-b flex items-center gap-2">
                    <span className="text-lg">📶</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-500">Wi-Fi Şifresi</p>
                      <p className="text-sm font-mono font-bold">{settings.wifi}</p>
                    </div>
                  </div>
                )}
                {settings.instagram && (
                  <a
                    href={`https://instagram.com/${settings.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 border-b flex items-center gap-2 hover:bg-gray-50"
                  >
                    <span className="text-lg">📸</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-500">Instagram</p>
                      <p className="text-sm text-amber-700">{settings.instagram}</p>
                    </div>
                  </a>
                )}
                {settings.mapUrl && (
                  <a
                    href={settings.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 flex items-center gap-2 hover:bg-gray-50"
                  >
                    <span className="text-lg">📍</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-500">Konum</p>
                      <p className="text-sm text-amber-700">Haritada Gör</p>
                    </div>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="bg-white shadow-sm sticky top-[60px] z-10">
        <div className="max-w-xl mx-auto flex overflow-x-auto gap-1 px-3 py-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat.id
                  ? "bg-amber-700 text-white"
                  : "bg-amber-100 text-amber-800 hover:bg-amber-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products */}
      <main className="max-w-xl mx-auto px-4 py-4 space-y-3">
        {activeProducts.length === 0 && (
          <p className="text-center text-gray-400 py-10">Bu kategoride ürün bulunmuyor.</p>
        )}
        {activeProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm overflow-hidden flex">
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-24 h-24 object-cover flex-shrink-0"
              />
            )}
            <div className="p-3 flex flex-col justify-center flex-1">
              <h3 className="font-semibold text-gray-800">{product.name}</h3>
              {product.description && (
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{product.description}</p>
              )}
              <p className="mt-1 text-amber-700 font-bold">
                {product.price.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
              </p>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
