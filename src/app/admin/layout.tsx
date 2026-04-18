"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "♠ Siparişler", href: "/admin" },
  { label: "♥ Masalar", href: "/admin/tables" },
  { label: "♦ Garsonlar", href: "/admin/waiters" },
  { label: "♣ Menü", href: "/admin/menu" },
  { label: "⚙ Ayarlar", href: "/admin/settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="felt-bg min-h-screen">
      <header style={{ background: "#071510", borderBottom: "1px solid rgba(201,168,76,0.35)" }}>
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <h1 className="text-lg font-bold mb-3" style={{ color: "#c9a84c" }}>Admin Paneli</h1>
          <nav className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const active = tab.href === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.href);
              return (
                <Link key={tab.href} href={tab.href}
                  className="whitespace-nowrap px-4 py-2.5 rounded-t-lg text-sm font-medium transition-colors"
                  style={active
                    ? { background: "#0a2015", color: "#c9a84c", borderTop: "2px solid #c9a84c", borderLeft: "1px solid rgba(201,168,76,0.3)", borderRight: "1px solid rgba(201,168,76,0.3)" }
                    : { color: "rgba(201,168,76,0.5)" }
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
