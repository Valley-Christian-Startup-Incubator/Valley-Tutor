import type { Metadata } from "next";
import Script from "next/script";
import { BUILD_VERSION } from "../../lib/buildVersion";

export const metadata: Metadata = {
  title: "Video Session | Peer Tutoring",
};

export default function VideoPage() {
  return (
    <div className="call-body">
      <div id="call-error" className="call-error" style={{ display: "none" }}>
        <div className="call-error-card">
          <h2>Can&apos;t open this session</h2>
          <p id="call-error-text"></p>
          <a className="btn-primary btn-link" id="call-error-zoom" href="#" target="_blank" rel="noopener noreferrer" style={{ display: "none" }}>
            Join via Zoom Instead
          </a>
          <a className="btn-ghost btn-link" href="/app?tab=chats">Back to Chats</a>
        </div>
      </div>

      <div id="call-shell" className="call-shell" style={{ display: "none" }}>
        <header className="call-header">
          <div>
            <span className="call-partner" id="call-partner-name"></span>
            <span className="call-subject" id="call-subject"></span>
          </div>
          <div className="call-header-right">
            <span className="call-status" id="call-status">Setting up…</span>
            <button type="button" className="call-report-btn" id="call-report-btn">Report This Session</button>
          </div>
        </header>
        <p className="safety-banner">
          School rules apply here &middot; Report reaches Mr. Machado and Ms. Way &middot; Reported sessions can be reviewed
        </p>

        <main className="call-stage">
          <video id="remote-video" className="video-slot video-slot-main" autoPlay playsInline></video>
          <div className="waiting-overlay" id="waiting-overlay">
            <p id="waiting-text">Waiting for the other person to join…</p>
            <p className="waiting-hint">Demo tip: open this session in a second tab (or ask them to open their own tab) to test the call on this device.</p>
            <div className="zoom-fallback" id="zoom-fallback" style={{ display: "none" }}>
              <p className="zoom-fallback-text">Trouble connecting?</p>
              <a className="btn-primary btn-link" id="zoom-fallback-link" href="#" target="_blank" rel="noopener noreferrer">
                Join via Zoom Instead
              </a>
            </div>
          </div>
          <video id="local-video" className="video-slot video-slot-pip" autoPlay playsInline muted></video>
        </main>

        <footer className="call-controls">
          <button className="call-btn" id="toggle-mic" aria-pressed="false" aria-label="Mute microphone">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <path d="M12 19v4" />
            </svg>
          </button>
          <button className="call-btn" id="toggle-cam" aria-pressed="false" aria-label="Turn off camera">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M23 7l-7 5 7 5V7z" />
              <rect x="1" y="5" width="15" height="14" rx="2" />
            </svg>
          </button>
          <button className="call-btn call-btn-leave" id="leave-call" aria-label="Leave call">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a1 1 0 0 1 1.11-.21 12 12 0 0 0 3.76.6 1 1 0 0 1 1 1V19a1 1 0 0 1-1 1A17 17 0 0 1 3 5a1 1 0 0 1 1-1h2.97a1 1 0 0 1 1 1 12 12 0 0 0 .6 3.76 1 1 0 0 1-.25 1.11l-1.27 1.27a16 16 0 0 0 .63.66" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
            Leave
          </button>
        </footer>
      </div>

      <Script src={`/video.js?v=${BUILD_VERSION}`} strategy="afterInteractive" />
    </div>
  );
}
