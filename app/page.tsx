export default function LandingPage() {
  return (
    <>
      <nav className="site-nav">
        <div className="brand-logo">
          <img src="/assets/vcs-lockup-color.png" alt="Valley Christian Schools" />
          <span className="program-tag">
            Peer
            <br />
            Tutoring
          </span>
        </div>
        <div className="nav-links">
          <a className="nav-link" href="#how-it-works">How It Works</a>
          <a className="nav-link" href="#features">Features</a>
          <a className="nav-link" href="#audience">Get Started</a>
        </div>
        <div className="nav-actions">
          <a className="btn-ghost" href="/login">Log In</a>
          <a className="btn-primary btn-link" href="/login?tab=signup">Sign Up</a>
        </div>
      </nav>

      <header className="hero">
        <img className="hero-logo" src="/assets/vcs-lockup-white.png" alt="Valley Christian Schools" />
        <p className="eyebrow">Peer Tutoring</p>
        <h1>Every Warrior has something to teach&mdash;and something to learn.</h1>
        <p className="hero-sub">
          Sign up as a tutor or tutee, get matched, and take it from there: chat, video call, and share files, all in one place.
        </p>
        <div className="hero-ctas">
          <a className="btn-primary btn-link" href="/login?tab=signup">Get Started</a>
          <a className="btn-outline" href="/login">Log In</a>
        </div>
      </header>

      <section className="section" id="how-it-works">
        <div className="section-head">
          <p className="eyebrow">How It Works</p>
          <h2>Three steps to your first session</h2>
          <p>No forms to chase down, no separate tools to juggle. Everything happens right here.</p>
        </div>
        <div className="steps-grid">
          <div className="step-card">
            <span className="step-num">1</span>
            <h3>Create your account</h3>
            <p>Sign up as a tutor or tutee and tell us the subjects you want to teach or learn.</p>
          </div>
          <div className="step-card">
            <span className="step-num">2</span>
            <h3>Get matched</h3>
            <p>We pair you with a Warrior based on subject and availability&mdash;no cold emails required.</p>
          </div>
          <div className="step-card">
            <span className="step-num">3</span>
            <h3>Start learning</h3>
            <p>Message, video call, and share files with your match, all in one place.</p>
          </div>
        </div>
      </section>

      <section className="section features-section" id="features">
        <div className="section-head">
          <p className="eyebrow">Features</p>
          <h2>Everything a tutoring session needs</h2>
          <p>Built so tutors and tutees never have to leave the page to get work done.</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </span>
            <h3>Smart Matching</h3>
            <p>Get paired with a tutor or tutee by subject and availability.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 4h16v12H7l-3 3V4z" />
              </svg>
            </span>
            <h3>Chat</h3>
            <p>Message your match to schedule sessions and ask quick questions.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M23 7l-7 5 7 5V7z" />
                <rect x="1" y="5" width="15" height="14" rx="2" />
              </svg>
            </span>
            <h3>Video Calls</h3>
            <p>Meet face-to-face for sessions without leaving the site.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21.4 11.6 12.6 20.4a4.5 4.5 0 0 1-6.4-6.4l9-8.9a3 3 0 0 1 4.2 4.2L10.5 18a1.5 1.5 0 0 1-2.1-2.1l7.8-7.8" />
              </svg>
            </span>
            <h3>File Sharing</h3>
            <p>Send worksheets, notes, and practice problems back and forth.</p>
          </div>
        </div>
      </section>

      <section className="section" id="audience">
        <div className="section-head">
          <p className="eyebrow">Get Started</p>
          <h2>Ready to connect with your next Warrior?</h2>
          <p>It takes less than a minute to create your account.</p>
        </div>
        <div className="audience-grid">
          <div className="audience-card dark">
            <span className="role-title">For Tutees</span>
            <h3>Get the help you need</h3>
            <ul>
              <li>Tell us what you&apos;re struggling with</li>
              <li>Choose a tutor in that subject yourself</li>
              <li>Chat, meet, and share files until it clicks</li>
            </ul>
            <a className="btn-primary btn-link" href="/login?tab=signup&role=tutee">Sign Up for Tutoring</a>
          </div>
          <div className="audience-card light">
            <span className="role-title">For Tutors</span>
            <h3>Share what you know</h3>
            <ul>
              <li>Set the subjects you&apos;re strong in</li>
              <li>Get chosen by tutees who need your help</li>
              <li>Build service hours while making an impact</li>
            </ul>
            <a className="btn-primary btn-link" href="/login?tab=signup&role=tutor">Sign Up to Tutor</a>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <img className="footer-logo" src="/assets/vcs-lockup-color-tagline.png" alt="Valley Christian Schools — Quest for Excellence" />
        <p className="footer-meta">Peer Tutoring &middot; Local prototype, not an official VCS system</p>
      </footer>
    </>
  );
}
