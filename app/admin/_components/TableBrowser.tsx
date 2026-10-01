"use client";
import { useCallback, useEffect, useState } from "react";

interface Column { key: string; label: string; kind?: string; badge?: Record<string, string>; profileKey?: string; }
interface Filter { key: string; label: string; options: string[]; }
interface Row { [k: string]: unknown; }
interface Result { rows: Row[]; total: number; page: number; pageSize: number; }

interface Props {
   sourceId: string;
   tableId: string;
   columns: Column[];
   filters?: Filter[];
   defaultSort?: string;
   pdf?: { bucket: string; pathColumn: string };
}

export function TableBrowser({ sourceId, tableId, columns, filters = [], defaultSort = "id", pdf }: Props) {
   const [search, setSearch] = useState("");
   const [sort, setSort] = useState(defaultSort);
   const [dir, setDir] = useState<"asc" | "desc">("desc");
   const [page, setPage] = useState(1);
   const [pageSize, setPageSize] = useState(25);
   const [filterVals, setFilterVals] = useState<Record<string, string>>({});
   const [data, setData] = useState<Result | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");
   const [pdfView, setPdfView] = useState<{ path: string; url: string } | null>(null);
   const [pdfErr, setPdfErr] = useState("");

   const load = useCallback(async () => {
     setLoading(true);
     setError("");
     const params = new URLSearchParams();
     if (search) params.set("search", search);
     params.set("sort", sort);
     params.set("dir", dir);
     params.set("page", String(page));
     params.set("pageSize", String(pageSize));
     for (const [k, v] of Object.entries(filterVals)) if (v) params.set(k, v);
     try {
       const res = await fetch(`/api/admin/data/sources/${sourceId}/tables/${tableId}?${params}`, { cache: "no-store" });
       if (!res.ok) {
         const d = await res.json().catch(() => ({}));
         throw new Error(d.error || `HTTP ${res.status}`);
          }
       setData(await res.json());
        } catch (e) {
       setError((e as Error).message);
       setData(null);
        } finally {
       setLoading(false);
        }
      }, [search, sort, dir, page, pageSize, filterVals, sourceId, tableId]);

   useEffect(() => { load(); }, [load]);
     // Reset to first page when search or filters change.
   useEffect(() => { setPage(1); }, [search, filterVals]);

   function onSort(colKey: string) {
     if (sort === colKey) setDir((d) => (d === "asc" ? "desc" : "asc"));
     else { setSort(colKey); setDir("asc"); }
     setPage(1);
        }

     // The object proxy is same-origin, so the browser sends the auth cookie for the iframe.
   function openPdf(path: string) {
     setPdfErr("");
     const proxy = `/api/admin/data/sources/${sourceId}/buckets/${pdf!.bucket}/object?path=${encodeURIComponent(path)}`;
     setPdfView({ path, url: proxy });
      }

   const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;
   const start = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0;
   const end = data ? Math.min(data.total, data.page * data.pageSize) : 0;

   return (
         <div>
            <div className="toolbar">
               <input
                 type="search"
                 placeholder="Search rows…"
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                  />
               {filters.map((f) => (
                   <select
                    key={f.key}
                    value={filterVals[f.key] || ""}
                    onChange={(e) => setFilterVals((p) => ({ ...p, [f.key]: e.target.value }))}
                       >
                      <option value="">All {f.label}</option>
                      {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                   </select>
                  ))}
               <span className="spacer" />
               <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                  {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
               </select>
            </div>

            <div className="table-wrap">
               {loading && <div className="loading">Loading…</div>}
               {error && <div className="error">⚠ {error}</div>}
               {!loading && !error && data && (
                   <>
                      <table>
                         <thead>
                            <tr>
                               {columns.map((c) => (
                                   <th key={c.key} onClick={() => onSort(c.key)} title={`Sort by ${c.label}`}>
                                     {c.label}
                                     {sort === c.key ? <span className="arrow">{dir === "asc" ? " ▲" : " ▼"}</span> : null}
                                   </th>
                                   ))}
                            </tr>
                         </thead>
                         <tbody>
                            {data.rows.length === 0 && (
                                <tr><td colSpan={columns.length} className="empty">No rows match.</td></tr>
                                )}
                            {data.rows.map((row, i) => (
                                <tr key={i}>
                                   {columns.map((c) => (
                                       <td key={c.key}>{renderCell(c, row[c.key], () => openPdf(String(row[c.key])), sourceId, row)}</td>
                                       ))}
                                </tr>
                                ))}
                         </tbody>
                      </table>
                      <div className="pagination">
                         <div className="info">
                            {data.total} row{data.total === 1 ? "" : "s"} · showing {start}–{end}
                         </div>
                         <div className="pages">
                            <button disabled={data.page <= 1} onClick={() => setPage((p) => p - 1)}>‹ Prev</button>
                            <span className="muted" style={{ fontSize: 13 }}>Page {data.page} / {totalPages}</span>
                            <button disabled={data.page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next ›</button>
                         </div>
                      </div>
                   </>
                 )}
            </div>

            {pdfView && (
               <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "grid", placeItems: "center", zIndex: 50, padding: 20 }}>
                  <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, maxWidth: 900, width: "100%" }}>
                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <strong>Signed document · {pdfView.path}</strong>
                        <button onClick={() => { setPdfView(null); setPdfErr(""); }}>Close</button>
                     </div>
                     {pdfView.url && (
                         <div>
                            <a className="btn" style={{ marginRight: 8 }} href={pdfView.url} target="_blank" rel="noreferrer">Open / download ↗</a>
                            <iframe src={pdfView.url} title="Signed document" style={{ width: "100%", height: "70vh", border: "1px solid var(--border)", borderRadius: 8 }} />
                         </div>
                        )}
                  </div>
               </div>
              )}
         </div>
        );
}

function renderCell(c: Column, value: unknown, openPdf: () => void, sourceId: string, row: Row) {
   if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
     return <span className="muted">—</span>;
       }
   const s = Array.isArray(value) ? value.join(", ") : String(value);
   switch (c.kind) {
     case "pdf":
       return <button onClick={openPdf}>View PDF</button>;
     case "date":
       return <span className="mono">{s}</span>;
     case "datetime":
       return <span className="mono">{new Date(s).toLocaleString()}</span>;
     case "email":
       return <a href={`mailto:${s}`}>{s}</a>;
     case "link":
       return <a href={s} target="_blank" rel="noreferrer">Open ↗</a>;
     case "profile": {
       const target = c.profileKey ? String(row[c.profileKey] ?? s) : s;
       return <a href={`/admin/data/sources/${sourceId}/profiles/${encodeURIComponent(target)}`}>{s}</a>;
        }
     case "badge": {
       const cls = c.badge ? c.badge[s] : undefined;
       return <span className={`badge ${cls || "info"}`}>{s}</span>;
        }
     default:
       return <>{s.length > 60 ? s.slice(0, 57) + "…" : s}</>;
       }
}
