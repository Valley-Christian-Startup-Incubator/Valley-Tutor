import { NextRequest, NextResponse } from "next/server";
import { getSources } from "@/lib/adminData/sources";
import { requireAuth } from "@/lib/adminSession";

export async function GET(request: NextRequest) {
   const denied = await requireAuth(request);
   if (denied) return denied;
   const sources = getSources().map((s) => ({
     id: s.id,
     name: s.name,
     description: s.description,
     kind: s.kind,
     tables: s.tables.map((t) => ({ id: t.id, label: t.label, description: t.description })),
     buckets: (s.buckets ?? []).map((b) => ({ id: b.id, label: b.label, description: b.description })),
   }));
   return NextResponse.json({ sources });
}
