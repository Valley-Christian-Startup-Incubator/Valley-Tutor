const USERS_KEY = "wc_users";
const SESSION_KEY = "wc_session";

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getUserByEmail(email) {
  return getUsers().find((u) => u.email === email);
}

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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

function startSession(user) {
  const value = JSON.stringify({ name: user.name, email: user.email, role: user.role });
  sessionStorage.setItem(SESSION_KEY, value);
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

function requireSession(redirectTo) {
  const session = getSession();
  if (!session) {
    window.location.href = redirectTo || "/login";
    return null;
  }
  return session;
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
