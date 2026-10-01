import { AdminShell } from "@/app/admin/_components/AdminShell";

export default function AdminDataLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
