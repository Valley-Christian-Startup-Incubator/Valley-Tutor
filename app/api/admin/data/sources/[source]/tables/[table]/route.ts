import { NextRequest, NextResponse } from "next/server";
import { getTable } from "@/lib/adminData/sources";
import { queryTable } from "@/lib/adminData/db";
import { requireAuth } from "@/lib/adminSession";

export async function GET(
   request: NextRequest,
   { params }: { params: Promise<{ source: string; table: string }> },
) {
   const denied = await requireAuth(request);
   if (denied) return denied;
   const { source, table } = await params;
   const found = getTable(source, table);
   if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 });

   const url = new URL(request.url);
   const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
   const pageSize = Math.min(500, Math.max(1, Number(url.searchParams.get("pageSize") || "25")));
   const sort = url.searchParams.get("sort") || undefined;
   const dir = (url.searchParams.get("dir") as "asc" | "desc" | null) || "asc";

      // Filters: any ?<col>=<value> that is a declared filter column.
   const filters: Record<string, string> = {};
   for (const f of found.table.filters ?? []) {
     const v = url.searchParams.get(f.key);
     if (v) filters[f.key] = v;
     }

   try {
     const result = await queryTable(found.source, found.table, {
       search: url.searchParams.get("search") || undefined,
       filters,
       sort,
       dir,
       page,
       pageSize,
      });
     return NextResponse.json(result);
     } catch (err) {
     return NextResponse.json({ error: (err as Error).message }, { status: 502 });
     }
}
