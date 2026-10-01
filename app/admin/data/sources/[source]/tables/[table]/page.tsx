import { notFound } from "next/navigation";
import Link from "next/link";
import { getTable } from "@/lib/adminData/sources";
import { requireAuthRedirect } from "@/lib/adminSession";
import { TableBrowser } from "@/app/admin/_components/TableBrowser";

export default async function TablePage({
   params,
}: {
   params: Promise<{ source: string; table: string }>;
}) {
   await requireAuthRedirect();
   const { source, table } = await params;
   const found = getTable(source, table);
   if (!found) notFound();
   const { source: s, table: t } = found;
   const pdfCol = t.columns.find((c) => c.kind === "pdf");

   return (
        <>
           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div>
                 <h1>{t.label}</h1>
                 <p className="muted" style={{ margin: 0 }}>
                    <Link href={`/admin/data/sources/${s.id}`}>{s.name}</Link> · {t.id}
                 </p>
              </div>
           </div>
           {t.description && <p className="sub">{t.description}</p>}
           <TableBrowser
             sourceId={s.id}
             tableId={t.id}
             columns={t.columns}
             filters={t.filters}
             defaultSort={t.primary || t.columns[0]?.key || "id"}
             pdf={pdfCol ? { bucket: pdfCol.bucket!, pathColumn: pdfCol.key } : undefined}
               />
        </>
        );
}
