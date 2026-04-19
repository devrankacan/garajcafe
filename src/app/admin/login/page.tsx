"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      window.location.href = "/admin";
      return;
    } else {
      const data = await res.json();
      setError(data.error ?? "Hata oluştu");
    }
    setLoading(false);
  }

  return (
    <div className="felt-bg min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / başlık */}
        <div className="text-center mb-8">
          <p className="text-4xl mb-3" style={{ color: "#cc1515" }}>♠</p>
          <h1 className="text-xl font-bold" style={{ color: "#cc1515" }}>Admin Paneli</h1>
          <p className="text-sm text-gray-500 mt-1">Devam etmek için şifreyi girin</p>
        </div>

        <form onSubmit={handleSubmit}
          className="rounded-2xl p-6 space-y-4"
          style={{ background: "#1a1a1a", border: "1px solid rgba(204,21,21,0.25)" }}>

          {error && (
            <div className="rounded-xl px-4 py-2.5 text-sm text-center"
              style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: "#cc1515" }}>Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
              required
              className="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
              style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(204,21,21,0.3)" }}
            />
          </div>

          <button type="submit" disabled={loading || !password}
            className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-40 transition-opacity"
            style={{ background: "#cc1515" }}>
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-600 mt-4">
          Varsayılan şifre: <span className="font-mono text-gray-500">admin</span>
        </p>
      </div>
    </div>
  );
}
