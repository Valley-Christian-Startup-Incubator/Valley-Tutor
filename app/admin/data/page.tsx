import { redirect } from "next/navigation";
import { requireAuthRedirect } from "@/lib/adminSession";

// The databases list lives on the /admin home page.
export default async function AdminDataIndex() {
  await requireAuthRedirect();
  redirect("/admin");
}
