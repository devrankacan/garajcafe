"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const tabs = [
  { label: "♠ Siparişler", href: "/admin" },
  { label: "♥ Masalar", href: "/admin/tables" },
  { label: "♦ Garsonlar", href: "/admin/waiters" },
  { label: "♣ Menü", href: "/admin/menu" },
  { label: "⚙ Ayarlar", href: "/admin/settings" },
  { label: "📊 Raporlar", href: "/admin/reports" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  useEffect(() => {
    const saved = localStorage.getItem("admin-theme") as "dark" | "light" | null;
    if (saved) setTheme(saved);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("admin-theme", next);
  }

  return (
    <div className="felt-bg min-h-screen" data-theme={theme}>
      <header style={{ background: "var(--a-header)", borderBottom: "1px solid var(--a-acc-border)" }}>
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold" style={{ color: "#cc1515" }}>Admin Paneli</h1>
            <div className="flex gap-2">
              <button
                onClick={toggleTheme}
                className="px-3 py-1.5 rounded-full text-sm font-semibold transition-all"
                style={{ background: "var(--a-btn2b)", color: "var(--a-text)", border: "1px solid var(--a-border)" }}>
                {theme === "dark" ? "☀️ Gündüz" : "🌙 Gece"}
              </button>
              <button
                onClick={logout}
                className="px-3 py-1.5 rounded-full text-sm font-semibold transition-all"
                style={{ background: "rgba(204,21,21,0.12)", color: "#cc1515", border: "1px solid rgba(204,21,21,0.3)" }}>
                Çıkış
              </button>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const active = tab.href === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.href);
              return (
                <Link key={tab.href} href={tab.href}
                  className="whitespace-nowrap px-4 py-2.5 rounded-t-lg text-sm font-medium transition-colors"
                  style={active
                    ? { background: "var(--a-bg)", color: "#cc1515", borderTop: "2px solid #cc1515", borderLeft: "1px solid rgba(204,21,21,0.3)", borderRight: "1px solid rgba(204,21,21,0.3)" }
                    : { color: "rgba(204,21,21,0.6)" }
                  }>
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
