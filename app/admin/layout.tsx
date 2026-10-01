import type { Metadata } from "next";
import "./admin-data.css";

export const metadata: Metadata = {
  title: "Admin | Peer Tutoring",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
