import { NextRequest, NextResponse } from "next/server";
import { getSource } from "@/lib/adminData/sources";
import { getSignedUrl } from "@/lib/adminData/db";
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
   const path = new URL(request.url).searchParams.get("path");
   const expiresIn = Number(new URL(request.url).searchParams.get("expiresIn") || "300");
   if (!path) return NextResponse.json({ error: "path required" }, { status: 400 });
   try {
     const url = await getSignedUrl(s, bucket, path, expiresIn);
     return NextResponse.json({ url });
     } catch (err) {
     return NextResponse.json({ error: (err as Error).message }, { status: 502 });
     }
}
