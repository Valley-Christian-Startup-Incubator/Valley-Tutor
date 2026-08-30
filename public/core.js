const SESSION_KEY = "wc_session";

// Scrolls to and focuses the first invalid field in a form after a failed
// submit, instead of leaving the user staring at a form that silently did
// nothing (the field-level errors were already there — this just makes sure
// people whose first bad field is below the fold actually see one).
function scrollToFirstError(formEl) {
  if (!formEl) return;
  const firstBadField = formEl.querySelector(".has-error");
  if (!firstBadField) return;
  firstBadField.scrollIntoView({ behavior: "smooth", block: "center" });
  const input = firstBadField.querySelector("input, textarea, select");
  if (input) input.focus();
}

// Sessions live in sessionStorage only (per-tab), never localStorage, so two
// tabs in the same browser can stay logged in as two different people at
// once — e.g. a tutor and tutee demoing chat/video together. The tradeoff is
// a fresh tab always needs a login; there's no persistent "remember me"
// across browser restarts.
function getSession() {
  const raw = sessionStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

function startSession(token, user) {
  const value = JSON.stringify({ token, name: user.name, email: user.email, role: user.role });
  sessionStorage.setItem(SESSION_KEY, value);
}

function clearSession() {
  const session = getSession();
  sessionStorage.removeItem(SESSION_KEY);
  if (session?.token) {
    fetch("/api/auth/logout", { method: "POST", headers: { Authorization: `Bearer ${session.token}` } }).catch(() => {});
  }
}

function requireSession(redirectTo) {
  const session = getSession();
  if (!session) {
    window.location.href = redirectTo || "/login";
    return null;
  }
  return session;
}

// Every authenticated API call goes through here so the bearer token is
// never forgotten, and an expired/revoked token (401) reactively bounces
// back to login instead of the app silently failing.
async function authFetch(path, options = {}) {
  const session = getSession();
  const headers = { ...(options.headers || {}) };
  if (session?.token) headers.Authorization = `Bearer ${session.token}`;
  if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";

  const res = await fetch(path, { ...options, headers });
  if (res.status === 401) {
    clearSession();
    window.location.href = "/login";
    throw new Error("Session expired.");
  }
  return res;
}

async function authFetchJson(path, options) {
  const res = await authFetch(path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

// Reads a video file into a data URL, checking file size up front and clip
// length via its metadata — shared by the signup form's intro video upload
// and the profile page's re-upload, both capped around 30-45 seconds.
function readVideoWithChecks(file, { maxBytes = 20 * 1024 * 1024, minSeconds = 15, maxSeconds = 60 } = {}) {
  return new Promise((resolve, reject) => {
    if (file.size > maxBytes) {
      reject(new Error(`That video is too big for this prototype (${Math.round(maxBytes / (1024 * 1024))}MB max).`));
      return;
    }
    const url = URL.createObjectURL(file);
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      if (probe.duration < minSeconds || probe.duration > maxSeconds) {
        reject(new Error(`That's a ${Math.round(probe.duration)}s clip — aim for 30-45 seconds.`));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Couldn't read that file."));
      reader.readAsDataURL(file);
    };
    probe.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read that video file."));
    };
    probe.src = url;
  });
}
