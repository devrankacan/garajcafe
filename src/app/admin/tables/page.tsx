"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type Table = { id: number; number: number; name: string; status: string };

const statusLabel: Record<string, string> = { EMPTY: "Boş", OCCUPIED: "Dolu", OPEN: "Açık" };
const statusColor: Record<string, string> = {
  EMPTY: "text-green-700 bg-green-50",
  OCCUPIED: "text-red-700 bg-red-50",
  OPEN: "text-yellow-700 bg-yellow-50",
};

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [baseUrl, setBaseUrl] = useState("");
  const [form, setForm] = useState({ number: "", name: "" });
  const [qrUrls, setQrUrls] = useState<Record<number, string>>({});

  async function fetchData() {
    const [tbls, settings] = await Promise.all([
      fetch("/api/tables").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]);
    setTables(tbls);
    setBaseUrl(settings.baseUrl ?? window.location.origin);
  }

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!baseUrl || tables.length === 0) return;
    tables.forEach((table) => {
      QRCode.toDataURL(baseUrl, { width: 300, margin: 2 }).then((dataUrl) => {
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
    <div>
      {/* Yeni Masa Ekle */}
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
        <p className="text-xs text-slate-400 mt-2">QR kodlar <strong>{baseUrl || "..."}</strong> adresine yönlendirilir. Ayarlar sekmesinden değiştirebilirsin.</p>
      </div>

      {/* Masa Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map((table) => (
          <div key={table.id} className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-2">
              <p className="font-bold text-slate-800">{table.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[table.status]}`}>
                {statusLabel[table.status]}
              </span>
            </div>
            {qrUrls[table.id] ? (
              <img src={qrUrls[table.id]} alt={`QR ${table.name}`} className="w-32 h-32 my-2" />
            ) : (
              <div className="w-32 h-32 bg-gray-100 animate-pulse rounded-lg my-2" />
            )}
            <div className="flex gap-2 w-full mt-1">
              <button
                onClick={() => downloadQr(table.id, table.name)}
                disabled={!qrUrls[table.id]}
                className="flex-1 bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-white text-xs py-2 rounded-lg font-medium"
              >
                QR İndir
              </button>
              <button onClick={() => deleteTable(table.id)} className="bg-red-50 hover:bg-red-100 text-red-600 text-xs py-2 px-3 rounded-lg">
                Sil
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
