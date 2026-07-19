"use client";

import { useState } from "react";
import { login } from "@/lib/actions/auth";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(username, password);

    setLoading(false);

    if (!result.success) {
      setError(result.message ?? "Login gagal");
      return;
    }

    // Reload penuh supaya middleware baca cookie yang baru diset
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-[#2d5a4a] flex items-center justify-center">
      <div className="bg-[#fdf8f0] rounded-2xl p-12 w-full max-w-md">
        <h1 className="text-3xl font-bold text-black">SIR</h1>
        <p className="text-black/70 mt-1">Sistem Informasi Restoran</p>

        <h2 className="text-2xl font-bold text-black mt-8 mb-6">Login</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-semibold text-black/80 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukan Username"
              className="w-full border border-black/20 rounded-lg px-4 py-3 outline-none focus:border-[#2d5a4a]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-black/80 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukan Password"
              className="w-full border border-black/20 rounded-lg px-4 py-3 outline-none focus:border-[#2d5a4a]"
              required
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2d5a4a] text-white font-semibold rounded-lg py-3 mt-2 hover:bg-[#254a3d] transition-colors disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Login"}
          </button>
        </form>

        <p className="text-center text-black/50 text-sm mt-8">Tim Jaipong</p>
      </div>
    </div>
  );
}