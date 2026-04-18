"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WaiterLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      router.push("/waiter");
    } else {
      const data = await res.json();
      setError(data.error ?? "Giriş başarısız");
    }
    setLoading(false);
  }

  return (
    <div className="felt-bg min-h-screen flex items-center justify-center px-4">
      {/* Dekoratif köşeler */}
      <div className="absolute top-6 left-6 text-3xl" style={{ color: "rgba(201,168,76,0.2)" }}>♠</div>
      <div className="absolute top-6 right-6 text-3xl" style={{ color: "rgba(201,168,76,0.2)" }}>♥</div>
      <div className="absolute bottom-6 left-6 text-3xl" style={{ color: "rgba(201,168,76,0.2)" }}>♦</div>
      <div className="absolute bottom-6 right-6 text-3xl" style={{ color: "rgba(201,168,76,0.2)" }}>♣</div>

      <div className="w-full max-w-sm fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="text-5xl mb-2" style={{ color: "#c9a84c" }}>♠</p>
          <h1 className="text-2xl font-bold" style={{ color: "#c9a84c" }}>Garson Girişi</h1>
          <p className="text-sm text-gray-400 mt-1">Kullanıcı adı ve şifrenizle giriş yapın</p>
        </div>

        <form onSubmit={login} className="rounded-2xl overflow-hidden"
          style={{ background: "#132e1e", border: "1px solid rgba(201,168,76,0.35)" }}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: "#c9a84c" }}>Kullanıcı Adı</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none"
                style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(201,168,76,0.25)" }}
                placeholder="kullanici_adi"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: "#c9a84c" }}>Şifre</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none"
                style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(201,168,76,0.25)" }}
                placeholder="••••••••"
                required
              />
            </div>
            {error && (
              <p className="text-red-400 text-sm text-center bg-red-900/30 rounded-lg py-2">{error}</p>
            )}
          </div>
          <div className="px-6 pb-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-base transition-opacity disabled:opacity-50"
              style={{ background: "#c9a84c", color: "#0a2015" }}
            >
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
