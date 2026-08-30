const alertError = document.getElementById("alert-error");
const alertSuccess = document.getElementById("alert-success");

function clearAlerts() {
  alertError.classList.remove("show");
  alertSuccess.classList.remove("show");
}
function showError(message) {
  alertError.textContent = message;
  alertError.classList.add("show");
}
function showSuccess(message) {
  alertSuccess.textContent = message;
  alertSuccess.classList.add("show");
}

document.querySelectorAll(".toggle-visibility").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.target);
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    btn.setAttribute("aria-label", showing ? "Show password" : "Hide password");
  });
});

const token = new URLSearchParams(window.location.search).get("token");
const form = document.getElementById("reset-form");
const submitBtn = document.getElementById("reset-submit");

if (!token) {
  showError("This reset link is missing its token. Request a new one from the login page.");
  submitBtn.disabled = true;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAlerts();
  const newPassword = document.getElementById("new-password").value;
  if (newPassword.length < 6) {
    showError("Password must be at least 6 characters.");
    return;
  }
  try {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Something went wrong.");
    showSuccess("Password updated. Redirecting to log in…");
    form.reset();
    setTimeout(() => {
      window.location.href = "/login";
    }, 1500);
  } catch (err) {
    showError(err.message);
  }
});
