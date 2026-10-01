// Thin wrapper over a Supabase/Postgres REST (PostgREST) endpoint.
//
// The dashboard is read-only for tables. It issues GET requests to
// <baseUrl>/rest/v1/<table> with a service-role key (which bypasses RLS), and
// applies search, filters, sort, and pagination via PostgREST query params +
// the Range header.
import type { LookupDef, SourceDef, TableDef } from "./sources";
import { resolveApiBaseUrl, resolveServiceKey } from "./sources";

// Batch-fetches lk.fields for the distinct lk.sourceColumn values present in
// `rows`, then writes each field's row key onto each row. Best-effort: a
// failed lookup just leaves those columns blank rather than failing the
// whole table load.
async function applyLookup(
   base: string,
   key: string,
   rows: Record<string, unknown>[],
   lk: LookupDef,
): Promise<void> {
   const values = Array.from(
     new Set(rows.map((r) => r[lk.sourceColumn]).filter((v): v is string => typeof v === "string" && v.length > 0)),
     );
   if (!values.length) return;

   const url = new URL(`${base}/rest/v1/${encodeURIComponent(lk.table)}`);
   url.searchParams.set("select", [lk.matchColumn, ...lk.fields.map((f) => f.column)].join(","));
   url.searchParams.set(lk.matchColumn, `in.(${values.join(",")})`);

   try {
     const resp = await fetch(url.toString(), {
       headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" },
       cache: "no-store",
        });
     if (!resp.ok) return;
     const lkRows = (await resp.json().catch(() => [])) as Record<string, unknown>[];
     const map = new Map(lkRows.map((r) => [String(r[lk.matchColumn]), r]));
     for (const row of rows) {
       const srcVal = row[lk.sourceColumn];
       const match = typeof srcVal === "string" ? map.get(srcVal) : undefined;
       for (const f of lk.fields) row[f.key] = match ? (match[f.column] ?? null) : null;
        }
      } catch {
      // Leave lk.key unset on network/parse failure.
     }
}

export interface RowQuery {
   search?: string;
   filters?: Record<string, string>; // column -> exact value (from filter dropdowns)
   sort?: string;                     // column key
   dir?: "asc" | "desc";
   page?: number;                     // 1-based
   pageSize?: number;
}

export interface RowResult {
   rows: Record<string, unknown>[];
   total: number;
   page: number;
   pageSize: number;
   columns: { key: string; label: string; kind?: string }[];
}

function pgEscape(value: string): string {
   return encodeURIComponent(value);
}

export async function queryTable(source: SourceDef, table: TableDef, q: RowQuery): Promise<RowResult> {
   const base = resolveApiBaseUrl(source);
   const key = resolveServiceKey(source);
   const url = new URL(`${base}/rest/v1/${encodeURIComponent(table.id)}`);

   const page = Math.max(1, q.page ?? 1);
   const pageSize = Math.min(500, Math.max(1, q.pageSize ?? 25));
   const from = (page - 1) * pageSize;
   const to = from + pageSize - 1;

    // Search: OR over the searchable columns with ilike.
   if (q.search && q.search.trim()) {
     const term = q.search.trim();
     const cols = table.columns.filter((c) => {
       if (c.searchable !== undefined) return c.searchable;
       return c.kind === "text" || c.kind === "email";
       });
     if (cols.length) {
       const orParts = cols.map((c) => `${c.key}.ilike.%${pgEscape(term)}%`);
       url.searchParams.set("or", `(${orParts.join(",")})`);
        }
    }

    // Exact-value filters from dropdowns.
   if (q.filters) {
     for (const [col, val] of Object.entries(q.filters)) {
       if (!val) continue;
       url.searchParams.set(col, `eq.${pgEscape(val)}`);
        }
    }

    // Sort. Lookup-only keys aren't real columns on this table, so they can't be ordered by.
   const lookupKeys = new Set((table.lookups ?? []).flatMap((l) => l.fields.map((f) => f.key)));
   if (q.sort && q.dir && !lookupKeys.has(q.sort)) {
     url.searchParams.set("order", `${q.sort}.${q.dir}`);
    } else if (table.primary) {
     url.searchParams.set("order", `${table.primary}.asc`);
    }

    // Select only the columns this table config actually declares — never "*".
    // A table can have far more columns than the ones we chose to show (e.g.
    // "users" also has password_hash), and those should never round-trip to
    // the browser just because the underlying table has them. Each lookup's
    // sourceColumn is included even when it isn't a visible column itself —
    // it's needed to perform the lookup match (and often to build a
    // "profile" link), even if only the looked-up value is displayed.
   const lookupSourceCols = (table.lookups ?? []).map((l) => l.sourceColumn);
   const realColumns = Array.from(
     new Set([...table.columns.map((c) => c.key).filter((k) => !lookupKeys.has(k)), ...lookupSourceCols]),
     );
   url.searchParams.set("select", realColumns.length ? realColumns.join(",") : "*");

   const headers: Record<string, string> = {
     apikey: key,
     Authorization: `Bearer ${key}`,
     Accept: "application/json",
     Range: `${from}-${to}`,
     Prefer: "count=exact",
    };

   let resp: Response;
   try {
     resp = await fetch(url.toString(), { headers, cache: "no-store" });
     } catch (err) {
     throw new Error(`Failed to reach ${source.name} API at ${base}: ${(err as Error).message}`);
     }

   if (!resp.ok) {
     const body = await resp.text().catch(() => "");
     throw new Error(`Supabase API error ${resp.status} for ${table.id}: ${body.slice(0, 300)}`);
     }

   const rows = (await resp.json().catch(() => [])) as Record<string, unknown>[];
    // Content-Range header: "items-start-items-end/total"
   const contentRange = resp.headers.get("content-range") || "";
   const total = contentRange.split("/")[1] ? Number(contentRange.split("/")[1]) : rows.length;

   if (table.lookups?.length && rows.length) {
     await Promise.all(table.lookups.map((lk) => applyLookup(base, key, rows, lk)));
    }

   return {
     rows: Array.isArray(rows) ? rows : [],
     total: Number.isFinite(total) ? total : rows.length,
     page,
     pageSize,
     columns: table.columns.map((c) => ({ key: c.key, label: c.label, kind: c.kind })),
    };
}

// ---- Storage (for signed documents) ----

export async function listBucketObjects(
   source: SourceDef,
   bucket: string,
   prefix = "",
): Promise<Array<{ name: string; id?: string | null; updated_at?: string | null }>> {
   const base = resolveApiBaseUrl(source);
   const key = resolveServiceKey(source);
   const url = `${base}/storage/v1/object/list/${encodeURIComponent(bucket)}?prefix=${encodeURIComponent(prefix)}`;
   const resp = await fetch(url, {
     method: "POST",
     headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
     body: JSON.stringify({ prefix, limit: 1000 }),
     cache: "no-store",
    });
   if (!resp.ok) return [];
   const data = await resp.json().catch(() => []);
   return Array.isArray(data) ? data : [];
}

export async function getSignedUrl(source: SourceDef, bucket: string, path: string, expiresIn = 300): Promise<string> {
   const base = resolveApiBaseUrl(source);
   const key = resolveServiceKey(source);
   const url = `${base}/storage/v1/object/sign/${encodeURIComponent(bucket)}/${encodeURI(path)}`;
   const resp = await fetch(url, {
     method: "POST",
     headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
     body: JSON.stringify({ expiresIn }),
     cache: "no-store",
    });
   if (!resp.ok) {
     const body = await resp.text().catch(() => "");
     throw new Error(`Failed to sign object ${path}: ${body.slice(0, 200)}`);
     }
   const data = (await resp.json()) as { signedURL?: string; url?: string };
   const raw = data.signedURL || data.url || "";
    // The storage API returns a path relative to the storage host; make it absolute.
   return raw.startsWith("http") ? raw : `${base}${raw.startsWith("/") ? "" : "/"}${raw}`;
}

// Fetch a stored object (e.g. a signed PDF) via the storage API using the
// service-role key, and return its bytes + content type. This is preferred over
// handing the browser a storage signed URL, because the public tunnel may sit
// behind Cloudflare Access and the service key must never reach the browser.
export async function getObject(
   source: SourceDef,
   bucket: string,
   path: string,
): Promise<{ buffer: Buffer; contentType: string }> {
   const base = resolveApiBaseUrl(source);
   const key = resolveServiceKey(source);
   const url = `${base}/storage/v1/object/${encodeURIComponent(bucket)}/${encodeURI(path)}`;
   const resp = await fetch(url, {
     headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/pdf,*/*" },
     cache: "no-store",
     });
   if (!resp.ok) {
     const body = await resp.text().catch(() => "");
     throw new Error(`Failed to fetch object ${path} (${resp.status}): ${body.slice(0, 200)}`);
     }
   const ab = await resp.arrayBuffer();
   return { buffer: Buffer.from(ab), contentType: resp.headers.get("content-type") || "application/octet-stream" };
}
