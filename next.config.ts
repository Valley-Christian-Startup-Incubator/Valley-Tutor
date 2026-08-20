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
};

export default nextConfig;
