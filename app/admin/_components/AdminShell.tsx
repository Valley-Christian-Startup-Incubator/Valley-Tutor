import { TopBar } from "./TopBar";

// Page chrome for the /admin home and data pages (the former Data Admin layout).
export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mm-admin">
      <TopBar />
      <main>
        <div className="wrap">{children}</div>
      </main>
      <div className="footer">
        Valley Christian · Admin · {new Date().getFullYear()}
      </div>
    </div>
  );
}
