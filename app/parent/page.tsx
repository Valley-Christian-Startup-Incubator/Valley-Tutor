import type { Metadata } from "next";
import Script from "next/script";
import { BUILD_VERSION } from "../../lib/buildVersion";
import SiteFooter from "../SiteFooter";

export const metadata: Metadata = {
  title: "Parent Dashboard | Peer Tutoring",
};

export default function ParentPage() {
  return (
    <div className="app-body">
      <header className="app-topbar">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="app-logo-link">
          <img src="/assets/vcs-bei-logo.png" alt="VCS BEI — Business, Entrepreneurship & Innovation" className="app-logo" />
        </a>
        <div className="app-topbar-user">
          <span className="app-user-name" id="me-name"></span>
          <button className="link-btn" id="logout-btn">Log Out</button>
        </div>
      </header>

      <main className="app-main" style={{ flexDirection: "column", padding: 24, gap: 20, overflow: "auto" }}>
        <section className="profile-card">
          <h2>Link a Child</h2>
          <p className="profile-lead">Enter the invite code your child shared from their Account page.</p>
          <form id="link-child-form" className="chat-rate-form" style={{ maxWidth: 360 }}>
            <input type="text" id="link-code-input" placeholder="ABCD1234" maxLength={8} autoComplete="off" />
            <button type="submit" className="btn-primary">Link</button>
          </form>
          <p className="field-hint" id="link-child-hint"></p>
        </section>

        <section className="profile-card">
          <h2>Your Children</h2>
          <div id="parent-children-list"></div>
        </section>

        <section className="profile-card" id="parent-child-detail" style={{ display: "none" }}>
          <div className="row-between">
            <h2 id="parent-child-detail-name"></h2>
            <button type="button" className="link-btn" id="parent-child-detail-close">Close</button>
          </div>

          <nav className="app-tabs" role="tablist">
            <button className="app-tab active" id="pc-tab-chats" role="tab" aria-selected="true" data-tab="chats">Chats</button>
            <button className="app-tab" id="pc-tab-sessions" role="tab" aria-selected="false" data-tab="sessions">Sessions</button>
            <button className="app-tab" id="pc-tab-agreement" role="tab" aria-selected="false" data-tab="agreement">
              Agreement
              <span className="tab-badge tab-badge-alert" id="pc-agreement-badge" style={{ display: "none" }}></span>
            </button>
          </nav>

          <div className="app-panel active" id="pc-panel-chats">
            <div className="chats-shell">
              <aside className="chat-list-col">
                <div id="parent-chat-list" className="chat-list"></div>
              </aside>
              <section className="chat-thread-col">
                <div id="parent-chat-empty" className="chat-empty">
                  <p>Select a chat to view it.</p>
                </div>
                <div id="parent-chat-active" className="chat-active" style={{ display: "none" }}>
                  <div className="chat-thread-head" id="parent-chat-thread-head">
                    <div>
                      <h2 id="parent-chat-partner-name"></h2>
                      <span className="chat-subject" id="parent-chat-subject"></span>
                    </div>
                  </div>
                  <div className="chat-messages" id="parent-chat-messages"></div>
                  <form className="chat-composer" id="parent-chat-composer">
                    <input type="text" id="parent-message-input" placeholder="Type a message…" autoComplete="off" />
                    <button type="submit" className="btn-primary composer-send">Send</button>
                  </form>
                </div>
              </section>
            </div>
          </div>

          <div className="app-panel" id="pc-panel-sessions" style={{ display: "none" }}>
            <div id="parent-sessions-list" className="sessions-list"></div>
          </div>

          <div className="app-panel" id="pc-panel-agreement" style={{ display: "none" }}>
            <div id="parent-agreement-status" className="field-hint"></div>
            <form id="parent-agreement-form" style={{ display: "none" }}>
              <fieldset className="sign-block">
                <legend>Parent/Guardian</legend>
                <div className="field">
                  <label htmlFor="parent-agreement-name">Full name</label>
                  <input type="text" id="parent-agreement-name" autoComplete="name" placeholder="Your full name" />
                </div>
                <div className="field">
                  <label>Signature</label>
                  <div className="sig-pad-wrap">
                    <canvas id="parent-agreement-sig-canvas" className="sig-pad-canvas" width={500} height={130}></canvas>
                    <button type="button" className="link-btn sig-pad-clear" id="parent-agreement-sig-clear">Clear</button>
                  </div>
                </div>
              </fieldset>
              <button type="submit" className="btn-primary" id="parent-agreement-submit">Sign Agreement</button>
              <div className="field-error" id="parent-agreement-error"></div>
            </form>
          </div>
        </section>
      </main>

      <SiteFooter />

      <Script src={`/parent.js?v=${BUILD_VERSION}`} strategy="afterInteractive" />
    </div>
  );
}
