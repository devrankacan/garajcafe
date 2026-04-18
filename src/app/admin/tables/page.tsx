"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import QRCode from "qrcode";

type Table = { id: number; number: number; name: string; status: string };

export default function TablesAdminPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [baseUrl, setBaseUrl] = useState("");
  const [form, setForm] = useState({ number: "", name: "" });
  const [qrUrls, setQrUrls] = useState<Record<number, string>>({});
  const canvasRefs = useRef<Record<number, HTMLCanvasElement | null>>({});

  async function fetchData() {
    const [tbls, settings] = await Promise.all([
      fetch("/api/tables").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]);
    setTables(tbls);
    setBaseUrl(settings.baseUrl ?? (typeof window !== "undefined" ? window.location.origin : ""));
  }

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!baseUrl || tables.length === 0) return;
    tables.forEach((table) => {
      const url = `${baseUrl}/menu/${table.id}`;
      QRCode.toDataURL(url, { width: 300, margin: 2 }).then((dataUrl) => {
        setQrUrls((prev) => ({ ...prev, [table.id]: dataUrl }));
      });
    });
  }, [tables, baseUrl]);

  async function addTable() {
    if (!form.number || !form.name) return;
    await fetch("/api/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number: Number(form.number), name: form.name }),
    });
    setForm({ number: "", name: "" });
    fetchData();
  }

  async function deleteTable(id: number) {
    if (!confirm("Masayı sil?")) return;
    await fetch(`/api/tables/${id}`, { method: "DELETE" });
    fetchData();
  }

  function downloadQr(tableId: number, tableName: string) {
    const url = qrUrls[tableId];
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${tableName}.png`;
    a.click();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white px-4 py-3 shadow">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/admin" className="text-slate-400 hover:text-white">← Admin</Link>
          <h1 className="text-lg font-bold">Masa Yönetimi & QR Kodlar</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Add Table */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
          <h2 className="font-semibold text-slate-700 mb-3">Yeni Masa Ekle</h2>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="No"
              value={form.number}
              onChange={(e) => setForm({ ...form, number: e.target.value })}
              className="w-20 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <input
              placeholder="Masa Adı (ör: Masa 1)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button onClick={addTable} className="bg-amber-700 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
              Ekle
            </button>
          </div>
        </div>

        {/* Table Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {tables.map((table) => (
            <div key={table.id} className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center">
              <p className="font-bold text-slate-800 mb-1">{table.name}</p>
              {qrUrls[table.id] ? (
                <img src={qrUrls[table.id]} alt={`QR ${table.name}`} className="w-36 h-36 my-2" />
              ) : (
                <div className="w-36 h-36 bg-gray-100 animate-pulse rounded-lg my-2" />
              )}
              <p className="text-xs text-gray-400 mb-3 break-all text-center">{baseUrl}/menu/{table.id}</p>
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => downloadQr(table.id, table.name)}
                  disabled={!qrUrls[table.id]}
                  className="flex-1 bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-white text-xs py-2 rounded-lg font-medium"
                >
                  İndir
                </button>
                <button onClick={() => deleteTable(table.id)} className="bg-red-50 hover:bg-red-100 text-red-600 text-xs py-2 px-3 rounded-lg">
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
