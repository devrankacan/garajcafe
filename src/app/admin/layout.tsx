"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Siparişler", href: "/admin" },
  { label: "Masalar", href: "/admin/tables" },
  { label: "Garsonlar", href: "/admin/waiters" },
  { label: "Menü", href: "/admin/menu" },
  { label: "Ayarlar", href: "/admin/settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <h1 className="text-lg font-bold mb-3">Admin Paneli</h1>
          <nav className="flex gap-1 overflow-x-auto pb-0.5">
            {tabs.map((tab) => {
              const active =
                tab.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`whitespace-nowrap px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-slate-50 text-slate-900"
                      : "text-slate-300 hover:text-white hover:bg-slate-700"
                  }`}
                >
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
