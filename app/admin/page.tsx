import Link from "next/link";
import { getSources } from "@/lib/adminData/sources";
import { requireAuthRedirect } from "@/lib/adminSession";
import { AdminShell } from "./_components/AdminShell";

// Combined admin home: peer-tutoring staff tools + the former Data Admin
// databases list. Signed out → /admin/login.
export default async function AdminHome() {
  await requireAuthRedirect();
  const sources = getSources();

  return (
    <AdminShell>
      <h1>Admin</h1>
      <p className="sub">Peer-tutoring staff tools and read-only access to the organization&apos;s databases.</p>

      <h2>Staff tools</h2>
      <div className="grid">
        <div className="card">
          <div className="title">Reports &amp; accounts</div>
          <div className="desc">Review student reports (mark reviewed) and disable or re-enable student accounts.</div>
          <a href="/admin/staff">Open reports &amp; accounts →</a>
        </div>
      </div>

      <h2 className="home-section">Databases</h2>
      <p className="sub">Each card is a data source; click a table to browse its rows.</p>
      <div className="grid">
        {sources.map((s) => (
          <div className="card" key={s.id}>
            <div className="title">
              <Link href={`/admin/data/sources/${s.id}`}>{s.name}</Link>
            </div>
            <div className="desc">{s.description ?? "No description."}</div>
            <div className="meta">
              <span className="pill">{s.kind}</span>
              <span className="pill">{s.tables.length} table{s.tables.length === 1 ? "" : "s"}</span>
              {(s.buckets?.length ?? 0) > 0 && (
                <span className="pill">{s.buckets!.length} storage bucket{s.buckets!.length === 1 ? "" : "s"}</span>
              )}
            </div>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              {s.tables.map((t) => (
                <Link key={t.id} href={`/admin/data/sources/${s.id}/tables/${t.id}`}>
                  <strong style={{ fontSize: 14 }}>{t.label}</strong>
                  {t.description ? <div className="muted" style={{ fontSize: 12 }}>{t.description}</div> : null}
                </Link>
              ))}
              {(s.buckets ?? []).map((b) => (
                <Link key={`bucket-${b.id}`} href={`/admin/data/sources/${s.id}/buckets/${b.id}`}>
                  <strong style={{ fontSize: 14 }}>🗄 {b.label ?? b.id}</strong>
                  {b.description ? <div className="muted" style={{ fontSize: 12 }}>{b.description}</div> : null}
                </Link>
              ))}
            </div>
          </div>
        ))}
        {sources.length === 0 && <div className="empty">No data sources configured yet.</div>}
      </div>
    </AdminShell>
  );
}
