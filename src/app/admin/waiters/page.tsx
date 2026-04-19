"use client";

import { useEffect, useState } from "react";

type Waiter = { id: number; name: string; username: string };

const card = { background: "#1a1a1a", border: "1px solid rgba(204,21,21,0.2)" };
const inputCls = "w-full rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none";
const inputStyle = { background: "rgba(0,0,0,0.4)", border: "1px solid rgba(204,21,21,0.25)" };
const labelStyle = { color: "#cc1515" };

export default function WaitersPage() {
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", password: "" });
  const [editId, setEditId] = useState<number | null>(null);

  async function fetchData() {
    const data = await fetch("/api/waiters").then((r) => r.json());
    setWaiters(data);
  }

  useEffect(() => { fetchData(); }, []);

  async function save() {
    if (editId) {
      await fetch(`/api/waiters/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/waiters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setModal(false);
    setForm({ name: "", username: "", password: "" });
    setEditId(null);
    fetchData();
  }

  async function remove(id: number) {
    if (!confirm("Garsonu sil?")) return;
    await fetch(`/api/waiters/${id}`, { method: "DELETE" });
    fetchData();
  }

  function openEdit(w: Waiter) {
    setForm({ name: w.name, username: w.username, password: "" });
    setEditId(w.id);
    setModal(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-white">Garsonlar</h2>
        <button
          onClick={() => { setForm({ name: "", username: "", password: "" }); setEditId(null); setModal(true); }}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "#cc1515" }}>
          + Garson Ekle
        </button>
      </div>

      <div className="space-y-2">
        {waiters.length === 0 && (
          <div className="rounded-xl p-8 text-center text-gray-500" style={card}>
            Henüz garson eklenmemiş.
          </div>
        )}
        {waiters.map((w) => (
          <div key={w.id} className="rounded-xl p-4 flex items-center justify-between" style={card}>
            <div>
              <p className="font-semibold text-white">{w.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">@{w.username}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(w)}
                className="px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:text-white"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                Düzenle
              </button>
              <button onClick={() => remove(w.id)}
                className="px-3 py-1.5 rounded-lg text-sm text-red-400 hover:text-red-300"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                Sil
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="rounded-2xl p-6 w-full max-w-sm" style={{ background: "#111111", border: "1px solid rgba(204,21,21,0.35)" }}>
            <h3 className="font-bold text-lg text-white mb-4">{editId ? "Garson Düzenle" : "Garson Ekle"}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase mb-1" style={labelStyle}>Ad Soyad</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase mb-1" style={labelStyle}>Kullanıcı Adı</label>
                <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase mb-1" style={labelStyle}>
                  {editId ? "Yeni Şifre (boş bırakılırsa değişmez)" : "Şifre"}
                </label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} style={inputStyle} />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setModal(false)}
                className="flex-1 py-2 rounded-xl text-sm text-gray-300"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
                İptal
              </button>
              <button onClick={save}
                className="flex-1 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: "#cc1515" }}>
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
