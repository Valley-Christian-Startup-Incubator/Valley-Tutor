# Valley Tutor

A peer tutoring web app prototype for Valley Christian Schools. Students sign up as a tutor or tutee, get matched, and (eventually) chat, video call, and share files — all in one place.

## Status

Front-end prototype: landing page, login/signup, and a placeholder post-login dashboard. Accounts are stored in the browser's `localStorage` with SHA-256-hashed passwords — there's no real backend yet.

## Pages

- `index.html` — marketing landing page
- `login.html` — log in / sign up (supports `?tab=signup` to open directly on the sign-up tab)
- `dashboard.html` — placeholder landing spot after login

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
- Tutor/tutee matching
- In-app chat
- Video calls
- File sharing
