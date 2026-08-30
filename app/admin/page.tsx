import type { Metadata } from "next";
import Script from "next/script";
import { BUILD_VERSION } from "../../lib/buildVersion";

export const metadata: Metadata = {
  title: "Admin | Peer Tutoring",
};

// Deliberately plain — this is a working tool for two staff members to
// review reports and disable accounts, not a polished public page. Access
// is gated client-side (public/admin.js checks /api/admin/me) since this
// app uses bearer tokens, not cookies, so there's no server-side session to
// check at the page level.
export default function AdminPage() {
  return (
    <div className="admin-body">
      <header className="admin-header">
        <h1>Peer Tutoring — Admin</h1>
        <span id="admin-email"></span>
      </header>

      <div className="admin-denied" id="admin-denied" style={{ display: "none" }}>
        <p>This account doesn&apos;t have admin access.</p>
        <a href="/app">Back to the app</a>
      </div>

      <main className="admin-main" id="admin-main" style={{ display: "none" }}>
        <nav className="admin-tabs">
          <button className="admin-tab active" id="admin-tab-reports" type="button">Reports</button>
          <button className="admin-tab" id="admin-tab-users" type="button">Users</button>
        </nav>

        <section className="admin-panel active" id="admin-panel-reports">
          <div id="admin-reports-list"></div>
        </section>

        <section className="admin-panel" id="admin-panel-users">
          <div id="admin-users-list"></div>
        </section>
      </main>

      <Script src={`/admin.js?v=${BUILD_VERSION}`} strategy="afterInteractive" />
    </div>
  );
}
