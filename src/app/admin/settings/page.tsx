"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SettingsForm = {
  businessName: string;
  about: string;
  wifi: string;
  instagram: string;
  mapUrl: string;
  baseUrl: string;
};

export default function SettingsPage() {
  const [form, setForm] = useState<SettingsForm>({
    businessName: "",
    about: "",
    wifi: "",
    instagram: "",
    mapUrl: "",
    baseUrl: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((data) => {
      setForm((prev) => ({ ...prev, ...data }));
    });
  }, []);

  async function save() {
    setSaving(true);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const fields: { label: string; key: keyof SettingsForm; hint?: string; placeholder?: string }[] = [
    { label: "İşletme Adı", key: "businessName", placeholder: "Garaj Cafe" },
    { label: "Hakkımızda", key: "about", placeholder: "Kısa bir tanıtım..." },
    { label: "Wi-Fi Şifresi", key: "wifi", placeholder: "wifi123" },
    { label: "Instagram Hesabı", key: "instagram", placeholder: "@garajcafe" },
    { label: "Harita Bağlantısı", key: "mapUrl", placeholder: "https://maps.google.com/..." },
    { label: "Site Base URL", key: "baseUrl", hint: "QR kod oluşturmak için kullanılır", placeholder: "https://garajcafe.com" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white px-4 py-3 shadow">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/admin" className="text-slate-400 hover:text-white">← Admin</Link>
          <h1 className="text-lg font-bold">İşletme Ayarları</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {saved && (
          <div className="bg-green-100 text-green-800 rounded-xl px-4 py-3 mb-4 font-medium">
            Ayarlar kaydedildi!
          </div>
        )}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          {fields.map(({ label, key, hint, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
              <input
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          ))}
          <button
            onClick={save}
            disabled={saving}
            className="w-full bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white py-3 rounded-xl font-bold"
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>

        {/* QR Code Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mt-4">
          <h2 className="font-bold text-slate-800 mb-3">QR Kodlar</h2>
          <p className="text-sm text-slate-500 mb-4">
            Masalar için QR kodlarını <Link href="/admin/tables" className="text-amber-700 underline">Masa Yönetimi</Link> sayfasından indirebilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
