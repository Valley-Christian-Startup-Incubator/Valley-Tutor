import type { Metadata } from "next";
import Script from "next/script";
import "../styles/styles.css";
import "../styles/app.css";
import "../styles/video.css";
import { BUILD_VERSION } from "../lib/buildVersion";

export const metadata: Metadata = {
  title: "Peer Tutoring | Valley Christian Schools",
  description: "A peer tutoring app for Valley Christian Schools.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* core.js/data.js are the shared "data layer" (talks to the real
            database via the API routes) that every page's own script
            (auth.js/app.js/video.js) depends on as plain globals — load them
            first, before the page hydrates. The ?v= param is a cache-buster:
            these have stable URLs and change on every deploy, so without it
            a browser (or CDN) with a cached copy from before a deploy has no
            way to know a new one exists until its cache TTL expires. */}
        <Script src={`/core.js?v=${BUILD_VERSION}`} strategy="beforeInteractive" />
        <Script src={`/data.js?v=${BUILD_VERSION}`} strategy="beforeInteractive" />
      </body>
    </html>
  );
}
