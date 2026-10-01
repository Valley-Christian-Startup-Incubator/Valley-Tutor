"use client";
import { useState } from "react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Login failed.");
        return;
      }
      window.location.href = "/admin";
    } catch {
      setError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mm-admin">
      <div className="login-wrap">
        <div className="login-card">
          <img className="login-logo" src="/assets/vcs-lockup-navy.png" alt="Valley Christian Schools" />
          <h1>Admin</h1>
          <p className="muted">Sign in to the peer-tutoring staff tools and data admin.</p>
          <form onSubmit={submit}>
            <input
              type="password"
              autoFocus
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="primary" disabled={loading || !password}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
            <div className="err">{error}</div>
          </form>
        </div>
      </div>
    </div>
  );
}
