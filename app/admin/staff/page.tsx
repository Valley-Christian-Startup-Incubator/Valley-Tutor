import type { Metadata } from "next";
import Script from "next/script";
import { BUILD_VERSION } from "../../../lib/buildVersion";
import SiteFooter from "../../SiteFooter";
import { requireAuthRedirect } from "@/lib/adminSession";
import { LogoutButton } from "../_components/TopBar";

export const metadata: Metadata = {
  title: "Reports & Accounts | Peer Tutoring Admin",
};

// Deliberately plain — this is a working tool for staff to review reports
// and disable accounts, not a polished public page. (Moved here from /admin.)
// Access requires the shared password-only admin session (lib/adminSession):
// checked server-side here, and again by every /api/admin/* route.
export default async function AdminStaffPage() {
  await requireAuthRedirect();
  return (
    <div className="admin-body">
      <header className="admin-header">
        <h1>Peer Tutoring — Admin</h1>
        <span style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <a href="/admin">← Admin home</a>
          <span id="admin-email"></span>
          <LogoutButton className="btn-ghost" />
        </span>
      </header>

      <div className="admin-denied" id="admin-denied" style={{ display: "none" }}>
        <p>Your admin session has ended. Please sign in again.</p>
        <a href="/admin/login">Sign in</a>
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

      <SiteFooter />

      <Script src={`/admin.js?v=${BUILD_VERSION}`} strategy="afterInteractive" />
    </div>
  );
}
