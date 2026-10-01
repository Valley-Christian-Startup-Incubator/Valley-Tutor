import { notFound } from "next/navigation";
import Link from "next/link";
import { getSource } from "@/lib/adminData/sources";
import { requireAuthRedirect } from "@/lib/adminSession";

export default async function SourcePage({ params }: { params: Promise<{ source: string }> }) {
   await requireAuthRedirect();
   const { source } = await params;
   const s = getSource(source);
   if (!s) notFound();

   return (
        <>
           <h1>{s.name}</h1>
           <p className="sub">{s.description}</p>
           <h2>Tables</h2>
           <div className="grid">
              {s.tables.map((t) => (
                  <div className="card" key={t.id}>
                     <div className="title">{t.label}</div>
                     <div className="desc">{t.description ?? t.id}</div>
                     <Link href={`/admin/data/sources/${s.id}/tables/${t.id}`}>Browse rows →</Link>
                  </div>
                 ))}
           </div>
           {(s.buckets ?? []).length > 0 && (
               <>
                  <h2 style={{ marginTop: 28 }}>Storage</h2>
                  <div className="grid">
                     {s.buckets!.map((b) => (
                         <div className="card" key={b.id}>
                            <div className="title">🗄 {b.label ?? b.id}</div>
                            <div className="desc">{b.description ?? "Storage bucket."}</div>
                            <Link href={`/admin/data/sources/${s.id}/buckets/${b.id}`}>Browse objects →</Link>
                         </div>
                          ))}
                  </div>
               </>
              )}
        </>
        );
}
