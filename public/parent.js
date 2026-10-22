const me = requireSession("/login");

if (me && me.role !== "parent") {
  window.location.href = "/app";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) + " · " + formatTime(iso);
}

if (me) {
  document.getElementById("me-name").textContent = me.name;
  document.getElementById("logout-btn").addEventListener("click", () => {
    clearSession();
    window.location.href = "/";
  });

  let activeChild = null; // { email, name }
  let activeChildChatId = null;

  async function renderChildrenList() {
    const children = await getParentLinks();
    const listEl = document.getElementById("parent-children-list");
    listEl.innerHTML = children.length
      ? children
          .map(
            (c) => `
          <div class="session-card">
            <span class="session-partner">${escapeHtml(c.name)}</span>
            <span class="session-subject">${c.profile?.gradeLevel ? `Grade ${escapeHtml(c.profile.gradeLevel)}` : "Tutee"}</span>
            <button type="button" class="btn-primary parent-view-child-btn" data-email="${escapeHtml(c.email)}" data-name="${escapeHtml(
              c.name
            )}">View</button>
          </div>`
          )
          .join("")
      : `<p class="chat-list-empty">No linked children yet — enter an invite code above.</p>`;

    listEl.querySelectorAll(".parent-view-child-btn").forEach((btn) => {
      btn.addEventListener("click", () => openChild(btn.dataset.email, btn.dataset.name));
    });
  }

  document.getElementById("link-child-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const hint = document.getElementById("link-child-hint");
    const input = document.getElementById("link-code-input");
    const code = input.value.trim();
    if (!code) return;
    try {
      const student = await linkParentToStudent(code);
      hint.textContent = `Linked to ${student.name}.`;
      input.value = "";
      renderChildrenList();
    } catch (err) {
      hint.textContent = err.message;
    }
  });

  function openChild(email, name) {
    activeChild = { email, name };
    document.getElementById("parent-child-detail").style.display = "block";
    document.getElementById("parent-child-detail-name").textContent = name;
    document.getElementById("parent-child-detail").scrollIntoView({ behavior: "smooth", block: "start" });
    switchChildTab("chats");
    renderChildChats();
    renderChildSessions();
    renderChildAgreement();
  }

  document.getElementById("parent-child-detail-close").addEventListener("click", () => {
    activeChild = null;
    activeChildChatId = null;
    document.getElementById("parent-child-detail").style.display = "none";
  });

  function switchChildTab(tab) {
    ["chats", "sessions", "agreement"].forEach((name) => {
      const isActive = name === tab;
      document.getElementById(`pc-tab-${name}`).classList.toggle("active", isActive);
      document.getElementById(`pc-tab-${name}`).setAttribute("aria-selected", String(isActive));
      document.getElementById(`pc-panel-${name}`).style.display = isActive ? "block" : "none";
    });
  }
  document.querySelectorAll("#parent-child-detail .app-tab").forEach((btn) => {
    btn.addEventListener("click", () => switchChildTab(btn.dataset.tab));
  });

  // ---------------- Chats ----------------

  async function renderChildChats() {
    if (!activeChild) return;
    const chats = await getChildChats(activeChild.email);
    const listEl = document.getElementById("parent-chat-list");
    listEl.innerHTML = chats.length
      ? chats
          .map(
            (c) => `
          <button class="chat-list-item ${c.id === activeChildChatId ? "active" : ""}" data-chat-id="${c.id}">
            <span class="chat-avatar">${escapeHtml(initials(c.tutorName || c.tutorEmail))}</span>
            <span class="chat-list-item-body">
              <span class="chat-list-item-name">${escapeHtml(c.tutorName || c.tutorEmail)}</span>
              <span class="chat-list-item-preview">${escapeHtml(c.subject || "General tutoring")}</span>
            </span>
          </button>`
          )
          .join("")
      : `<p class="chat-list-empty">No chats yet.</p>`;

    listEl.querySelectorAll(".chat-list-item").forEach((btn) => {
      btn.addEventListener("click", () => openChildChat(btn.dataset.chatId));
    });
  }

  async function openChildChat(chatId) {
    activeChildChatId = chatId;
    renderChildChats();
    const [chat] = (await getChildChats(activeChild.email)).filter((c) => c.id === chatId);
    if (!chat) return;

    document.getElementById("parent-chat-empty").style.display = "none";
    document.getElementById("parent-chat-active").style.display = "flex";
    document.getElementById("parent-chat-partner-name").textContent = `${chat.tutorName || chat.tutorEmail} & ${
      chat.tuteeName || chat.tuteeEmail
    }`;
    document.getElementById("parent-chat-subject").textContent = chat.subject || "General tutoring";

    await renderChildChatMessages(chat);

    document.getElementById("parent-chat-composer").onsubmit = async (e) => {
      e.preventDefault();
      const input = document.getElementById("parent-message-input");
      const text = input.value.trim();
      if (!text) return;
      input.value = "";
      await addMessage(chatId, text, null, false);
      await renderChildChatMessages(chat);
    };
  }

  async function renderChildChatMessages(chat) {
    const messages = await getMessagesForChat(chat.id);
    const container = document.getElementById("parent-chat-messages");
    container.innerHTML = messages
      .map((m) => {
        if (m.system) return `<div class="msg-system">${escapeHtml(m.text)}</div>`;
        const mine = m.sender === me.email;
        const senderLabel =
          m.sender === chat.tutorEmail ? chat.tutorName || chat.tutorEmail : m.sender === chat.tuteeEmail ? chat.tuteeName || chat.tuteeEmail : me.name;
        return `
          <div class="msg-row ${mine ? "mine" : ""}">
            <div class="msg-bubble">
              ${mine ? "" : `<span class="msg-sender">${escapeHtml(senderLabel)}</span>`}
              <p>${escapeHtml(m.text)}</p>
              <span class="msg-time">${formatTime(m.timestamp)}</span>
            </div>
          </div>`;
      })
      .join("");
    container.scrollTop = container.scrollHeight;
  }

  // ---------------- Sessions ----------------

  async function renderChildSessions() {
    if (!activeChild) return;
    const sessions = await getChildSessions(activeChild.email);
    const listEl = document.getElementById("parent-sessions-list");
    listEl.innerHTML = sessions.length
      ? sessions
          .map(
            (s) => `
          <div class="session-card ${s.status === "cancelled" ? "session-card-cancelled" : ""}">
            <span class="session-partner">${escapeHtml(s.tutorName || s.tutorEmail)}</span>
            <span class="session-subject">${escapeHtml(s.subject || "General tutoring")}${s.rate ? ` · ${escapeHtml(s.rate)}` : ""}</span>
            <span class="session-time">${formatDateTime(s.datetime)} · ${s.durationMinutes} min</span>
            <span class="session-countdown ${s.status === "cancelled" ? "session-cancelled-label" : ""}">${
              s.status === "cancelled" ? "Cancelled" : s.status === "proposed" ? "Awaiting acceptance" : "Confirmed"
            }</span>
          </div>`
          )
          .join("")
      : `<p class="chat-list-empty">No sessions scheduled yet.</p>`;
  }

  // ---------------- Agreement ----------------

  let sigPad = null;

  async function renderChildAgreement() {
    if (!activeChild) return;
    const statusEl = document.getElementById("parent-agreement-status");
    const formEl = document.getElementById("parent-agreement-form");
    const badge = document.getElementById("pc-agreement-badge");
    statusEl.textContent = "Checking…";
    formEl.style.display = "none";

    const res = await fetch(`/api/agreements/status?email=${encodeURIComponent(me.email)}&studentEmail=${encodeURIComponent(activeChild.email)}`);
    const data = await res.json();

    if (data.signed) {
      statusEl.textContent = `You signed the program agreement for ${activeChild.name} on ${formatDateTime(data.signedAt)}.`;
      badge.style.display = "none";
    } else {
      statusEl.textContent = `You haven't signed the program agreement for ${activeChild.name} yet — required before they can start chatting with a tutor.`;
      badge.style.display = "inline-block";
      formEl.style.display = "block";
      document.getElementById("parent-agreement-name").value = "";
      sigPad = createSignaturePad("parent-agreement-sig-canvas", "parent-agreement-sig-clear");
    }
  }

  document.getElementById("parent-agreement-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById("parent-agreement-error");
    errorEl.textContent = "";
    const guardianName = document.getElementById("parent-agreement-name").value.trim();
    if (!guardianName) {
      errorEl.textContent = "Enter your full name.";
      return;
    }
    if (!sigPad || sigPad.isEmpty()) {
      errorEl.textContent = "Please sign above.";
      return;
    }

    const today = new Date();
    const signedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const submitBtn = document.getElementById("parent-agreement-submit");
    submitBtn.disabled = true;
    try {
      const res = await fetch("/api/agreements", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${me.token}` },
        body: JSON.stringify({
          email: me.email,
          role: "parent",
          studentEmail: activeChild.email,
          studentName: activeChild.name,
          guardianName,
          signedDate,
          guardianSignaturePng: sigPad.toDataURL(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
    } catch (err) {
      errorEl.textContent = err.message;
      submitBtn.disabled = false;
      return;
    }
    submitBtn.disabled = false;
    renderChildAgreement();
  });

  // Minimal canvas signature pad — duplicated from public/sign.js since
  // this page doesn't load that script. Keep in sync manually.
  function createSignaturePad(canvasId, clearBtnId) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#00203d";
    let drawing = false;
    let hasInk = false;

    function pointFromEvent(e) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const point = e.touches ? e.touches[0] : e;
      return { x: (point.clientX - rect.left) * scaleX, y: (point.clientY - rect.top) * scaleY };
    }

    function start(e) {
      e.preventDefault();
      drawing = true;
      hasInk = true;
      const { x, y } = pointFromEvent(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
    function move(e) {
      if (!drawing) return;
      e.preventDefault();
      const { x, y } = pointFromEvent(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    function end() {
      drawing = false;
    }

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    canvas.addEventListener("touchend", end);

    document.getElementById(clearBtnId).addEventListener("click", () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hasInk = false;
    });

    return {
      isEmpty: () => !hasInk,
      toDataURL: () => canvas.toDataURL("image/png"),
    };
  }

  renderChildrenList();
}
