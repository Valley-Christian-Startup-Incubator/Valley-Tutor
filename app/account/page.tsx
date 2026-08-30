import type { Metadata } from "next";
import Script from "next/script";
import { BUILD_VERSION } from "../../lib/buildVersion";

export const metadata: Metadata = {
  title: "Account | Valley Christian Schools Peer Tutoring",
};

export default function AccountPage() {
  return (
    <div className="app-body">
      <header className="app-topbar">
        <a href="/app" className="app-logo-link">
          <img src="/assets/vcs-lockup-navy.png" alt="Valley Christian Schools" className="app-logo" />
        </a>
        <a href="/app" className="link-btn">&larr; Back to app</a>
      </header>

      <main className="app-main">
        <section className="app-panel active">
          <div className="profile-shell-v2">
            <div className="profile-grid-single">
              <h1 className="profile-name" style={{ marginTop: 0 }}>Account</h1>

              <div className="profile-card">
                <h2>Your Info</h2>
                <div className="profile-field">
                  <label>School Email</label>
                  <input type="text" id="account-email" readOnly />
                </div>
                <div className="profile-field" style={{ marginBottom: 0 }}>
                  <label>Role</label>
                  <div className="row-between">
                    <span className="role-pill" id="account-role-pill"></span>
                    <button type="button" className="btn-ghost" id="account-switch-role-btn"></button>
                  </div>
                </div>
              </div>

              <div className="profile-card">
                <h2>Change Password</h2>
                <div className="alert alert-error" id="password-alert-error" role="alert"></div>
                <div className="alert alert-success" id="password-alert-success" role="status"></div>
                <form id="change-password-form" noValidate>
                  <div className="field" id="field-current-password">
                    <label htmlFor="current-password">Current Password</label>
                    <div className="password-row">
                      <input type="password" id="current-password" autoComplete="current-password" />
                      <button type="button" className="toggle-visibility" data-target="current-password" aria-label="Show password">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                    </div>
                    <div className="field-error"></div>
                  </div>
                  <div className="field" id="field-new-password">
                    <label htmlFor="new-password">New Password</label>
                    <div className="password-row">
                      <input type="password" id="new-password" autoComplete="new-password" placeholder="At least 6 characters" />
                      <button type="button" className="toggle-visibility" data-target="new-password" aria-label="Show password">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                    </div>
                    <div className="field-error"></div>
                  </div>
                  <button type="submit" className="btn-primary">Update Password</button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Script src={`/account.js?v=${BUILD_VERSION}`} strategy="afterInteractive" />
    </div>
  );
}
