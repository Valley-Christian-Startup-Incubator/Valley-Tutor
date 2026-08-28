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

// ---------------- Signup: photo + intro video uploads ----------------

let signupPendingPhoto = "";
let signupPendingVideo = "";

const signupVideoField = document.getElementById("field-signup-video");
function updateSignupVideoField() {
  const role = document.querySelector('input[name="role"]:checked').value;
  signupVideoField.style.display = role === "tutor" ? "block" : "none";
  if (role !== "tutor") {
    signupPendingVideo = "";
    document.getElementById("signup-video-input").value = "";
    document.getElementById("signup-video-error").textContent = "";
  }
}
document.querySelectorAll('input[name="role"]').forEach((input) => {
  input.addEventListener("change", updateSignupVideoField);
});
updateSignupVideoField();

document.getElementById("signup-name").addEventListener("input", (e) => {
  const initialsEl = document.getElementById("signup-avatar-preview-initials");
  initialsEl.textContent = e.target.value.trim() ? initials(e.target.value.trim()) : "?";
});

function renderSignupAvatarPreview() {
  const img = document.getElementById("signup-avatar-preview-img");
  const initialsEl = document.getElementById("signup-avatar-preview-initials");
  const removeBtn = document.getElementById("signup-avatar-remove-btn");
  if (signupPendingPhoto) {
    img.src = signupPendingPhoto;
    img.style.display = "block";
    initialsEl.style.display = "none";
    removeBtn.style.display = "inline";
  } else {
    img.style.display = "none";
    initialsEl.style.display = "flex";
    removeBtn.style.display = "none";
  }
}

document.getElementById("signup-avatar-upload-btn").addEventListener("click", () => {
  document.getElementById("signup-avatar-input").click();
});
document.getElementById("signup-avatar-input").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const MAX_BYTES = 2 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    alert("That photo is too big for this prototype (2MB max). Try a smaller image.");
    e.target.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    signupPendingPhoto = reader.result;
    renderSignupAvatarPreview();
  };
  reader.readAsDataURL(file);
  e.target.value = "";
});
document.getElementById("signup-avatar-remove-btn").addEventListener("click", () => {
  signupPendingPhoto = "";
  renderSignupAvatarPreview();
});

document.getElementById("signup-video-input").addEventListener("change", (e) => {
  const file = e.target.files[0];
  const errorEl = document.getElementById("signup-video-error");
  errorEl.textContent = "";
  if (!file) return;

  readVideoWithChecks(file)
    .then((dataUrl) => {
      signupPendingVideo = dataUrl;
    })
    .catch((err) => {
      errorEl.textContent = err.message;
      e.target.value = "";
    });
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

formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAlerts();
  clearFieldErrors(["field-login-email", "field-login-password"]);

  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;

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

  let data;
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    data = await res.json();
    if (!res.ok) throw new Error(data.error || "That email and password don't match an account here.");
  } catch (err) {
    showError(err.message);
    submitBtn.disabled = false;
    return;
  }

  startSession(data.token, data.user);
  showSuccess(`Welcome back, ${data.user.name.split(" ")[0]}! Taking you to your dashboard…`);
  setTimeout(() => {
    window.location.href = "/app";
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
    showError("Please agree to be matched and contacted through Peer Tutoring.");
    valid = false;
  }
  if (!valid) return;

  const submitBtn = document.getElementById("signup-submit");
  submitBtn.disabled = true;

  let data;
  try {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not create your account.");
  } catch (err) {
    setFieldError("field-signup-email", err.message);
    submitBtn.disabled = false;
    return;
  }

  startSession(data.token, data.user);

  if (signupPendingPhoto || signupPendingVideo) {
    const profile = await getMyProfile();
    profile.photo = signupPendingPhoto;
    if (role === "tutor") profile.introVideo = signupPendingVideo;
    await saveMyProfile(profile);
  }

  showSuccess(`Account created! Welcome to Peer Tutoring, ${name.split(" ")[0]}.`);
  setTimeout(() => {
    window.location.href = "/sign-agreement";
  }, 700);
});

(function redirectIfLoggedIn() {
  if (getSession()) {
    window.location.href = "/app";
  }
})();

(function applyInitialTab() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("tab") === "signup") {
    showTab("signup");
  }
})();
