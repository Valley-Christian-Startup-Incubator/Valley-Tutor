import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root explicitly — otherwise Turbopack's root-detection
  // can get confused by unrelated lockfiles elsewhere on the machine.
  turbopack: {
    root: path.resolve(__dirname),
  },
  // This repo already has its own conventions; skip Next's auto-generated
  // AGENTS.md/CLAUDE.md.
  agentRules: false,
  // The legacy public/*.js pages are loaded by stable, unhashed URLs (unlike
  // Next's own /_next/static/* bundle chunks, which get a fresh hashed path
  // on every build and can safely cache forever). Without this, browsers
  // default to caching them for hours, so a redeploy that changes app
  // behavior — e.g. auth.js moving from localStorage to real API calls —
  // silently keeps running for anyone with a stale cached copy until their
  // cache expires. `no-cache` still lets the browser cache the body, but
  // forces a revalidation request on every load, so a new deploy is picked
  // up on the very next page visit instead of hours later.
  async headers() {
    return [
      {
        source: "/:file(core|data|auth|app|video|sign).js",
        headers: [{ key: "Cache-Control", value: "no-cache, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
