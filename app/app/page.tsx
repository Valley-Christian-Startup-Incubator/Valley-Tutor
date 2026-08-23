import Script from "next/script";

export default function AppPage() {
  return (
    <div className="app-body">
      <header className="app-topbar">
        {/* Deliberately a plain <a>, not next/link: the page's own JS
            (public/app.js) expects a fresh script execution on every visit,
            which a full navigation guarantees and client-side routing doesn't. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="app-logo-link">
          <img src="/assets/vcs-lockup-navy.png" alt="Valley Christian Schools" className="app-logo" />
        </a>
        <div className="app-topbar-user">
          <span className="app-user-name" id="me-name"></span>
          <button className="profile-icon-btn" id="profile-icon-btn" aria-label="Your profile">
            <img id="header-avatar-img" className="profile-icon-img" style={{ display: "none" }} alt="" />
            <span id="header-avatar-initials" className="profile-icon-initials"></span>
          </button>
        </div>
      </header>

      <nav className="app-tabs" role="tablist">
        <button className="app-tab" id="tab-matching" role="tab" aria-selected="false" style={{ display: "none" }}>Matching</button>
        <button className="app-tab" id="tab-chats" role="tab" aria-selected="false">
          Chats
          <span className="tab-badge" id="chats-tab-badge" style={{ display: "none" }}></span>
        </button>
        <button className="app-tab" id="tab-schedule" role="tab" aria-selected="false" style={{ display: "none" }}>Schedule</button>
      </nav>

      <main className="app-main">
        {/* PROFILE TAB (opened via the header icon, not a nav tab) */}
        <section className="app-panel" id="panel-profile">
          <div className="profile-shell-v2">
            <div className="alert alert-success" id="profile-alert" role="status"></div>

            <form id="profile-form">
              <div className="profile-grid">
                {/* LEFT COLUMN */}
                <div className="profile-col-left">
                  <div className="profile-card">
                    <div className="avatar-upload">
                      <div className="avatar-preview" id="avatar-preview">
                        <img id="avatar-preview-img" style={{ display: "none" }} alt="" />
                        <span id="avatar-preview-initials"></span>
                      </div>
                      <div className="avatar-upload-actions">
                        <button type="button" className="btn-ghost" id="avatar-upload-btn">Change Photo</button>
                        <button type="button" className="link-btn" id="avatar-remove-btn" style={{ display: "none" }}>Remove</button>
                      </div>
                      <input type="file" id="avatar-input" accept="image/*" hidden />
                    </div>

                    <h2 className="profile-name" id="profile-name-heading"></h2>
                    <p className="profile-subtitle" id="profile-subtitle"></p>

                    <div className="profile-field">
                      <label htmlFor="bio-input">Bio</label>
                      <textarea id="bio-input" rows={4} maxLength={400} placeholder="Tell people a bit about yourself…"></textarea>
                      <p className="field-hint" id="bio-hint"></p>
                    </div>

                    <div className="profile-field" id="class-year-field">
                      <label>Your Class</label>
                      <div className="chip-grid" id="class-year-grid"></div>
                    </div>

                    <div className="profile-field" id="grade-level-field">
                      <label id="grade-label">Grade Level</label>
                      <div className="chip-grid" id="grade-grid"></div>
                    </div>
                  </div>

                  <div className="profile-card">
                    <h2>Details</h2>

                    <div className="profile-field" id="intro-video-field">
                      <label>Intro Video</label>
                      <video id="intro-video-preview" className="intro-video-preview" controls style={{ display: "none" }}></video>
                      <input type="file" id="intro-video-input" accept="video/*" hidden />
                      <div className="intro-video-actions">
                        <button type="button" className="btn-ghost" id="intro-video-upload-btn">Upload Video</button>
                        <button type="button" className="link-btn" id="intro-video-remove-btn" style={{ display: "none" }}>Remove</button>
                      </div>
                      <p className="field-hint">30-45 seconds, introducing yourself to prospective tutees.</p>
                      <div className="field-error" id="intro-video-error"></div>
                    </div>

                    <div className="profile-field" id="rate-field">
                      <label htmlFor="rate-input">Rate</label>
                      <input type="text" id="rate-input" placeholder="e.g. $20/hr, or free during Warrior Time" />
                    </div>

                    <div className="profile-field" id="tutoring-hours-field">
                      <label htmlFor="tutoring-hours-input">Tutoring Hours (self-reported)</label>
                      <input type="number" id="tutoring-hours-input" min={0} step={1} placeholder="e.g. 25" />
                    </div>

                    <div className="profile-field" id="offer-field">
                      <label htmlFor="offer-input">What are you offering to pay?</label>
                      <input type="text" id="offer-input" placeholder="e.g. $15/hr, or open to whatever's fair" />
                    </div>

                    <div className="profile-field" id="payment-methods-field">
                      <label>Payment Methods</label>
                      <div className="chip-grid" id="payment-methods-grid"></div>
                      <input type="text" id="payment-handle-input" className="payment-handle-input" placeholder="Venmo/Zelle/PayPal username (optional)" />
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="profile-col-right">
                  <div className="profile-card">
                    <div className="avail-card-head">
                      <h2>When You&apos;re Free</h2>
                      <span className="field-hint">Tap to toggle</span>
                    </div>
                    <div className="avail-locations" id="avail-locations"></div>
                    <div className="availability-grid" id="availability-grid"></div>
                  </div>

                  <div className="profile-card">
                    <h2 id="course-browser-heading">Classes</h2>
                    <p className="profile-lead" id="course-browser-lead"></p>

                    <div className="course-search-row">
                      <input type="text" id="course-search-input" autoComplete="off" />
                      <button type="button" className="btn-ghost" id="course-search-clear">Clear</button>
                    </div>

                    <div className="taken-summary">
                      <span className="taken-summary-count" id="taken-summary-count"></span>
                      <div className="course-tags" id="taken-summary-tags"></div>
                    </div>

                    <div className="course-categories" id="course-categories"></div>

                    <div className="qualified-panel" id="qualified-panel" style={{ display: "none" }}>
                      <button type="button" className="qualified-toggle" id="qualified-toggle">
                        <span className="qualified-toggle-text">
                          <span className="qualified-toggle-title" id="qualified-toggle-title"></span>
                          <span className="qualified-toggle-sub">Derived from prerequisites — no need to list them yourself.</span>
                        </span>
                        <svg className="qualified-chevron" id="qualified-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </button>
                      <div className="qualified-list" id="qualified-list" style={{ display: "none" }}></div>
                    </div>
                  </div>

                  <div className="profile-card" id="tutor-comments-card" style={{ display: "none" }}>
                    <h2>What Tutees Are Saying</h2>
                    <p className="profile-lead">Public feedback from tutees you&apos;ve worked with.</p>
                    <div id="tutor-comments-list"></div>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-primary profile-save-btn">Save Profile</button>
            </form>

            <div className="profile-footer">
              <button className="btn-ghost app-logout" id="logout-btn">Log Out</button>
              <span className="role-pill" id="me-role-pill"></span>
            </div>
          </div>
        </section>

        {/* MATCHING TAB */}
        <section className="app-panel" id="panel-matching">
          <div className="matching-shell">
            <div className="matching-hero">
              <div className="matching-hero-top">
                <div>
                  <h1 id="matching-heading">Find a Tutor</h1>
                  <p className="matching-hero-lead" id="matching-lead">Filter and sort by class, availability, and rate — you choose who to chat with.</p>
                </div>
                <div className="matching-filters">
                  <select id="matching-department-filter">
                    <option value="">All departments</option>
                  </select>
                  <select id="matching-availability-filter">
                    <option value="">Any availability</option>
                  </select>
                  <select id="matching-sort-filter">
                    <option value="shared">Most classes shared</option>
                    <option value="rate">Lowest rate first</option>
                    <option value="hours">Most experience</option>
                  </select>
                </div>
              </div>
              <div className="matching-stats" id="matching-stats"></div>
            </div>

            <div className="matching-legend">
              <span className="match-subject-chip shared">Shared</span>
              <span id="matching-legend-text"></span>
            </div>

            <div id="matching-list" className="matching-list"></div>
          </div>
        </section>

        {/* CHATS TAB */}
        <section className="app-panel" id="panel-chats">
          <div className="chats-shell">
            <aside className="chat-list-col">
              <div className="chat-list-head">
                <h2>Chats</h2>
              </div>
              <div id="chat-list" className="chat-list"></div>
            </aside>

            <section className="chat-thread-col">
              <div id="chat-empty" className="chat-empty">
                <p id="chat-empty-text">Select a chat to get going.</p>
              </div>
              <div id="chat-active" className="chat-active" style={{ display: "none" }}>
                <div className="chat-thread-head" id="chat-thread-head">
                  <div>
                    <h2 id="chat-partner-name"></h2>
                    <span className="chat-subject" id="chat-subject"></span>
                    <div className="chat-agreed-rate" id="chat-agreed-rate">
                      <span id="chat-agreed-rate-text"></span>
                      <button type="button" className="link-btn" id="chat-agreed-rate-btn">Set Rate</button>
                    </div>
                    <form className="chat-agreed-rate-form" id="chat-agreed-rate-form" style={{ display: "none" }}>
                      <input type="text" id="chat-agreed-rate-input" placeholder="e.g. $15/hr" autoComplete="off" />
                      <button type="submit" className="btn-ghost">Save</button>
                      <button type="button" className="link-btn" id="chat-agreed-rate-cancel">Cancel</button>
                    </form>
                  </div>
                  <button className="btn-ghost" id="schedule-btn" style={{ display: "none" }}>Schedule Session</button>
                </div>
                <div className="chat-messages" id="chat-messages"></div>
                <div className="chat-attach-preview" id="chat-attach-preview" style={{ display: "none" }}></div>
                <form className="chat-composer" id="chat-composer">
                  <button type="button" className="composer-attach" id="attach-btn" aria-label="Attach a file">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M21.4 11.6 12.6 20.4a4.5 4.5 0 0 1-6.4-6.4l9-8.9a3 3 0 0 1 4.2 4.2L10.5 18a1.5 1.5 0 0 1-2.1-2.1l7.8-7.8" />
                    </svg>
                  </button>
                  <input type="file" id="file-input" hidden />
                  <input type="text" id="message-input" placeholder="Type a message…" autoComplete="off" />
                  <button type="submit" className="btn-primary composer-send">Send</button>
                </form>
              </div>
            </section>

            <aside className="sessions-col">
              <h2>Upcoming Sessions</h2>
              <div id="sessions-list" className="sessions-list"></div>
            </aside>
          </div>
        </section>

        {/* SCHEDULE TAB (tutors only) */}
        <section className="app-panel" id="panel-schedule">
          <div className="schedule-shell">
            <h1>Schedule a Session</h1>
            <p className="profile-lead">Pick a tutee you&apos;re matched with, then choose a time. Add a Zoom link as a backup in case the embedded video call can&apos;t connect.</p>

            <form id="schedule-tab-form">
              <div className="profile-field">
                <label htmlFor="schedule-tutee-select">Tutee</label>
                <select id="schedule-tutee-select"></select>
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="schedule-tab-date">Date</label>
                  <input type="date" id="schedule-tab-date" required />
                </div>
                <div className="field">
                  <label htmlFor="schedule-tab-time">Time</label>
                  <input type="time" id="schedule-tab-time" required />
                </div>
                <div className="field">
                  <label htmlFor="schedule-tab-duration">Duration</label>
                  <select id="schedule-tab-duration">
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label htmlFor="schedule-tab-zoom">Zoom link (optional fallback)</label>
                <input type="url" id="schedule-tab-zoom" placeholder="https://zoom.us/j/..." />
              </div>

              <div className="field-error" id="schedule-tab-error"></div>
              <button type="submit" className="btn-primary" style={{ maxWidth: "220px" }}>Schedule Session</button>
            </form>

            <div className="schedule-upcoming">
              <h2>Sessions You&apos;ve Scheduled</h2>
              <div id="schedule-upcoming-list" className="sessions-list"></div>
            </div>
          </div>
        </section>
      </main>

      {/* Image lightbox: clicking a shared photo in chat opens it here instead of downloading it. */}
      <div className="modal-overlay lightbox-overlay" id="image-lightbox">
        <button className="lightbox-close" id="lightbox-close" aria-label="Close">&times;</button>
        <img className="lightbox-img" id="lightbox-img" alt="" />
      </div>

      {/* Candidate profile preview, opened from the Matching tab. */}
      <div className="modal-overlay" id="candidate-profile-modal">
        <div className="modal">
          <div className="modal-head">
            <h3 id="candidate-profile-name"></h3>
            <button className="modal-close" id="candidate-profile-close" aria-label="Close">&times;</button>
          </div>
          <div className="modal-body">
            <div className="candidate-profile-top">
              <div className="avatar-preview" id="candidate-profile-avatar">
                <img id="candidate-profile-avatar-img" style={{ display: "none" }} alt="" />
                <span id="candidate-profile-avatar-initials"></span>
              </div>
              <p className="candidate-profile-subtitle" id="candidate-profile-subtitle"></p>
            </div>
            <video id="candidate-profile-video" className="intro-video-preview" controls style={{ display: "none" }}></video>
            <p className="candidate-profile-bio" id="candidate-profile-bio"></p>

            <div className="candidate-profile-section" id="candidate-profile-extra-section" style={{ display: "none" }}>
              <h4 id="candidate-profile-extra-label"></h4>
              <div id="candidate-profile-extra"></div>
            </div>

            <div className="candidate-profile-section">
              <h4 id="candidate-profile-courses-label"></h4>
              <div className="course-tags" id="candidate-profile-courses"></div>
            </div>

            <button type="button" className="btn-primary" id="candidate-profile-chat-btn" style={{ maxWidth: "none" }}>Start Chat</button>

            <div className="candidate-profile-section" id="candidate-profile-comments-section">
              <h4>Feedback</h4>
              <div id="candidate-profile-comments-list"></div>
              <form id="candidate-comment-form">
                <textarea id="candidate-comment-input" rows={3} maxLength={500} placeholder="Share feedback about this tutor…"></textarea>
                <button type="submit" className="btn-ghost candidate-comment-submit">Post Feedback</button>
                <p className="field-hint" id="candidate-comment-hint"></p>
              </form>
            </div>
          </div>
        </div>
      </div>

      <Script src="/app.js" strategy="afterInteractive" />
    </div>
  );
}
