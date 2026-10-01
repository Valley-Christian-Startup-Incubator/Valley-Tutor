import { notFound } from "next/navigation";
import Link from "next/link";
import { getSource } from "@/lib/adminData/sources";
import { requireAuthRedirect } from "@/lib/adminSession";
import { BucketBrowser } from "@/app/admin/_components/BucketBrowser";

export default async function BucketPage({ params }: { params: Promise<{ source: string; bucket: string }> }) {
   await requireAuthRedirect();
   const { source, bucket } = await params;
   const s = getSource(source);
   if (!s) notFound();
   if (!(s.buckets ?? []).some((b) => b.id === bucket)) notFound();

   return (
        <>
           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h1>🗄 {s.buckets!.find((b) => b.id === bucket)?.label ?? bucket}</h1>
              <Link href={`/admin/data/sources/${source}`}>← {s.name}</Link>
           </div>
           <p className="sub">{s.buckets!.find((b) => b.id === bucket)?.description ?? "Storage bucket."}</p>
           <BucketBrowser sourceId={source} bucket={bucket} />
        </>
        );
}
