import type { Metadata } from "next";
import Script from "next/script";
import "../styles/styles.css";
import "../styles/app.css";
import "../styles/video.css";

export const metadata: Metadata = {
  title: "Peer Tutoring | Valley Christian Schools",
  description: "A peer tutoring app for Valley Christian Schools.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* core.js/data.js are the shared localStorage-backed "data layer" that
            every page's own script (auth.js/app.js/video.js) depends on as
            plain globals — load them first, before the page hydrates. */}
        <Script src="/core.js" strategy="beforeInteractive" />
        <Script src="/data.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
