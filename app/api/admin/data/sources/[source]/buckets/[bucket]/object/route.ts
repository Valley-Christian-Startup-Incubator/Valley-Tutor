import { NextRequest, NextResponse } from "next/server";
import { getSource } from "@/lib/adminData/sources";
import { getObject } from "@/lib/adminData/db";
import { requireAuth } from "@/lib/adminSession";

// Streams a stored object (e.g. a signed PDF) to the authenticated browser.
// The service-role key is used server-side only.
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
   if (!path) return NextResponse.json({ error: "path required" }, { status: 400 });
   try {
     const { buffer, contentType } = await getObject(s, bucket, path);
     const body = buffer as unknown as BodyInit;
     return new NextResponse(body, {
       status: 200,
       headers: {
          "Content-Type": contentType,
          "Content-Length": String(buffer.length),
          "Cache-Control": "no-store",
          },
      });
   } catch (err) {
     return NextResponse.json({ error: (err as Error).message }, { status: 502 });
     }
}
