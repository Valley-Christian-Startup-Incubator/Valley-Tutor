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
    window.location.href = redirectTo || "login.html";
    return null;
  }
  return session;
}
