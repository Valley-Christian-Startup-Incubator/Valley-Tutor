"use client";
import Link from "next/link";

// Cross-section links (staff tools, which use the student app's styles) are
// plain <a> tags on purpose, so moving between the two looks is a full page load.
export function TopBar() {
  return (
    <div className="topbar">
      <Link className="brand" href="/admin">
        <img className="logo" src="/assets/vcs-symbol-color.png" alt="" />
        <span>Valley Christian · Admin</span>
      </Link>
      <div className="right">
        <a href="/admin/staff">Reports &amp; accounts</a>
        <Link href="/admin">Databases</Link>
        <a href="/api/admin/data/health" target="_blank" rel="noreferrer">status</a>
        <LogoutButton />
      </div>
    </div>
  );
}

export function LogoutButton({ className }: { className?: string }) {
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }
  return <button type="button" className={className} onClick={logout}>Sign out</button>;
}
