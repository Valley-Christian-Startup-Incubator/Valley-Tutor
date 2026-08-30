"use client";

import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// video.js (the legacy vanilla-JS call page) used to signal WebRTC offers/
// answers/ICE candidates over a same-device-only BroadcastChannel — that
// only relays between tabs of the same browser, so a real tutor and tutee
// on two separate computers could never actually connect. This bridges the
// same postMessage/onmessage interface video.js already expects onto a
// Supabase Realtime broadcast channel instead, which relays over the
// network. Declared as a global factory so the plain script can call it
// without needing a bundler of its own.
declare global {
  interface Window {
    createCallSignalChannel?: (sessionId: string) => {
      onmessage: ((event: { data: unknown }) => void) | null;
      postMessage: (data: unknown) => void;
      close: () => void;
    };
  }
}

export default function CallSignalBridge() {
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) return;

    const client = createClient(url, anonKey);

    window.createCallSignalChannel = (sessionId: string) => {
      const channel = client.channel(`call:${sessionId}`, {
        config: { broadcast: { self: false } },
      });

      const wrapper: {
        onmessage: ((event: { data: unknown }) => void) | null;
        postMessage: (data: unknown) => void;
        close: () => void;
      } = {
        onmessage: null,
        postMessage(data: unknown) {
          channel.send({ type: "broadcast", event: "signal", payload: data });
        },
        close() {
          client.removeChannel(channel);
        },
      };

      channel.on("broadcast", { event: "signal" }, ({ payload }) => {
        wrapper.onmessage?.({ data: payload });
      });
      channel.subscribe();

      return wrapper;
    };

    window.dispatchEvent(new Event("call-signal-ready"));

    return () => {
      delete window.createCallSignalChannel;
    };
  }, []);

  return null;
}
