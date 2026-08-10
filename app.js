const PANEL_NAMES = ["profile", "matching", "chats", "schedule"];
const NAV_TAB_NAMES = ["matching", "chats", "schedule"];
let activeChatId = null;
let pendingAttachment = null;

const me = requireSession("login.html");

if (me) {
  document.getElementById("me-name").textContent = me.name;
  document.getElementById("me-role-pill").textContent = me.role;
  renderHeaderAvatar();

  document.getElementById("logout-btn").addEventListener("click", () => {
    clearSession();
    window.location.href = "index.html";
  });
  document.getElementById("course-picker-close").addEventListener("click", () => toggleModal("course-picker-modal", false));
  document.getElementById("lightbox-close").addEventListener("click", () => toggleModal("image-lightbox", false));
  document.getElementById("image-lightbox").addEventListener("click", (e) => {
    if (e.target.id === "image-lightbox") toggleModal("image-lightbox", false);
  });

  initTabs();
  initProfileTab();
  initMatchingTab();
  initChatsTab();
  if (me.role === "tutor") initScheduleTab();

  onUpdate(() => {
    renderChatList();
    if (activeChatId) renderMessages(activeChatId);
    renderSessions();
    if (me.role === "tutor") {
      populateScheduleTuteeSelect();
      renderScheduleUpcoming();
    }
    renderMatchingList();
  });

  setInterval(renderSessions, 30000);
}

// ---------------- Tabs ----------------

function initTabs() {
  const tabs = {};
  const panels = {};
  PANEL_NAMES.forEach((name) => {
    panels[name] = document.getElementById(`panel-${name}`);
  });
  NAV_TAB_NAMES.forEach((name) => {
    tabs[name] = document.getElementById(`tab-${name}`);
  });

  if (me.role === "tutor") {
    tabs.schedule.style.display = "";
  }

  const params = new URLSearchParams(window.location.search);
  const requested = params.get("tab");
  const startTab = PANEL_NAMES.includes(requested) && (requested !== "schedule" || me.role === "tutor") ? requested : "matching";

  function activate(which) {
    PANEL_NAMES.forEach((name) => {
      panels[name].classList.toggle("active", name === which);
    });
    NAV_TAB_NAMES.forEach((name) => {
      const isActive = name === which;
      tabs[name].classList.toggle("active", isActive);
      tabs[name].setAttribute("aria-selected", String(isActive));
    });
    if (which === "chats") {
      renderChatList();
      renderSessions();
      if (activeChatId) renderMessages(activeChatId);
    } else if (which === "matching") {
      renderMatchingList();
    } else if (which === "schedule" && me.role === "tutor") {
      populateScheduleTuteeSelect();
      renderScheduleUpcoming();
    }
  }

  NAV_TAB_NAMES.forEach((name) => {
    tabs[name].addEventListener("click", () => activate(name));
  });
  document.getElementById("profile-icon-btn").addEventListener("click", () => activate("profile"));

  window.goToTab = activate;

  activate(startTab);
}

// ---------------- Header avatar ----------------

function renderHeaderAvatar() {
  const profile = getProfile(me.email);
  const img = document.getElementById("header-avatar-img");
  const initialsEl = document.getElementById("header-avatar-initials");
  if (profile.photo) {
    img.src = profile.photo;
    img.style.display = "block";
    initialsEl.style.display = "none";
  } else {
    img.style.display = "none";
    initialsEl.style.display = "flex";
    initialsEl.textContent = initials(me.name);
  }
}

// ---------------- Profile tab ----------------

function initProfileTab() {
  const isTutor = me.role === "tutor";
  document.getElementById("profile-heading").textContent = isTutor ? "Your Tutor Profile" : "Your Profile";
  document.getElementById("profile-lead").textContent = isTutor
    ? "Let tutees know what you can help with and when you're free."
    : "Tell tutors what you need help with so we can point them your way.";
  document.getElementById("subjects-label").textContent = isTutor ? "Classes You Can Teach" : "Classes You Need Help With";
  document.getElementById("grade-label").textContent = isTutor
    ? "Grade levels you can tutor"
    : "Your grade level";

  const profile = getProfile(me.email);

  // Photo
  let pendingPhoto = profile.photo || "";
  renderAvatarPreview(pendingPhoto);
  document.getElementById("avatar-upload-btn").addEventListener("click", () => document.getElementById("avatar-input").click());
  document.getElementById("avatar-input").addEventListener("change", (e) => {
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
      pendingPhoto = reader.result;
      renderAvatarPreview(pendingPhoto);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  });
  document.getElementById("avatar-remove-btn").addEventListener("click", () => {
    pendingPhoto = "";
    renderAvatarPreview(pendingPhoto);
  });

  function renderAvatarPreview(dataUrl) {
    const img = document.getElementById("avatar-preview-img");
    const initialsEl = document.getElementById("avatar-preview-initials");
    const removeBtn = document.getElementById("avatar-remove-btn");
    if (dataUrl) {
      img.src = dataUrl;
      img.style.display = "block";
      initialsEl.style.display = "none";
      removeBtn.style.display = "inline";
    } else {
      img.style.display = "none";
      initialsEl.style.display = "flex";
      initialsEl.textContent = initials(me.name);
      removeBtn.style.display = "none";
    }
  }

  // Bio
  document.getElementById("bio-input").value = profile.bio || "";

  // Your Class (tutors only — tutees already have "Your grade level" below)
  const classYearField = document.getElementById("class-year-field");
  if (isTutor) {
    classYearField.style.display = "";
    document.getElementById("class-year-grid").innerHTML = CLASS_YEARS.map(
      (c) => `
      <label class="chip">
        <input type="radio" name="classYear" value="${c}" ${profile.classYear === c ? "checked" : ""} />
        <span>${c}</span>
      </label>`
    ).join("");
  } else {
    classYearField.style.display = "none";
  }

  // Classes You've Taken (tutor) drives eligibility silently — matching uses
  // the full computed list, with no separate "Classes You Can Teach" picker.
  // Tutees pick freely from the catalog for "Classes You Need Help With".
  const takenCoursesField = document.getElementById("taken-courses-field");
  const subjectsField = document.getElementById("subjects-field");
  const subjectsAddBtn = document.getElementById("subjects-add-btn");
  const subjectsTags = document.getElementById("subjects-tags");

  let pendingTakenCourses = (profile.takenCourses || []).map((t) => ({ course: t.course, level: t.level }));
  let pendingSubjects = new Set(profile.subjects || []);

  if (isTutor) {
    takenCoursesField.style.display = "";
    subjectsField.style.display = "none";

    renderTakenCoursesTags();

    document.getElementById("taken-courses-add-btn").addEventListener("click", () => {
      openCoursePicker({
        title: "Add a Class You've Taken",
        isSelected: (course, level) => pendingTakenCourses.some((t) => t.course === course && t.level === level),
        onToggle: (course, level) => {
          const idx = pendingTakenCourses.findIndex((t) => t.course === course && t.level === level);
          if (idx === -1) pendingTakenCourses.push({ course, level });
          else pendingTakenCourses.splice(idx, 1);
          renderTakenCoursesTags();
        },
      });
    });
  } else {
    takenCoursesField.style.display = "none";
    subjectsAddBtn.style.display = "inline-block";
    subjectsTags.style.display = "flex";

    renderSubjectTags();

    document.getElementById("subjects-add-btn").addEventListener("click", () => {
      openCoursePicker({
        title: "Add a Class You Need Help With",
        isSelected: (course, level) => pendingSubjects.has(courseLabel(course, level)),
        onToggle: (course, level) => {
          const label = courseLabel(course, level);
          if (pendingSubjects.has(label)) pendingSubjects.delete(label);
          else pendingSubjects.add(label);
          renderSubjectTags();
        },
      });
    });
  }

  function renderTakenCoursesTags() {
    const tagsEl = document.getElementById("taken-courses-tags");
    tagsEl.innerHTML = pendingTakenCourses
      .map(
        (t) => `
      <span class="course-tag">
        ${escapeHtml(courseLabel(t.course, t.level))}
        <button type="button" data-course="${escapeHtml(t.course)}" data-level="${t.level}" aria-label="Remove">&times;</button>
      </span>`
      )
      .join("");
    tagsEl.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        pendingTakenCourses = pendingTakenCourses.filter((t) => !(t.course === btn.dataset.course && t.level === btn.dataset.level));
        renderTakenCoursesTags();
      });
    });
  }

  function renderSubjectTags() {
    subjectsTags.innerHTML = Array.from(pendingSubjects)
      .map(
        (label) => `
      <span class="course-tag">
        ${escapeHtml(label)}
        <button type="button" data-label="${escapeHtml(label)}" aria-label="Remove">&times;</button>
      </span>`
      )
      .join("");
    subjectsTags.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        pendingSubjects.delete(btn.dataset.label);
        renderSubjectTags();
      });
    });
  }

  const gradeLevelField = document.getElementById("grade-level-field");
  if (isTutor) {
    gradeLevelField.style.display = "none";
  } else {
    gradeLevelField.style.display = "";
    document.getElementById("grade-grid").innerHTML = GRADE_LEVELS.map(
      (g) => `
      <label class="chip">
        <input type="radio" name="grade" value="${g}" ${profile.gradeLevel === g ? "checked" : ""} />
        <span>${g}</span>
      </label>`
    ).join("");
  }

  const availabilityGrid = document.getElementById("availability-grid");
  let availHtml = `<div class="avail-corner"></div>`;
  AVAILABILITY_BLOCKS.forEach((b) => (availHtml += `<div class="avail-block-label">${b}</div>`));
  AVAILABILITY_DAYS.forEach((day) => {
    availHtml += `<div class="avail-day-label">${day}</div>`;
    AVAILABILITY_BLOCKS.forEach((block) => {
      const token = `${day}-${block}`;
      availHtml += `
        <label class="avail-cell">
          <input type="checkbox" name="availability" value="${token}" ${profile.availability.includes(token) ? "checked" : ""} />
          <span></span>
        </label>`;
    });
  });
  availabilityGrid.innerHTML = availHtml;

  document.getElementById("profile-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const availability = Array.from(document.querySelectorAll('input[name="availability"]:checked')).map((i) => i.value);
    const subjects = isTutor ? getTeachableCourses(pendingTakenCourses).map((c) => c.label) : Array.from(pendingSubjects);
    const newProfile = {
      subjects,
      availability,
      photo: pendingPhoto,
      bio: document.getElementById("bio-input").value.trim(),
      takenCourses: isTutor ? pendingTakenCourses.slice() : [],
    };
    if (isTutor) {
      newProfile.gradeLevels = [];
      newProfile.gradeLevel = "";
      const checkedClassYear = document.querySelector('input[name="classYear"]:checked');
      newProfile.classYear = checkedClassYear ? checkedClassYear.value : "";
    } else {
      const checked = document.querySelector('input[name="grade"]:checked');
      newProfile.gradeLevel = checked ? checked.value : "";
      newProfile.gradeLevels = [];
      newProfile.classYear = "";
    }
    saveProfile(me.email, newProfile);
    renderHeaderAvatar();

    const alertEl = document.getElementById("profile-alert");
    alertEl.textContent = "Profile saved.";
    alertEl.classList.add("show");
    setTimeout(() => alertEl.classList.remove("show"), 2500);
  });
}

// ---------------- Course picker modal ----------------
// Category -> course -> level. `isSelected`/`onToggle` are supplied by the
// caller so the same modal serves both the tutor's "classes taken" list and
// the tutee's "classes I need help with" list.

function toggleModal(id, show) {
  document.getElementById(id).classList.toggle("show", show);
}

function openCoursePicker({ title, isSelected, onToggle }) {
  document.getElementById("course-picker-title").textContent = title;
  const categoriesEl = document.getElementById("course-picker-categories");
  const coursesEl = document.getElementById("course-picker-courses");
  const courseListEl = document.getElementById("course-picker-course-list");

  categoriesEl.style.display = "flex";
  coursesEl.style.display = "none";

  categoriesEl.innerHTML = Object.keys(COURSE_CATALOG)
    .map((cat) => `<button type="button" class="course-picker-category-btn" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`)
    .join("");

  categoriesEl.querySelectorAll(".course-picker-category-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      categoriesEl.style.display = "none";
      coursesEl.style.display = "block";
      renderCourseList(btn.dataset.category);
    });
  });

  function renderCourseList(category) {
    courseListEl.innerHTML = COURSE_CATALOG[category]
      .map((c) => {
        const pills = c.levels
          .map((lvl) => {
            const added = isSelected(c.name, lvl);
            const pillText = c.levels.length === 1 ? "Add" : lvl;
            return `<button type="button" class="course-picker-level-pill ${added ? "added" : ""}" data-course="${escapeHtml(
              c.name
            )}" data-level="${lvl}">${added ? "✓ " : ""}${pillText}</button>`;
          })
          .join("");
        return `
          <div class="course-picker-course-row">
            <span class="course-picker-course-name">${escapeHtml(c.name)}</span>
            <span class="course-picker-levels">${pills}</span>
          </div>`;
      })
      .join("");

    courseListEl.querySelectorAll(".course-picker-level-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        onToggle(btn.dataset.course, btn.dataset.level);
        renderCourseList(category);
      });
    });
  }

  document.getElementById("course-picker-back").onclick = () => {
    coursesEl.style.display = "none";
    categoriesEl.style.display = "flex";
  };

  toggleModal("course-picker-modal", true);
}

function openLightbox(src) {
  document.getElementById("lightbox-img").src = src;
  toggleModal("image-lightbox", true);
}

// ---------------- Chats tab ----------------

function initChatsTab() {
  document.getElementById("schedule-btn").addEventListener("click", goToScheduleForActiveChat);

  document.getElementById("chat-composer").addEventListener("submit", handleSendMessage);
  document.getElementById("attach-btn").addEventListener("click", () => document.getElementById("file-input").click());
  document.getElementById("file-input").addEventListener("change", handleFileSelect);

  renderChatList();
  renderSessions();
}

function renderChatList() {
  const chats = getChatsForUser(me.email);
  const list = document.getElementById("chat-list");

  if (chats.length === 0) {
    list.innerHTML = `<p class="chat-list-empty">No chats yet. Start one with the + New button.</p>`;
    return;
  }

  list.innerHTML = chats
    .map((chat) => {
      const partnerEmail = otherPartyEmail(chat, me.email);
      const partnerName = formatName(partnerEmail);
      const msgs = getMessagesForChat(chat.id);
      const last = msgs[msgs.length - 1];
      const preview = last ? (last.attachment ? `📎 ${last.attachment.name}` : last.text) : "No messages yet";
      return `
        <button class="chat-list-item ${chat.id === activeChatId ? "active" : ""}" data-chat-id="${chat.id}">
          <span class="chat-avatar">${initials(partnerName)}</span>
          <span class="chat-list-item-body">
            <span class="chat-list-item-name">${partnerName}</span>
            <span class="chat-list-item-preview">${escapeHtml(preview)}</span>
          </span>
        </button>`;
    })
    .join("");

  list.querySelectorAll(".chat-list-item").forEach((btn) => {
    btn.addEventListener("click", () => openChat(btn.dataset.chatId));
  });
}

function openChat(chatId) {
  activeChatId = chatId;
  const chat = getChatById(chatId);
  if (!chat) return;

  document.getElementById("chat-empty").style.display = "none";
  document.getElementById("chat-active").style.display = "flex";

  const partnerEmail = otherPartyEmail(chat, me.email);
  document.getElementById("chat-partner-name").textContent = formatName(partnerEmail);
  document.getElementById("chat-subject").textContent = chat.subject || "General tutoring";
  document.getElementById("schedule-btn").style.display = me.role === "tutor" ? "inline-block" : "none";

  renderChatList();
  renderMessages(chatId);
}

function renderMessages(chatId) {
  if (chatId !== activeChatId) return;
  const messages = getMessagesForChat(chatId);
  const container = document.getElementById("chat-messages");

  container.innerHTML = messages
    .map((m) => {
      if (m.system) {
        return `<div class="msg-system">${escapeHtml(m.text)}</div>`;
      }
      const mine = m.sender === me.email;
      let attachmentHtml = "";
      if (m.attachment) {
        if (m.attachment.type && m.attachment.type.startsWith("image/")) {
          attachmentHtml = `<img class="msg-image" src="${m.attachment.dataUrl}" alt="${escapeHtml(m.attachment.name)}" />`;
        } else {
          attachmentHtml = `
            <a class="msg-file" href="${m.attachment.dataUrl}" download="${escapeHtml(m.attachment.name)}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
              <span>${escapeHtml(m.attachment.name)}</span>
            </a>`;
        }
      }
      return `
        <div class="msg-row ${mine ? "mine" : "theirs"}">
          <div class="msg-bubble">
            ${attachmentHtml}
            ${m.text ? `<p>${escapeHtml(m.text)}</p>` : ""}
            <span class="msg-time">${formatTime(m.timestamp)}</span>
          </div>
        </div>`;
    })
    .join("");

  container.querySelectorAll(".msg-image").forEach((img) => {
    img.addEventListener("click", () => openLightbox(img.src));
  });

  container.scrollTop = container.scrollHeight;
}

function handleSendMessage(e) {
  e.preventDefault();
  if (!activeChatId) return;
  const input = document.getElementById("message-input");
  const text = input.value.trim();
  if (!text && !pendingAttachment) return;

  addMessage(activeChatId, me.email, text, pendingAttachment);
  input.value = "";
  clearAttachment();
  renderMessages(activeChatId);
  renderChatList();
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  const MAX_BYTES = 3 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    alert("That file is too big for this prototype (3MB max). Try a smaller file.");
    e.target.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    pendingAttachment = { name: file.name, type: file.type, size: file.size, dataUrl: reader.result };
    showAttachmentPreview();
  };
  reader.readAsDataURL(file);
  e.target.value = "";
}

function showAttachmentPreview() {
  const preview = document.getElementById("chat-attach-preview");
  if (!pendingAttachment) {
    preview.style.display = "none";
    preview.innerHTML = "";
    return;
  }
  preview.style.display = "flex";
  preview.innerHTML = `
    <span>📎 ${escapeHtml(pendingAttachment.name)} (${formatBytes(pendingAttachment.size)})</span>
    <button type="button" id="remove-attachment" aria-label="Remove attachment">&times;</button>`;
  document.getElementById("remove-attachment").addEventListener("click", clearAttachment);
}

function clearAttachment() {
  pendingAttachment = null;
  showAttachmentPreview();
}

// ---------------- Matching tab ----------------

function initMatchingTab() {
  const isTutor = me.role === "tutor";
  const oppositeRole = isTutor ? "tutee" : "tutor";
  document.getElementById("matching-heading").textContent = isTutor ? "Find a Tutee" : "Find a Tutor";
  document.getElementById("matching-lead").textContent = isTutor
    ? "Browse tutees and start a chat based on shared subjects."
    : "Browse tutors and start a chat based on shared subjects.";
  renderMatchingList();
}

function renderMatchingList() {
  const listEl = document.getElementById("matching-list");
  if (!listEl) return;

  const oppositeRole = me.role === "tutor" ? "tutee" : "tutor";
  const candidates = getUsers().filter((u) => u.role === oppositeRole && u.email !== me.email);

  if (candidates.length === 0) {
    listEl.innerHTML = `<p class="chat-list-empty">No ${oppositeRole}s have signed up yet. Check back soon.</p>`;
    return;
  }

  const myProfile = getProfile(me.email);
  listEl.innerHTML = candidates
    .map((u) => {
      const theirProfile = getProfile(u.email);
      const shared = myProfile.subjects.filter((s) => theirProfile.subjects.includes(s));
      const subjectsHtml = theirProfile.subjects.length
        ? theirProfile.subjects
            .map((s) => `<span class="match-subject-chip ${shared.includes(s) ? "shared" : ""}">${escapeHtml(s)}</span>`)
            .join("")
        : `<span class="match-subject-chip">No subjects listed yet</span>`;
      const existingChat = findChat(me.role === "tutor" ? me.email : u.email, me.role === "tutor" ? u.email : me.email);
      return `
        <div class="match-row">
          <span class="chat-avatar">${initials(u.name)}</span>
          <span class="match-row-body">
            <span class="new-chat-row-name">${escapeHtml(u.name)}</span>
            <span class="match-subjects">${subjectsHtml}</span>
          </span>
          <button class="btn-primary new-chat-start" data-email="${u.email}">${existingChat ? "Go to Chat" : "Start Chat"}</button>
        </div>`;
    })
    .join("");

  listEl.querySelectorAll(".new-chat-start").forEach((btn) => {
    btn.addEventListener("click", () => {
      const theirEmail = btn.dataset.email;
      const theirProfile = getProfile(theirEmail);
      const shared = myProfile.subjects.find((s) => theirProfile.subjects.includes(s));
      const subject = shared || theirProfile.subjects[0] || myProfile.subjects[0] || "General tutoring";
      const tutorEmail = me.role === "tutor" ? me.email : theirEmail;
      const tuteeEmail = me.role === "tutor" ? theirEmail : me.email;
      const chat = createChat(tutorEmail, tuteeEmail, subject);
      window.goToTab("chats");
      openChat(chat.id);
    });
  });
}

// ---------------- Schedule tab (tutors only) ----------------

function initScheduleTab() {
  populateScheduleTuteeSelect();
  renderScheduleUpcoming();
  document.getElementById("schedule-tab-form").addEventListener("submit", handleScheduleTabSubmit);
}

function populateScheduleTuteeSelect(preselectEmail) {
  const select = document.getElementById("schedule-tutee-select");
  if (!select) return;
  const priorValue = preselectEmail || select.value;

  const chats = getChatsForUser(me.email);
  const tuteeEmails = chats.map((c) => otherPartyEmail(c, me.email));

  if (tuteeEmails.length === 0) {
    select.innerHTML = `<option value="">No matched tutees yet — visit the Matching tab first</option>`;
    select.disabled = true;
    return;
  }

  select.disabled = false;
  select.innerHTML = tuteeEmails
    .map((email) => `<option value="${email}">${escapeHtml(formatName(email))}</option>`)
    .join("");

  if (priorValue && tuteeEmails.includes(priorValue)) select.value = priorValue;
}

function goToScheduleForActiveChat() {
  const chat = getChatById(activeChatId);
  if (!chat) return;
  const tuteeEmail = otherPartyEmail(chat, me.email);
  window.goToTab("schedule");
  populateScheduleTuteeSelect(tuteeEmail);
}

function handleScheduleTabSubmit(e) {
  e.preventDefault();
  const tuteeEmail = document.getElementById("schedule-tutee-select").value;
  const date = document.getElementById("schedule-tab-date").value;
  const time = document.getElementById("schedule-tab-time").value;
  const duration = document.getElementById("schedule-tab-duration").value;
  const zoomLink = document.getElementById("schedule-tab-zoom").value.trim();
  const errorEl = document.getElementById("schedule-tab-error");
  errorEl.textContent = "";

  if (!tuteeEmail) {
    errorEl.textContent = "Pick a tutee — you need to match and start a chat with them first.";
    return;
  }
  if (!date || !time) {
    errorEl.textContent = "Pick a date and time.";
    return;
  }
  const datetime = new Date(`${date}T${time}`);
  if (Number.isNaN(datetime.getTime()) || datetime < new Date()) {
    errorEl.textContent = "Pick a time in the future.";
    return;
  }

  const chat = findChat(me.email, tuteeEmail);
  if (!chat) {
    errorEl.textContent = "Couldn't find a chat with that tutee.";
    return;
  }

  const session = createSession({
    chatId: chat.id,
    tutorEmail: chat.tutorEmail,
    tuteeEmail: chat.tuteeEmail,
    subject: chat.subject,
    datetime: datetime.toISOString(),
    durationMinutes: duration,
    zoomLink,
  });

  addMessage(chat.id, me.email, `Session scheduled for ${formatDateTime(session.datetime)} (${duration} min).`, null, true);

  document.getElementById("schedule-tab-form").reset();
  renderScheduleUpcoming();
  renderSessions();
  renderChatList();
}

function renderScheduleUpcoming() {
  const list = document.getElementById("schedule-upcoming-list");
  if (!list) return;
  const sessions = getSessionsForUser(me.email);
  list.innerHTML = sessionListHtml(sessions);
  wireSessionJoinButtons(list);
}

// ---------------- Sessions sidebar ----------------

function renderSessions() {
  const sessions = getSessionsForUser(me.email);
  const list = document.getElementById("sessions-list");
  list.innerHTML = sessionListHtml(sessions);
  wireSessionJoinButtons(list);
}

function sessionListHtml(sessions) {
  if (sessions.length === 0) {
    return `<p class="chat-list-empty">No sessions scheduled yet.</p>`;
  }

  const now = Date.now();
  return sessions
    .map((s) => {
      const partnerEmail = otherPartyEmail(s, me.email);
      const start = new Date(s.datetime).getTime();
      const joinOpensAt = start - 5 * 60000;
      const end = start + s.durationMinutes * 60000 + 15 * 60000;

      let statusHtml;
      if (now < joinOpensAt) {
        statusHtml = `<span class="session-countdown">${countdownText(start - now)}</span>`;
      } else if (now <= end) {
        statusHtml = `<button class="btn-primary session-join" data-session-id="${s.id}">Join Video Call</button>`;
        if (s.zoomLink) {
          statusHtml += `<a class="btn-ghost session-zoom" href="${escapeHtml(s.zoomLink)}" target="_blank" rel="noopener noreferrer">Open Zoom Instead</a>`;
        }
      } else {
        statusHtml = `<span class="session-countdown session-past">Completed</span>`;
      }

      return `
        <div class="session-card">
          <span class="session-partner">${formatName(partnerEmail)}</span>
          <span class="session-subject">${escapeHtml(s.subject || "General tutoring")}</span>
          <span class="session-time">${formatDateTime(s.datetime)} · ${s.durationMinutes} min</span>
          ${statusHtml}
        </div>`;
    })
    .join("");
}

function wireSessionJoinButtons(container) {
  container.querySelectorAll(".session-join").forEach((btn) => {
    btn.addEventListener("click", () => {
      window.location.href = `video.html?session=${btn.dataset.sessionId}`;
    });
  });
}

function countdownText(ms) {
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `Starts in ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  if (hours < 24) return `Starts in ${hours}h ${remMinutes}m`;
  const days = Math.floor(hours / 24);
  return `Starts in ${days}d`;
}

// ---------------- Formatting helpers ----------------

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) + " · " + formatTime(iso);
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
