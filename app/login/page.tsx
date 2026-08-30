import type { Metadata } from "next";
import Script from "next/script";
import { BUILD_VERSION } from "../../lib/buildVersion";

export const metadata: Metadata = {
  title: "Log In | Valley Christian Schools Peer Tutoring",
};

export default function LoginPage() {
  return (
    <div className="page">
      {/* Brand panel */}
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
            <h1>Every Warrior has something to teach&mdash;and something to learn.</h1>
            <p>Sign up as a tutor or tutee, get matched, and take it from there: chat, video call, and share files, all in one place.</p>
          </div>

          <ol className="brand-steps">
            <li><span className="step-num">1</span> Create your account as a tutor or tutee</li>
            <li><span className="step-num">2</span> Get matched based on subject and availability</li>
            <li><span className="step-num">3</span> Message, meet, and share files right here</li>
          </ol>
        </div>

        <p className="brand-verse">&ldquo;Do it heartily as to the Lord.&rdquo; &mdash; Col. 3:23</p>
      </section>

      {/* Form panel */}
      <section className="form-panel">
        <div className="auth-card">
          {/* Plain <a>, not next/link — see the note in app/app/page.tsx. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="back-home">&larr; Back to home</a>

          <div className="tabs" role="tablist" aria-label="Login or sign up">
            <button className="tab-btn active" id="tab-login" role="tab" aria-selected="true" aria-controls="form-login">Log In</button>
            <button className="tab-btn" id="tab-signup" role="tab" aria-selected="false" aria-controls="form-signup">Sign Up</button>
          </div>

          <div className="alert alert-error" id="alert-error" role="alert"></div>
          <div className="alert alert-success" id="alert-success" role="status"></div>

          {/* LOG IN */}
          <form className="auth-form active" id="form-login" noValidate>
            <h2>Welcome back</h2>
            <p className="lead">Log in to reach your tutor or tutee.</p>

            <div className="field" id="field-login-email">
              <label htmlFor="login-email">Email</label>
              <input type="email" id="login-email" autoComplete="email" placeholder="you@warriorlife.net" />
              <div className="field-error"></div>
            </div>

            <div className="field" id="field-login-password">
              <label htmlFor="login-password">Password</label>
              <div className="password-row">
                <input type="password" id="login-password" autoComplete="current-password" placeholder="Enter your password" />
                <button type="button" className="toggle-visibility" data-target="login-password" aria-label="Show password">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
              <div className="field-error"></div>
            </div>

            <div className="row-between" style={{ justifyContent: "flex-end" }}>
              <button type="button" className="link-btn" id="forgot-password">Forgot password?</button>
            </div>
            <p className="field-hint">Each browser tab keeps its own login — handy for testing a tutor and tutee side by side.</p>

            <button type="submit" className="btn-primary" id="login-submit">Log In</button>
          </form>

          {/* SIGN UP */}
          <form className="auth-form" id="form-signup" noValidate>
            <h2>Join Peer Tutoring</h2>
            <p className="lead">Tell us a bit about yourself to get started.</p>

            <div className="field">
              <label>I want to sign up as a&hellip;</label>
              <div className="role-select">
                <label className="role-option">
                  <input type="radio" name="role" value="tutor" id="role-tutor" defaultChecked />
                  <span className="role-card">
                    <svg className="role-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12 3 1 9l11 6 9-4.9V17" />
                      <path d="M5 10.8V16c0 1.5 3 3 7 3s7-1.5 7-3v-5.2" />
                    </svg>
                    <span className="role-title">Tutor</span>
                    <span className="role-desc">I want to help other students learn</span>
                  </span>
                </label>
                <label className="role-option">
                  <input type="radio" name="role" value="tutee" id="role-tutee" />
                  <span className="role-card">
                    <svg className="role-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                    <span className="role-title">Tutee</span>
                    <span className="role-desc">I&apos;m looking for help from a tutor</span>
                  </span>
                </label>
              </div>
            </div>

            <div className="field" id="field-signup-name">
              <label htmlFor="signup-name">Full name</label>
              <input type="text" id="signup-name" autoComplete="name" placeholder="Jordan Smith" />
              <div className="field-error"></div>
            </div>

            <div className="field">
              <label>Profile photo (optional)</label>
              <div className="avatar-upload">
                <div className="avatar-preview" id="signup-avatar-preview">
                  <img id="signup-avatar-preview-img" style={{ display: "none" }} alt="" />
                  <span id="signup-avatar-preview-initials">?</span>
                </div>
                <div className="avatar-upload-actions">
                  <button type="button" className="btn-ghost" id="signup-avatar-upload-btn">Upload Photo</button>
                  <button type="button" className="link-btn" id="signup-avatar-remove-btn" style={{ display: "none" }}>Remove</button>
                </div>
                <input type="file" id="signup-avatar-input" accept="image/*" hidden />
              </div>
            </div>

            <div className="field" id="field-signup-video" style={{ display: "none" }}>
              <label>30-45 second intro video (optional)</label>
              <input type="file" id="signup-video-input" accept="video/*" />
              <div className="field-hint" id="signup-video-hint">A short clip introducing yourself to prospective tutees. Under 20MB.</div>
              <div className="field-error" id="signup-video-error"></div>
            </div>

            <div className="field" id="field-signup-email">
              <label htmlFor="signup-email">School email</label>
              <input type="email" id="signup-email" autoComplete="email" placeholder="you@warriorlife.net" />
              <div className="field-hint">Use your Valley Christian school email.</div>
              <div className="field-error"></div>
            </div>

            <div className="field" id="field-signup-password">
              <label htmlFor="signup-password">Password</label>
              <div className="password-row">
                <input type="password" id="signup-password" autoComplete="new-password" placeholder="At least 8 characters" />
                <button type="button" className="toggle-visibility" data-target="signup-password" aria-label="Show password">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
              <div className="field-error"></div>
            </div>

            <div className="field" id="field-signup-confirm">
              <label htmlFor="signup-confirm">Confirm password</label>
              <div className="password-row">
                <input type="password" id="signup-confirm" autoComplete="new-password" placeholder="Re-enter your password" />
                <button type="button" className="toggle-visibility" data-target="signup-confirm" aria-label="Show password">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
              <div className="field-error"></div>
            </div>

            <label className="checkbox-row">
              <input type="checkbox" id="signup-terms" />
              I agree to be matched and contacted through Peer Tutoring
            </label>

            <button type="submit" className="btn-primary" id="signup-submit">Create Account</button>
          </form>

          <p className="switch-note" id="switch-login-note">
            New here? <button type="button" id="go-to-signup">Create an account</button>
          </p>
          <p className="switch-note" id="switch-signup-note" style={{ display: "none" }}>
            Already have an account? <button type="button" id="go-to-login">Log in</button>
          </p>

          <p className="footer-note">This is a local prototype &mdash; accounts are stored on this device only.</p>
        </div>
      </section>

      <Script src={`/auth.js?v=${BUILD_VERSION}`} strategy="afterInteractive" />
    </div>
  );
}
