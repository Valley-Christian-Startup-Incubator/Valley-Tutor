# Valley Tutor

A peer tutoring web app prototype for Valley Christian Schools. Students sign up as a tutor or tutee, get matched, and (eventually) chat, video call, and share files — all in one place.

## Status

Front-end prototype: landing page, login/signup, and a post-login app with profile, matching, chat (with file sharing), session scheduling, and video calls. Accounts, profiles, chats, and sessions are stored in the browser's `localStorage` with SHA-256-hashed passwords — there's no real backend yet.

## Architecture

Everything runs in the browser. Pages are plain HTML with a stack of `<script>` tags — no bundler, no modules, no server beyond a static file host. `core.js` and `data.js` are the shared layer; each page adds its own controller on top.

```mermaid
graph TD
    subgraph pages["Pages"]
        index["index.html<br/><i>landing</i>"]
        login["login.html"]
        app["app.html<br/><i>profile · matching · chats · schedule</i>"]
        video["video.html"]
    end

    subgraph controllers["Page controllers"]
        authjs["auth.js<br/><i>signup, login, validation</i>"]
        appjs["app.js<br/><i>tab rendering, chat, scheduling</i>"]
        videojs["video.js<br/><i>WebRTC peer connection</i>"]
    end

    subgraph shared["Shared layer"]
        core["core.js<br/><i>users, password hashing, session</i>"]
        data["data.js<br/><i>profiles, chats, messages, sessions,<br/>course catalog + prereq graph</i>"]
    end

    subgraph browser["Browser APIs"]
        ls[("localStorage<br/><i>users, profiles, chats,<br/>messages, sessions</i>")]
        ss[("sessionStorage<br/><i>logged-in user, per tab</i>")]
        crypto["crypto.subtle<br/><i>SHA-256</i>"]
        bc_updates["BroadcastChannel<br/><b>wc_updates</b><br/><i>cross-tab refresh</i>"]
        bc_call["BroadcastChannel<br/><b>wc_call_&lt;id&gt;</b><br/><i>SDP + ICE signaling</i>"]
        media["getUserMedia +<br/>RTCPeerConnection"]
    end

    zoom["Zoom link<br/><i>manual fallback</i>"]

    index --> login
    login --> authjs
    app --> appjs
    video --> videojs

    authjs --> core
    appjs --> core
    appjs --> data
    videojs --> core
    videojs --> data

    core --> ls
    core --> ss
    core --> crypto
    data --> ls
    data --> bc_updates
    bc_updates -.->|"re-render"| appjs

    appjs -->|"session start time reached"| video
    videojs --> media
    videojs --> bc_call
    bc_call -.->|"offer / answer / candidates"| videojs
    videojs -.->|"no camera, or 25s timeout"| zoom
    appjs -.->|"Open Zoom Instead"| zoom

    authjs -->|"on success"| app
```

Two things to note. There is no request/response cycle anywhere — every "write" is a `localStorage` mutation, and other tabs learn about it through the `wc_updates` channel or the native `storage` event. And the video call signals over a `BroadcastChannel`, which only reaches tabs in the *same browser* — enough to demo a tutor and tutee side by side, but it is not a real signaling server.

## Pages

- `index.html` — marketing landing page
- `login.html` — log in / sign up (supports `?tab=signup` to open directly on the sign-up tab)
- `app.html` — the main app, with four tabs:
  - **Profile** — subjects, grade level, and availability
  - **Matching** — browse tutors/tutees by shared subject and start a chat
  - **Chats** — message threads with file sharing, plus an "Upcoming Sessions" sidebar (countdowns, a "Join Video Call" button once a session's time has come, and an "Open Zoom Instead" fallback link when the tutor set one)
  - **Schedule** (tutors only) — schedule a new session with a matched tutee, with an optional Zoom link as a fallback
- `video.html` — the embedded video call (WebRTC via `RTCPeerConnection`, signaled over `BroadcastChannel` for same-browser demo purposes). If the camera/mic can't be accessed, or the call can't connect within 25s, it offers the session's Zoom link as a fallback instead.

## Running locally

Static files, no build step. Serve the folder so `localStorage` behaves correctly (opening via `file://` can be flaky in some browsers):

```
python3 -m http.server 8934
```

Then visit `http://localhost:8934/index.html`.

## Branding

Colors, type, and logo usage follow the official Valley Christian Schools brand guidelines. Logo assets in `assets/` were extracted from the guidelines PDF for use on this prototype.

This is a student-built prototype, not an official VCS system.

## Roadmap

- Real backend + database for accounts (swap out the `localStorage` mock)
- Real signaling server for video calls (the current `BroadcastChannel` approach only works between tabs on the same device/browser)
- Real Zoom API integration for auto-generated meeting links, instead of tutors pasting their own
