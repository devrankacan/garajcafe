"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type Table = { id: number; number: number; name: string; status: string };

const statusLabel: Record<string, string> = { EMPTY: "Boş", OCCUPIED: "Dolu", OPEN: "Açık" };
const statusStyle: Record<string, { bg: string; color: string }> = {
  EMPTY:    { bg: "rgba(34,197,94,0.1)",  color: "#4ade80" },
  OCCUPIED: { bg: "rgba(239,68,68,0.1)",  color: "#f87171" },
  OPEN:     { bg: "rgba(234,179,8,0.1)",  color: "#facc15" },
};

const card = { background: "#1a1a1a", border: "1px solid rgba(204,21,21,0.2)" };
const inputCls = "rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none";
const inputStyle = { background: "rgba(0,0,0,0.4)", border: "1px solid rgba(204,21,21,0.3)" };

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
      <div className="rounded-2xl p-5 mb-6" style={card}>
        <h2 className="font-semibold text-white mb-3">Yeni Masa Ekle</h2>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="No"
            value={form.number}
            onChange={(e) => setForm({ ...form, number: e.target.value })}
            className={`w-20 ${inputCls}`}
            style={inputStyle}
          />
          <input
            placeholder="Masa Adı (ör: Masa 1)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={`flex-1 ${inputCls}`}
            style={inputStyle}
          />
          <button onClick={addTable}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: "#cc1515" }}>
            Ekle
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          QR kodlar <strong className="text-gray-300">{baseUrl || "..."}</strong> adresine yönlendirilir. Ayarlar sekmesinden değiştirebilirsin.
        </p>
      </div>

      {/* Masa Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map((table) => {
          const st = statusStyle[table.status] ?? statusStyle.EMPTY;
          return (
            <div key={table.id} className="rounded-2xl p-4 flex flex-col items-center" style={card}>
              <div className="flex items-center justify-between w-full mb-2">
                <p className="font-bold text-white">{table.name}</p>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: st.bg, color: st.color }}>
                  {statusLabel[table.status]}
                </span>
              </div>
              {qrUrls[table.id] ? (
                <img src={qrUrls[table.id]} alt={`QR ${table.name}`} className="w-32 h-32 my-2 rounded-lg" />
              ) : (
                <div className="w-32 h-32 rounded-lg my-2 animate-pulse" style={{ background: "rgba(204,21,21,0.08)" }} />
              )}
              <div className="flex gap-2 w-full mt-1">
                <button
                  onClick={() => downloadQr(table.id, table.name)}
                  disabled={!qrUrls[table.id]}
                  className="flex-1 text-white text-xs py-2 rounded-lg font-medium disabled:opacity-40"
                  style={{ background: "#cc1515" }}>
                  QR İndir
                </button>
                <button onClick={() => deleteTable(table.id)}
                  className="text-red-400 hover:text-red-300 text-xs py-2 px-3 rounded-lg"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  Sil
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
