import { NextRequest, NextResponse } from "next/server";
import { getSource } from "@/lib/adminData/sources";
import { listBucketObjects } from "@/lib/adminData/db";
import { requireAuth } from "@/lib/adminSession";

export async function GET(
   request: NextRequest,
   { params }: { params: Promise<{ source: string; bucket: string }> },
) {
   const denied = await requireAuth(request);
   if (denied) return denied;
   const { source, bucket } = await params;
   const s = getSource(source);
   if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });
   const prefix = new URL(request.url).searchParams.get("prefix") || "";
   try {
     const objects = await listBucketObjects(s, bucket, prefix);
     return NextResponse.json({ objects });
     } catch (err) {
     return NextResponse.json({ error: (err as Error).message }, { status: 502 });
     }
}
