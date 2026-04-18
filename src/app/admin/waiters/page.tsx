"use client";

import { useEffect, useState } from "react";

type Waiter = { id: number; name: string; username: string };

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
        <h2 className="font-bold text-slate-700">Garsonlar</h2>
        <button
          onClick={() => { setForm({ name: "", username: "", password: "" }); setEditId(null); setModal(true); }}
          className="bg-amber-700 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Garson Ekle
        </button>
      </div>

      <div className="space-y-2">
        {waiters.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm">
            Henüz garson eklenmemiş.
          </div>
        )}
        {waiters.map((w) => (
          <div key={w.id} className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="font-semibold text-slate-800">{w.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">@{w.username}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(w)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-sm">Düzenle</button>
              <button onClick={() => remove(w.id)} className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-sm">Sil</button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-lg mb-4">{editId ? "Garson Düzenle" : "Garson Ekle"}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı Adı</label>
                <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editId ? "Yeni Şifre (boş bırakılırsa değişmez)" : "Şifre"}
                </label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setModal(false)} className="flex-1 border rounded-xl py-2 text-sm">İptal</button>
              <button onClick={save} className="flex-1 bg-amber-700 text-white rounded-xl py-2 text-sm font-medium">Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
