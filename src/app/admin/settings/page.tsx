"use client";

import { useEffect, useRef, useState } from "react";

type Form = {
  businessName: string;
  about: string;
  address: string;
  hours: string;
  email: string;
  phone: string;
  wifi: string;
  instagram: string;
  facebook: string;
  twitter: string;
  mapUrl: string;
  baseUrl: string;
  logoUrl: string;
  coverUrl: string;
};

export default function SettingsPage() {
  const [form, setForm] = useState<Form>({
    businessName: "", about: "", address: "", hours: "", email: "", phone: "",
    wifi: "", instagram: "", facebook: "", twitter: "", mapUrl: "", baseUrl: "", logoUrl: "", coverUrl: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null);
  const [uploadError, setUploadError] = useState("");
  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((data) => setForm((p) => ({ ...p, ...data })));
  }, []);

  async function uploadFile(file: File, key: "logoUrl" | "coverUrl") {
    setUploading(key === "logoUrl" ? "logo" : "cover");
    setUploadError("");
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: base64, name: file.name }),
      });
      let data: { url?: string; error?: string };
      try { data = await res.json(); } catch { data = {}; }
      if (data.url) setForm((p) => ({ ...p, [key]: data.url as string }));
      else setUploadError(data.error ?? `HTTP ${res.status}: Yükleme başarısız`);
    } catch {
      setUploadError("Sunucuya bağlanılamadı");
    }
    setUploading(null);
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

  const inputStyle = { background: "var(--a-inp)", border: "1px solid var(--a-inp-border)", color: "var(--a-text)" };
  const labelStyle = { color: "#cc1515" };

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
      {uploadError && (
        <div className="rounded-xl px-4 py-3 mb-4 text-sm"
          style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}>
          ✕ {uploadError}
        </div>
      )}
      {saved && (
        <div className="rounded-xl px-4 py-3 mb-4 font-medium text-sm"
          style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)" }}>
          ✓ Ayarlar kaydedildi!
        </div>
      )}

      <div className="rounded-2xl p-6 space-y-5" style={{ background: "var(--a-card)", border: "1px solid var(--a-inp-border)" }}>

        {/* Kapak Görseli */}
        <div>
          <label className="block text-xs font-semibold uppercase mb-2" style={labelStyle}>Kapak Görseli</label>
          <input ref={coverRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f, "coverUrl"); }} />
          <div className="relative w-full h-36 rounded-xl overflow-hidden cursor-pointer"
            style={{ background: "var(--a-inp)", border: "1px solid var(--a-inp-border)" }}
            onClick={() => coverRef.current?.click()}>
            {form.coverUrl
              ? <img src={form.coverUrl} alt="Kapak" className="w-full h-full object-cover" />
              : <div className="flex flex-col items-center justify-center h-full gap-2">
                  <span className="text-3xl opacity-20">🖼</span>
                  <span className="text-xs text-gray-500">Kapak görseli yükle</span>
                </div>
            }
            <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center">
              <span className="text-white text-xs font-semibold opacity-0 hover:opacity-100 bg-black/50 px-3 py-1 rounded-full">
                {uploading === "cover" ? "Yükleniyor..." : "Değiştir"}
              </span>
            </div>
          </div>
          {form.coverUrl && (
            <button onClick={() => setForm((p) => ({ ...p, coverUrl: "" }))}
              className="mt-1.5 text-xs text-red-400 hover:text-red-300">
              Kapak görselini kaldır
            </button>
          )}
        </div>

        {/* Logo */}
        <div>
          <label className="block text-xs font-semibold uppercase mb-2" style={labelStyle}>Firma Logosu</label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
              style={{ background: "var(--a-inp)", border: "1px solid var(--a-inp-border)" }}>
              {form.logoUrl
                ? <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                : <span className="text-3xl opacity-30">♠</span>}
            </div>
            <div className="flex-1">
              <input ref={logoRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f, "logoUrl"); }} />
              <button onClick={() => logoRef.current?.click()} disabled={uploading === "logo"}
                className="w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ background: "rgba(204,21,21,0.15)", color: "#cc1515", border: "1px solid rgba(204,21,21,0.35)" }}>
                {uploading === "logo" ? "Yükleniyor..." : "Bilgisayardan Seç"}
              </button>
              {form.logoUrl && (
                <button onClick={() => setForm((p) => ({ ...p, logoUrl: "" }))}
                  className="w-full mt-1.5 py-1.5 rounded-xl text-xs text-red-400"
                  style={{ border: "1px solid rgba(239,68,68,0.2)" }}>
                  Logoyu Kaldır
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={{ borderBottom: "1px solid rgba(204,21,21,0.15)" }} />

        {/* Genel */}
        {[
          { label: "İşletme Adı", key: "businessName", placeholder: "Garaj Cafe" },
          { label: "Hakkımızda", key: "about", placeholder: "Kısa bir tanıtım..." },
        ].map(({ label, key, placeholder }) => (
          <div key={key}>
            <label className="block text-xs font-semibold uppercase mb-1.5" style={labelStyle}>{label}</label>
            <input value={form[key as keyof Form]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              placeholder={placeholder} className="w-full rounded-lg px-3 py-2.5 text-sm placeholder-gray-600 focus:outline-none"
              style={inputStyle} />
          </div>
        ))}

        <div style={{ borderBottom: "1px solid rgba(204,21,21,0.15)" }} />
        <p className="text-xs font-semibold uppercase" style={{ color: "#cc1515" }}>İletişim & Konum</p>

        {[
          { label: "Adres", key: "address", placeholder: "Mahalle, Cadde No, İlçe/İl" },
          { label: "Çalışma Saatleri", key: "hours", placeholder: "04:00 – 00:00" },
          { label: "E-posta", key: "email", placeholder: "info@garajcafe.com" },
          { label: "Telefon", key: "phone", placeholder: "0(533) 513 51 57" },
          { label: "Harita Bağlantısı", key: "mapUrl", placeholder: "https://maps.google.com/..." },
        ].map(({ label, key, placeholder }) => (
          <div key={key}>
            <label className="block text-xs font-semibold uppercase mb-1.5" style={labelStyle}>{label}</label>
            <input value={form[key as keyof Form]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              placeholder={placeholder} className="w-full rounded-lg px-3 py-2.5 text-sm placeholder-gray-600 focus:outline-none"
              style={inputStyle} />
          </div>
        ))}

        <div style={{ borderBottom: "1px solid rgba(204,21,21,0.15)" }} />
        <p className="text-xs font-semibold uppercase" style={{ color: "#cc1515" }}>Sosyal Medya</p>

        {[
          { label: "Instagram", key: "instagram", placeholder: "@garajcafe" },
          { label: "Facebook", key: "facebook", placeholder: "@garajcafe" },
          { label: "Twitter / X", key: "twitter", placeholder: "@garajcafe" },
        ].map(({ label, key, placeholder }) => (
          <div key={key}>
            <label className="block text-xs font-semibold uppercase mb-1.5" style={labelStyle}>{label}</label>
            <input value={form[key as keyof Form]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              placeholder={placeholder} className="w-full rounded-lg px-3 py-2.5 text-sm placeholder-gray-600 focus:outline-none"
              style={inputStyle} />
          </div>
        ))}

        <div style={{ borderBottom: "1px solid rgba(204,21,21,0.15)" }} />
        <p className="text-xs font-semibold uppercase" style={{ color: "#cc1515" }}>Sistem</p>

        {[
          { label: "Wi-Fi Şifresi", key: "wifi", placeholder: "wifi123" },
          { label: "Site URL (QR için)", key: "baseUrl", hint: "QR kodların yönleneceği adres", placeholder: "https://garajcafe.shop" },
        ].map(({ label, key, hint, placeholder }: { label: string; key: string; hint?: string; placeholder: string }) => (
          <div key={key}>
            <label className="block text-xs font-semibold uppercase mb-1.5" style={labelStyle}>{label}</label>
            {hint && <p className="text-xs text-gray-500 mb-1">{hint}</p>}
            <input value={form[key as keyof Form]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              placeholder={placeholder} className="w-full rounded-lg px-3 py-2.5 text-sm placeholder-gray-600 focus:outline-none"
              style={inputStyle} />
          </div>
        ))}

        <button onClick={save} disabled={saving}
          className="w-full py-3 rounded-xl font-bold disabled:opacity-50"
          style={{ background: "#cc1515", color: "#ffffff" }}>
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </div>
  );
}
