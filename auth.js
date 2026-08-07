const USERS_KEY = "wc_users";
const SESSION_KEY = "wc_session";

const tabLogin = document.getElementById("tab-login");
const tabSignup = document.getElementById("tab-signup");
const formLogin = document.getElementById("form-login");
const formSignup = document.getElementById("form-signup");
const switchLoginNote = document.getElementById("switch-login-note");
const switchSignupNote = document.getElementById("switch-signup-note");
const alertError = document.getElementById("alert-error");
const alertSuccess = document.getElementById("alert-success");

function showTab(which) {
  const isLogin = which === "login";
  tabLogin.classList.toggle("active", isLogin);
  tabSignup.classList.toggle("active", !isLogin);
  tabLogin.setAttribute("aria-selected", String(isLogin));
  tabSignup.setAttribute("aria-selected", String(!isLogin));
  formLogin.classList.toggle("active", isLogin);
  formSignup.classList.toggle("active", !isLogin);
  switchLoginNote.style.display = isLogin ? "block" : "none";
  switchSignupNote.style.display = isLogin ? "none" : "block";
  clearAlerts();
}

tabLogin.addEventListener("click", () => showTab("login"));
tabSignup.addEventListener("click", () => showTab("signup"));
document.getElementById("go-to-signup").addEventListener("click", () => showTab("signup"));
document.getElementById("go-to-login").addEventListener("click", () => showTab("login"));

document.querySelectorAll(".toggle-visibility").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.target);
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    btn.setAttribute("aria-label", showing ? "Show password" : "Hide password");
  });
});

document.getElementById("forgot-password").addEventListener("click", () => {
  clearAlerts();
  showSuccess("This is a local prototype, so password resets aren't wired up yet. Try creating a new account instead.");
});

function clearAlerts() {
  alertError.classList.remove("show");
  alertSuccess.classList.remove("show");
  alertError.textContent = "";
  alertSuccess.textContent = "";
}

function showError(message) {
  alertSuccess.classList.remove("show");
  alertError.textContent = message;
  alertError.classList.add("show");
}

function showSuccess(message) {
  alertError.classList.remove("show");
  alertSuccess.textContent = message;
  alertSuccess.classList.add("show");
}

function setFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  field.classList.toggle("has-error", Boolean(message));
  field.querySelector(".field-error").textContent = message || "";
}

function clearFieldErrors(ids) {
  ids.forEach((id) => setFieldError(id, ""));
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function startSession(user, remember) {
  const store = remember ? localStorage : sessionStorage;
  store.setItem(SESSION_KEY, JSON.stringify({ name: user.name, email: user.email, role: user.role }));
}

formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAlerts();
  clearFieldErrors(["field-login-email", "field-login-password"]);

  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;
  const remember = document.getElementById("login-remember").checked;

  let valid = true;
  if (!EMAIL_RE.test(email)) {
    setFieldError("field-login-email", "Enter a valid email address.");
    valid = false;
  }
  if (!password) {
    setFieldError("field-login-password", "Enter your password.");
    valid = false;
  }
  if (!valid) return;

  const submitBtn = document.getElementById("login-submit");
  submitBtn.disabled = true;

  const users = getUsers();
  const user = users.find((u) => u.email === email);
  const passwordHash = await hashPassword(password);

  if (!user || user.passwordHash !== passwordHash) {
    showError("That email and password don't match an account here.");
    submitBtn.disabled = false;
    return;
  }

  startSession(user, remember);
  showSuccess(`Welcome back, ${user.name.split(" ")[0]}! Taking you to your dashboard…`);
  setTimeout(() => {
    window.location.href = "dashboard.html";
  }, 700);
});

formSignup.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAlerts();
  clearFieldErrors(["field-signup-name", "field-signup-email", "field-signup-password", "field-signup-confirm"]);

  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim().toLowerCase();
  const password = document.getElementById("signup-password").value;
  const confirm = document.getElementById("signup-confirm").value;
  const role = document.querySelector('input[name="role"]:checked').value;
  const agreed = document.getElementById("signup-terms").checked;

  let valid = true;
  if (name.length < 2) {
    setFieldError("field-signup-name", "Enter your full name.");
    valid = false;
  }
  if (!EMAIL_RE.test(email)) {
    setFieldError("field-signup-email", "Enter a valid email address.");
    valid = false;
  }
  if (password.length < 8) {
    setFieldError("field-signup-password", "Use at least 8 characters.");
    valid = false;
  }
  if (confirm !== password) {
    setFieldError("field-signup-confirm", "Passwords don't match.");
    valid = false;
  }
  if (!agreed) {
    showError("Please agree to be matched and contacted through Warrior Connect.");
    valid = false;
  }
  if (!valid) return;

  const submitBtn = document.getElementById("signup-submit");
  submitBtn.disabled = true;

  const users = getUsers();
  if (users.some((u) => u.email === email)) {
    setFieldError("field-signup-email", "An account with this email already exists.");
    submitBtn.disabled = false;
    return;
  }

  const passwordHash = await hashPassword(password);
  const newUser = {
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash,
    role,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers(users);
  startSession(newUser, true);

  showSuccess(`Account created! Welcome to Warrior Connect, ${name.split(" ")[0]}.`);
  setTimeout(() => {
    window.location.href = "dashboard.html";
  }, 700);
});

(function redirectIfLoggedIn() {
  const existing = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
  if (existing) {
    window.location.href = "dashboard.html";
  }
})();

(function applyInitialTab() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("tab") === "signup") {
    showTab("signup");
  }
})();
