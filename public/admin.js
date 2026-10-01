// Staff tools for /admin/staff. Access is the shared password-only admin
// session (an httpOnly cookie sent automatically on same-origin requests),
// not the student app's per-tab bearer-token login.
async function adminFetchJson(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  const res = await fetch(path, { ...options, headers, credentials: "same-origin" });
  if (res.status === 401) {
    window.location.href = "/admin/login";
    throw new Error("Session expired.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

init();

async function init() {
  let isAdmin = true;
  try {
    const me = await adminFetchJson("/api/admin/me");
    document.getElementById("admin-email").textContent = me.email || "";
  } catch (err) {
    isAdmin = false;
  }

  if (!isAdmin) {
    document.getElementById("admin-denied").style.display = "block";
    return;
  }

  document.getElementById("admin-main").style.display = "block";

  document.getElementById("admin-tab-reports").addEventListener("click", () => showAdminTab("reports"));
  document.getElementById("admin-tab-users").addEventListener("click", () => showAdminTab("users"));

  renderReports();
  renderUsers();
}

function showAdminTab(which) {
  ["reports", "users"].forEach((name) => {
    document.getElementById(`admin-tab-${name}`).classList.toggle("active", name === which);
    document.getElementById(`admin-panel-${name}`).classList.toggle("active", name === which);
  });
}

async function renderReports() {
  const list = document.getElementById("admin-reports-list");
  let reports;
  try {
    reports = await adminFetchJson("/api/admin/reports");
  } catch (err) {
    list.innerHTML = `<p class="admin-empty">Could not load reports: ${escapeHtml(err.message)}</p>`;
    return;
  }

  if (reports.length === 0) {
    list.innerHTML = `<p class="admin-empty">No reports.</p>`;
    return;
  }

  list.innerHTML = reports
    .map((r) => {
      const messagesHtml = (r.snapshot?.messages || [])
        .slice(-15)
        .map(
          (m) => `<div class="admin-snapshot-msg"><strong>${escapeHtml(m.sender)}:</strong> ${escapeHtml(m.text || "(attachment)")} <span class="admin-snapshot-time">${formatDateTime(m.timestamp)}</span></div>`
        )
        .join("");
      return `
        <div class="admin-card ${r.status === "reviewed" ? "admin-card-reviewed" : ""}">
          <div class="admin-card-head">
            <span class="admin-report-type">${escapeHtml(r.type.replace("_", " "))}</span>
            <span class="admin-report-status">${r.status}</span>
          </div>
          <p><strong>${escapeHtml(r.reporterName || r.reporterEmail)}</strong> reported <strong>${escapeHtml(r.reportedName || r.reportedEmail || "unknown")}</strong></p>
          ${r.reason ? `<p class="admin-report-reason">"${escapeHtml(r.reason)}"</p>` : ""}
          <p class="admin-report-meta">${formatDateTime(r.createdAt)} &middot; Subject: ${escapeHtml(r.snapshot?.chat?.subject || "General tutoring")}</p>
          <details>
            <summary>View snapshot (${(r.snapshot?.messages || []).length} messages)</summary>
            <div class="admin-snapshot">${messagesHtml || "<p>No messages.</p>"}</div>
          </details>
          ${r.status === "open" ? `<button type="button" class="btn-ghost admin-review-btn" data-id="${r.id}">Mark Reviewed</button>` : `<p class="admin-report-meta">Reviewed by ${escapeHtml(r.reviewedBy || "")} on ${formatDateTime(r.reviewedAt)}</p>`}
        </div>`;
    })
    .join("");

  list.querySelectorAll(".admin-review-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      try {
        await adminFetchJson(`/api/admin/reports/${btn.dataset.id}`, { method: "PATCH" });
        renderReports();
      } catch (err) {
        alert(err.message);
        btn.disabled = false;
      }
    });
  });
}

async function renderUsers() {
  const list = document.getElementById("admin-users-list");
  let users;
  try {
    users = await adminFetchJson("/api/admin/users");
  } catch (err) {
    list.innerHTML = `<p class="admin-empty">Could not load users: ${escapeHtml(err.message)}</p>`;
    return;
  }

  list.innerHTML = users
    .map(
      (u) => `
      <div class="admin-card ${u.disabled ? "admin-card-disabled" : ""}">
        <div class="admin-card-head">
          <span>${escapeHtml(u.name)} &middot; ${escapeHtml(u.email)}</span>
          <span class="admin-report-status">${u.role}</span>
        </div>
        <p class="admin-report-meta">Joined ${formatDateTime(u.created_at)}${u.disabled ? " — DISABLED" : ""}</p>
        <button type="button" class="btn-ghost admin-toggle-disabled-btn" data-email="${escapeHtml(u.email)}" data-disabled="${u.disabled}">
          ${u.disabled ? "Re-enable account" : "Disable account"}
        </button>
      </div>`
    )
    .join("");

  list.querySelectorAll(".admin-toggle-disabled-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const nextDisabled = btn.dataset.disabled !== "true";
      if (nextDisabled && !confirm(`Disable ${btn.dataset.email}? They won't be able to log in.`)) return;
      btn.disabled = true;
      try {
        await adminFetchJson(`/api/admin/users/${encodeURIComponent(btn.dataset.email)}`, {
          method: "PATCH",
          body: JSON.stringify({ disabled: nextDisabled }),
        });
        renderUsers();
      } catch (err) {
        alert(err.message);
        btn.disabled = false;
      }
    });
  });
}

function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) + " · " + d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}
