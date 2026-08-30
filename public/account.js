const me = requireSession("/login");

(function init() {
  if (!me) return;

  document.getElementById("account-email").value = me.email;
  document.getElementById("account-role-pill").textContent = me.role;

  const otherRole = me.role === "tutor" ? "tutee" : "tutor";
  const switchBtn = document.getElementById("account-switch-role-btn");
  switchBtn.textContent = `Switch to ${otherRole}`;
  switchBtn.addEventListener("click", async () => {
    if (!confirm(`Switch this account to a ${otherRole}? You'll see ${otherRole}-specific fields and tabs instead.`)) return;
    try {
      await authFetchJson("/api/profiles/me/role", { method: "PATCH", body: JSON.stringify({ role: otherRole }) });
    } catch (err) {
      alert(err.message);
      return;
    }
    startSession(me.token, { name: me.name, email: me.email, role: otherRole });
    window.location.href = "/app";
  });

  document.querySelectorAll(".toggle-visibility").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.target);
      const showing = input.type === "text";
      input.type = showing ? "password" : "text";
      btn.setAttribute("aria-label", showing ? "Show password" : "Hide password");
    });
  });

  const errorEl = document.getElementById("password-alert-error");
  const successEl = document.getElementById("password-alert-success");
  const form = document.getElementById("change-password-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.classList.remove("show");
    successEl.classList.remove("show");

    const currentPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;

    if (newPassword.length < 6) {
      errorEl.textContent = "New password must be at least 6 characters.";
      errorEl.classList.add("show");
      return;
    }

    try {
      await authFetchJson("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      successEl.textContent = "Password updated.";
      successEl.classList.add("show");
      form.reset();
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.add("show");
    }
  });
})();
