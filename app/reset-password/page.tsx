import type { Metadata } from "next";
import Script from "next/script";
import { BUILD_VERSION } from "../../lib/buildVersion";

export const metadata: Metadata = {
  title: "Reset Password | Valley Christian Schools Peer Tutoring",
};

export default function ResetPasswordPage() {
  return (
    <div className="page">
      <section className="brand-panel">
        <div>
          <div className="brand-logo on-dark large">
            <img src="/assets/vcs-lockup-white.png" alt="Valley Christian Schools" />
            <span className="program-tag">
              Peer
              <br />
              Tutoring
            </span>
          </div>
          <div className="brand-copy">
            <h1>Set a new password.</h1>
          </div>
        </div>
      </section>

      <section className="form-panel">
        <div className="auth-card">
          <a href="/login" className="back-home">&larr; Back to log in</a>

          <div className="alert alert-error" id="alert-error" role="alert"></div>
          <div className="alert alert-success" id="alert-success" role="status"></div>

          <form className="auth-form active" id="reset-form" noValidate>
            <h2>Reset your password</h2>
            <p className="lead">Choose a new password for your account.</p>

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

            <button type="submit" className="btn-primary" id="reset-submit">Set New Password</button>
          </form>
        </div>
      </section>

      <Script src={`/reset-password.js?v=${BUILD_VERSION}`} strategy="afterInteractive" />
    </div>
  );
}
