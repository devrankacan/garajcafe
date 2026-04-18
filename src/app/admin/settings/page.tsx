"use client";

import { useEffect, useRef, useState } from "react";

type Form = {
  businessName: string;
  about: string;
  wifi: string;
  instagram: string;
  mapUrl: string;
  baseUrl: string;
  logoUrl: string;
};

export default function SettingsPage() {
  const [form, setForm] = useState<Form>({
    businessName: "", about: "", wifi: "", instagram: "", mapUrl: "", baseUrl: "", logoUrl: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((data) => setForm((p) => ({ ...p, ...data })));
  }, []);

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) setForm((p) => ({ ...p, logoUrl: data.url }));
    setUploading(false);
  }

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

  const fields: { label: string; key: keyof Form; hint?: string; placeholder: string }[] = [
    { label: "İşletme Adı", key: "businessName", placeholder: "Garaj Cafe" },
    { label: "Hakkımızda", key: "about", placeholder: "Kısa bir tanıtım..." },
    { label: "Wi-Fi Şifresi", key: "wifi", placeholder: "wifi123" },
    { label: "Instagram", key: "instagram", placeholder: "@garajcafe" },
    { label: "Harita Bağlantısı", key: "mapUrl", placeholder: "https://maps.google.com/..." },
    { label: "Site URL (QR için)", key: "baseUrl", hint: "QR kodların yönleneceği adres", placeholder: "https://garajcafe.shop" },
  ];

  const inputStyle = {
    background: "rgba(0,0,0,0.3)",
    border: "1px solid rgba(201,168,76,0.25)",
    color: "white",
  };

  const labelStyle = { color: "#c9a84c" };

  return (
    <div className="max-w-xl">
      {saved && (
        <div className="rounded-xl px-4 py-3 mb-4 font-medium text-sm"
          style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)" }}>
          ✓ Ayarlar kaydedildi!
        </div>
      )}

      <div className="rounded-2xl p-6 space-y-5" style={{ background: "#132e1e", border: "1px solid rgba(201,168,76,0.25)" }}>

        {/* Logo Yükleme */}
        <div>
          <label className="block text-xs font-semibold uppercase mb-2" style={labelStyle}>Firma Logosu</label>
          <div className="flex items-center gap-4">
            {/* Önizleme */}
            <div className="w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
              style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(201,168,76,0.25)" }}>
              {form.logoUrl ? (
                <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <span className="text-3xl opacity-30">♠</span>
              )}
            </div>
            <div className="flex-1">
              <input ref={fileRef} type="file" accept="image/*" onChange={uploadLogo} className="hidden" />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50"
                style={{ background: "rgba(201,168,76,0.15)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.35)" }}
              >
                {uploading ? "Yükleniyor..." : "Bilgisayardan Seç"}
              </button>
              {form.logoUrl && (
                <button
                  onClick={() => setForm((p) => ({ ...p, logoUrl: "" }))}
                  className="w-full mt-1.5 py-1.5 rounded-xl text-xs text-red-400 hover:text-red-300"
                  style={{ border: "1px solid rgba(239,68,68,0.2)" }}
                >
                  Logoyu Kaldır
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={{ borderBottom: "1px solid rgba(201,168,76,0.15)" }} />

        {/* Diğer Alanlar */}
        {fields.map(({ label, key, hint, placeholder }) => (
          <div key={key}>
            <label className="block text-xs font-semibold uppercase mb-1.5" style={labelStyle}>{label}</label>
            {hint && <p className="text-xs text-gray-500 mb-1">{hint}</p>}
            <input
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              placeholder={placeholder}
              className="w-full rounded-lg px-3 py-2.5 text-sm placeholder-gray-600 focus:outline-none"
              style={inputStyle}
            />
          </div>
        ))}

        <button onClick={save} disabled={saving}
          className="w-full py-3 rounded-xl font-bold disabled:opacity-50 transition-opacity"
          style={{ background: "#c9a84c", color: "#0a2015" }}>
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </div>
  );
}
