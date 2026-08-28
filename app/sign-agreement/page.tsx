import type { Metadata } from "next";
import Script from "next/script";
import { BUILD_VERSION } from "../../lib/buildVersion";

export const metadata: Metadata = {
  title: "Sign Your Agreement | Peer Tutoring",
};

export default function SignAgreementPage() {
  return (
    <div className="page">
      <section className="form-panel" style={{ width: "100%" }}>
        <div className="auth-card" style={{ maxWidth: 720 }}>
          <h2 id="sign-agreement-heading">Before you begin</h2>
          <p className="lead" id="sign-agreement-lead"></p>

          <div className="alert alert-error" id="sign-agreement-error" role="alert"></div>

          <div className="agreement-preview-wrap">
            <iframe id="agreement-preview" title="Peer Tutoring Program Participation Agreement" className="agreement-preview-frame" />
          </div>

          <form id="sign-agreement-form" noValidate>
            <fieldset className="sign-block">
              <legend id="guardian-block-legend">Parent/Guardian</legend>
              <div className="field">
                <label htmlFor="guardian-name-input">Full name</label>
                <input type="text" id="guardian-name-input" autoComplete="name" placeholder="Parent/guardian's full name" />
              </div>
              <div className="field">
                <label>Signature</label>
                <div className="sig-pad-wrap">
                  <canvas id="guardian-sig-canvas" className="sig-pad-canvas" width={500} height={130}></canvas>
                  <button type="button" className="link-btn sig-pad-clear" id="guardian-sig-clear">Clear</button>
                </div>
              </div>
            </fieldset>

            <fieldset className="sign-block">
              <legend id="student-block-legend">Student</legend>
              <div className="field">
                <label htmlFor="student-name-input">Full name</label>
                <input type="text" id="student-name-input" autoComplete="name" placeholder="Your full name" />
              </div>
              <div className="field">
                <label>Signature</label>
                <div className="sig-pad-wrap">
                  <canvas id="student-sig-canvas" className="sig-pad-canvas" width={500} height={130}></canvas>
                  <button type="button" className="link-btn sig-pad-clear" id="student-sig-clear">Clear</button>
                </div>
              </div>
            </fieldset>

            <div className="field">
              <label>Date</label>
              <div id="sign-date-display" className="sign-date-display"></div>
            </div>

            <button type="submit" className="btn-primary" id="sign-agreement-submit">Sign &amp; Continue</button>
          </form>

          <p className="footer-note">
            By signing, both the Parent/Guardian and the Student agree to the terms above. You&apos;ll be able to download your
            completed, signed copy immediately after submitting.
          </p>
        </div>
      </section>

      <Script src={`/sign.js?v=${BUILD_VERSION}`} strategy="afterInteractive" />
    </div>
  );
}
