"use client";

import { useEffect, useState } from "react";

type Form = {
  businessName: string;
  about: string;
  wifi: string;
  instagram: string;
  mapUrl: string;
  baseUrl: string;
};

export default function SettingsPage() {
  const [form, setForm] = useState<Form>({ businessName: "", about: "", wifi: "", instagram: "", mapUrl: "", baseUrl: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((data) => setForm((p) => ({ ...p, ...data })));
  }, []);

  async function save() {
    setSaving(true);
    await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const fields: { label: string; key: keyof Form; hint?: string; placeholder: string }[] = [
    { label: "İşletme Adı", key: "businessName", placeholder: "Garaj Cafe" },
    { label: "Hakkımızda", key: "about", placeholder: "Kısa bir tanıtım..." },
    { label: "Wi-Fi Şifresi", key: "wifi", placeholder: "wifi123" },
    { label: "Instagram", key: "instagram", placeholder: "@garajcafe" },
    { label: "Harita Bağlantısı", key: "mapUrl", placeholder: "https://maps.google.com/..." },
    { label: "Site URL (QR için)", key: "baseUrl", hint: "QR kodların yönleneceği adres", placeholder: "https://garajcafe.shop" },
  ];

  return (
    <div className="max-w-xl">
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
        <button onClick={save} disabled={saving} className="w-full bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white py-3 rounded-xl font-bold">
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </div>
  );
}
