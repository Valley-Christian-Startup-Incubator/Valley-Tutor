"use client";
import { useEffect, useState } from "react";

interface Obj { name: string; updated_at?: string | null; }

export function BucketBrowser({ sourceId, bucket }: { sourceId: string; bucket: string }) {
   const [objects, setObjects] = useState<Obj[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");

   useEffect(() => {
     (async () => {
       try {
         const res = await fetch(`/api/admin/data/sources/${sourceId}/buckets/${bucket}/objects`, { cache: "no-store" });
         if (!res.ok) throw new Error(`HTTP ${res.status}`);
         const d = await res.json();
         setObjects(d.objects || []);
          } catch (e) {
         setError((e as Error).message);
          } finally {
         setLoading(false);
          }
        })();
     }, [sourceId, bucket]);

   if (loading) return <div className="loading">Loading…</div>;
   if (error) return <div className="error">⚠ {error}</div>;

   return (
        <div className="table-wrap">
           <div className="pagination">
              <div className="info">{objects.length} object(s)</div>
           </div>
           <table>
              <thead><tr><th>Name</th><th>Updated</th></tr></thead>
              <tbody>
                 {objects.map((o) => (
                     <tr key={o.name}>
                        <td className="mono">{o.name}</td>
                        <td className="muted">{o.updated_at ? new Date(o.updated_at).toLocaleString() : "—"}</td>
                     </tr>
                     ))}
                 {objects.length === 0 && <tr><td colSpan={2} className="empty">Empty bucket.</td></tr>}
              </tbody>
           </table>
        </div>
        );
}
