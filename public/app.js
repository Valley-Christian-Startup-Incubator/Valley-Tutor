const PANEL_NAMES = ["profile", "matching", "chats", "schedule"];
const NAV_TAB_NAMES = ["matching", "chats", "schedule"];
const PERSON_COLORS = ["#2b6cb0", "#9f7aea", "#38a169", "#dd6b20", "#d53f8c", "#319795", "#c05621", "#5a67d8"];
let activeChatId = null;
let pendingAttachment = null;

const me = requireSession("/login");

// Gate on the signed agreement before anything else can render — signup
// already routes here first, but this is the actual enforcement point (also
// catches someone who signed up, closed the tab, and logged back in later).
// A failed status check fails OPEN (logs and lets them through) rather than
// locking someone out over a transient network hiccup — this app doesn't
// otherwise defend against a determined client-side bypass, so a hard lock
// here would be inconsistent with its existing trust model, not more secure.
async function hasSignedAgreement(email) {
  try {
    const res = await fetch(`/api/agreements/status?email=${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error(`status check failed: ${res.status}`);
    const data = await res.json();
    return Boolean(data.signed);
  } catch (err) {
    console.error("Agreement status check failed, letting the user through:", err);
    return true;
  }
}

// Re-fetches and re-renders everything data-dependent — called on the
// same-browser BroadcastChannel nudge AND on a plain interval, since chats/
// messages/sessions now live server-side and a tutor and tutee on two
// separate real devices have no shared BroadcastChannel to notify each
// other with.
function refreshAll() {
  if (activeChatId) {
    markChatRead(me.email, activeChatId);
    getChatById(activeChatId).then((chat) => {
      if (chat) renderRateWidget(chat);
    });
  }
  renderChatList();
  if (activeChatId) renderMessages(activeChatId);
  renderSessions();
  if (me.role === "tutor") {
    populateScheduleTuteeSelect();
    renderScheduleUpcoming();
  } else {
    renderMatchingList();
  }
}

(async () => {
  if (!me) return;

  if (!(await hasSignedAgreement(me.email))) {
    window.location.href = "/sign-agreement";
    return;
  }

  document.getElementById("me-name").textContent = me.name;
  document.getElementById("me-role-pill").textContent = me.role;
  renderHeaderAvatar();

  const otherRole = me.role === "tutor" ? "tutee" : "tutor";
  const switchRoleBtn = document.getElementById("switch-role-btn");
  switchRoleBtn.textContent = `Switch to ${otherRole}`;
  switchRoleBtn.addEventListener("click", async () => {
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

  document.getElementById("logout-btn").addEventListener("click", () => {
    clearSession();
    window.location.href = "/";
  });
  document.getElementById("lightbox-close").addEventListener("click", () => toggleModal("image-lightbox", false));
  document.getElementById("image-lightbox").addEventListener("click", (e) => {
    if (e.target.id === "image-lightbox") toggleModal("image-lightbox", false);
  });

  initTabs();
  initProfileTab();
  initChatsTab();
  if (me.role === "tutor") {
    initScheduleTab();
  } else {
    initMatchingTab();
  }

  onUpdate(refreshAll);
  setInterval(refreshAll, 8000);
})();

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
  } else {
    tabs.matching.style.display = "";
  }

  // Only tutees browse and choose — a tutor can't reach Matching, even via a
  // stale ?tab= link, since they don't initiate chats.
  function isTabAllowed(tab) {
    if (tab === "schedule") return me.role === "tutor";
    if (tab === "matching") return me.role === "tutee";
    return true;
  }

  const params = new URLSearchParams(window.location.search);
  const requested = params.get("tab");
  const defaultTab = me.role === "tutor" ? "chats" : "matching";
  const startTab = PANEL_NAMES.includes(requested) && isTabAllowed(requested) ? requested : defaultTab;

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
    } else if (which === "matching" && me.role === "tutee") {
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

async function renderHeaderAvatar() {
  const profile = await getMyProfile();
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

async function initProfileTab() {
  const isTutor = me.role === "tutor";
  const profile = await getMyProfile();

  document.getElementById("profile-name-heading").textContent = me.name;
  document.getElementById("profile-subtitle").textContent = isTutor
    ? profile.classYear || "Tutor"
    : profile.gradeLevel ? `${profile.gradeLevel} Grade` : "Tutee";
  document.getElementById("bio-hint").textContent = isTutor
    ? "Two or three sentences. Say which teacher you had, if it's relevant."
    : "Two or three sentences about what you're working on.";
  document.getElementById("grade-label").textContent = isTutor ? "Grade Levels You'll Tutor" : "Your Grade Level";

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

  // Grade levels: tutors multi-select which grades they'll tutor, tutees
  // single-select their own grade.
  const gradeGrid = document.getElementById("grade-grid");
  if (isTutor) {
    gradeGrid.innerHTML = GRADE_LEVELS.map(
      (g) => `
      <label class="chip">
        <input type="checkbox" name="grade" value="${g}" ${(profile.gradeLevels || []).includes(g) ? "checked" : ""} />
        <span>${g}</span>
      </label>`
    ).join("");
  } else {
    gradeGrid.innerHTML = GRADE_LEVELS.map(
      (g) => `
      <label class="chip">
        <input type="radio" name="grade" value="${g}" ${profile.gradeLevel === g ? "checked" : ""} />
        <span>${g}</span>
      </label>`
    ).join("");
  }

  // ---- Details card: video/rate/hours (tutor), offer/payment (tutee) ----
  document.getElementById("intro-video-field").style.display = isTutor ? "" : "none";
  document.getElementById("rate-field").style.display = isTutor ? "" : "none";
  document.getElementById("tutoring-hours-field").style.display = isTutor ? "" : "none";
  document.getElementById("offer-field").style.display = isTutor ? "none" : "";
  document.getElementById("payment-methods-field").style.display = isTutor ? "none" : "";

  let pendingIntroVideo = profile.introVideo || "";
  renderIntroVideoPreview(pendingIntroVideo);

  function renderIntroVideoPreview(dataUrl) {
    const videoEl = document.getElementById("intro-video-preview");
    const removeBtn = document.getElementById("intro-video-remove-btn");
    if (dataUrl) {
      videoEl.src = dataUrl;
      videoEl.style.display = "block";
      removeBtn.style.display = "inline";
    } else {
      videoEl.removeAttribute("src");
      videoEl.style.display = "none";
      removeBtn.style.display = "none";
    }
  }

  document.getElementById("intro-video-upload-btn").addEventListener("click", () => document.getElementById("intro-video-input").click());
  document.getElementById("intro-video-input").addEventListener("change", (e) => {
    const file = e.target.files[0];
    const errorEl = document.getElementById("intro-video-error");
    errorEl.textContent = "";
    if (!file) return;
    readVideoWithChecks(file)
      .then((dataUrl) => {
        pendingIntroVideo = dataUrl;
        renderIntroVideoPreview(pendingIntroVideo);
      })
      .catch((err) => {
        errorEl.textContent = err.message;
        e.target.value = "";
      });
  });
  document.getElementById("intro-video-remove-btn").addEventListener("click", () => {
    pendingIntroVideo = "";
    renderIntroVideoPreview(pendingIntroVideo);
  });

  document.getElementById("rate-input").value = profile.rate || "";
  document.getElementById("tutoring-hours-input").value = profile.tutoringHours || "";
  document.getElementById("offer-input").value = profile.offer || "";
  document.getElementById("payment-handle-input").value = profile.paymentHandle || "";

  document.getElementById("payment-methods-grid").innerHTML = PAYMENT_METHODS.map(
    (m) => `
    <label class="chip">
      <input type="checkbox" name="paymentMethod" value="${m}" ${(profile.paymentMethods || []).includes(m) ? "checked" : ""} />
      <span>${m}</span>
    </label>`
  ).join("");

  // Comments a tutor has received (warm ones only — cold feedback is held
  // back, see lib/comments.ts). Tutees don't have a comments card.
  const commentsCard = document.getElementById("tutor-comments-card");
  if (isTutor) {
    commentsCard.style.display = "block";
    const comments = await getVisibleCommentsForTutor(me.email);
    document.getElementById("tutor-comments-list").innerHTML = comments.length
      ? comments
          .map(
            (c) => `
        <div class="tutor-comment-row">
          <span class="tutor-comment-author">${escapeHtml(c.authorName || c.authorEmail)}</span>
          <span class="tutor-comment-date">${formatDateTime(c.createdAt)}</span>
          <p class="tutor-comment-text">${escapeHtml(c.text)}</p>
        </div>`
          )
          .join("")
      : `<p class="chat-list-empty">No feedback yet.</p>`;
  } else {
    commentsCard.style.display = "none";
  }

  // ---- Inline course browser: search + category accordions ----
  // Tutor: "Classes You've Taken" drives the qualified-to-teach dropdown.
  // Tutee: "Classes You Need Help With" is a free pick, no eligibility gate.
  let pendingTakenCourses = (profile.takenCourses || []).map((t) => ({ course: t.course, level: t.level }));
  let pendingSubjects = new Set(profile.subjects || []);
  let courseSearchQuery = "";
  let qualifiedExpanded = false;

  const expandedCategories = new Set();
  Object.keys(COURSE_CATALOG).forEach((category) => {
    const hasSelection = getCourseCategoryRows(category).some((r) => isCourseSelected(r.course, r.level));
    if (hasSelection) expandedCategories.add(category);
  });

  document.getElementById("course-browser-heading").textContent = isTutor ? "Classes You've Taken" : "Classes You Need Help With";
  document.getElementById("course-browser-lead").textContent = isTutor
    ? "Pick every course you have finished. We work out what that qualifies you to teach — you never guess."
    : "Pick every course you'd like a tutor's help with.";
  document.getElementById("course-search-input").placeholder = `Search ${totalCatalogCourseCount()} classes — try "guitar" or "AP"`;

  function isCourseSelected(course, level) {
    return isTutor
      ? pendingTakenCourses.some((t) => t.course === course && t.level === level)
      : pendingSubjects.has(courseLabel(course, level));
  }

  function toggleCourseSelection(course, level) {
    if (isTutor) {
      const idx = pendingTakenCourses.findIndex((t) => t.course === course && t.level === level);
      if (idx === -1) pendingTakenCourses.push({ course, level });
      else pendingTakenCourses.splice(idx, 1);
    } else {
      const label = courseLabel(course, level);
      if (pendingSubjects.has(label)) pendingSubjects.delete(label);
      else pendingSubjects.add(label);
    }
    renderCourseBrowser();
  }

  function renderCourseBrowser() {
    renderCategoryList();
    renderTakenSummary();
    if (isTutor) renderQualifiedPanel();
  }

  function renderCategoryList() {
    const categoriesEl = document.getElementById("course-categories");
    const query = courseSearchQuery.trim().toLowerCase();

    categoriesEl.innerHTML = Object.keys(COURSE_CATALOG)
      .map((category) => {
        const allRows = getCourseCategoryRows(category);
        const rows = query ? allRows.filter((r) => r.label.toLowerCase().includes(query)) : allRows;
        if (query && rows.length === 0) return "";

        const selectedCount = allRows.filter((r) => isCourseSelected(r.course, r.level)).length;
        const expanded = query ? true : expandedCategories.has(category);
        const color = CATEGORY_COLORS[category] || "#8a94a6";

        const rowsHtml = rows
          .map((r) => {
            const checked = isCourseSelected(r.course, r.level);
            return `
              <label class="course-row ${checked ? "selected" : ""}">
                <input type="checkbox" data-course="${escapeHtml(r.course)}" data-level="${r.level}" ${checked ? "checked" : ""} />
                <span class="course-row-name">${escapeHtml(r.course)}</span>
                <span class="course-row-badge">${r.level}</span>
              </label>`;
          })
          .join("");

        return `
          <div class="course-category ${expanded ? "expanded" : ""}" data-category="${escapeHtml(category)}" style="--category-color:${color}">
            <button type="button" class="course-category-head">
              <span class="course-category-swatch"></span>
              <span class="course-category-name">${escapeHtml(category)}</span>
              ${selectedCount ? `<span class="course-category-selected">${selectedCount} selected</span>` : ""}
              <span class="course-category-count">${allRows.length}</span>
              <svg class="course-category-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            <div class="course-category-rows" ${expanded ? "" : 'style="display:none;"'}>${rowsHtml}</div>
          </div>`;
      })
      .join("");

    categoriesEl.querySelectorAll(".course-category-head").forEach((btn) => {
      btn.addEventListener("click", () => {
        const category = btn.closest(".course-category").dataset.category;
        if (expandedCategories.has(category)) expandedCategories.delete(category);
        else expandedCategories.add(category);
        renderCategoryList();
      });
    });

    categoriesEl.querySelectorAll('.course-row input[type="checkbox"]').forEach((input) => {
      input.addEventListener("change", () => toggleCourseSelection(input.dataset.course, input.dataset.level));
    });
  }

  function renderTakenSummary() {
    const countEl = document.getElementById("taken-summary-count");
    const tagsEl = document.getElementById("taken-summary-tags");
    const items = isTutor
      ? pendingTakenCourses.map((t) => ({ course: t.course, level: t.level, label: courseLabel(t.course, t.level) }))
      : Array.from(pendingSubjects).map((label) => ({ label }));

    countEl.textContent = `${items.length} COURSE${items.length === 1 ? "" : "S"} ${isTutor ? "TAKEN" : "SELECTED"}`;
    tagsEl.innerHTML = items
      .map(
        (it) => `
      <span class="course-tag">
        ${escapeHtml(it.label)}
        <button type="button" data-course="${escapeHtml(it.course || "")}" data-level="${it.level || ""}" data-label="${escapeHtml(
          it.label
        )}" aria-label="Remove">&times;</button>
      </span>`
      )
      .join("");

    tagsEl.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (isTutor) toggleCourseSelection(btn.dataset.course, btn.dataset.level);
        else {
          pendingSubjects.delete(btn.dataset.label);
          renderCourseBrowser();
        }
      });
    });
  }

  function renderQualifiedPanel() {
    const panel = document.getElementById("qualified-panel");
    if (pendingTakenCourses.length === 0) {
      panel.style.display = "none";
      return;
    }
    panel.style.display = "block";

    const eligible = getTeachableCourses(pendingTakenCourses).sort(
      (a, b) => a.category.localeCompare(b.category) || a.label.localeCompare(b.label)
    );
    document.getElementById("qualified-toggle-title").textContent = `You're qualified to teach ${eligible.length} course${
      eligible.length === 1 ? "" : "s"
    }`;
    document.getElementById("qualified-list").innerHTML = eligible
      .map(
        (c) => `
      <div class="qualified-row">
        <span class="qualified-dot" style="background:${CATEGORY_COLORS[c.category] || "#8a94a6"}"></span>
        <span class="qualified-name">${escapeHtml(c.label)}</span>
        <span class="qualified-source">${c.viaLabel ? `via ${escapeHtml(c.viaLabel)}` : "You took it"}</span>
      </div>`
      )
      .join("");
  }

  document.getElementById("course-search-input").addEventListener("input", (e) => {
    courseSearchQuery = e.target.value;
    renderCategoryList();
  });
  document.getElementById("course-search-clear").addEventListener("click", () => {
    courseSearchQuery = "";
    document.getElementById("course-search-input").value = "";
    renderCategoryList();
  });
  document.getElementById("qualified-toggle").addEventListener("click", () => {
    qualifiedExpanded = !qualifiedExpanded;
    document.getElementById("qualified-list").style.display = qualifiedExpanded ? "flex" : "none";
    document.getElementById("qualified-chevron").classList.toggle("open", qualifiedExpanded);
  });

  renderCourseBrowser();

  // Format-specific availability: each block defaults to the old hardcoded
  // assumption (Evening = Online, everything else = In-Person) for profiles
  // saved before this existed, but is now editable per block.
  const pendingAvailFormats = {};
  AVAILABILITY_BLOCKS.forEach((b) => {
    pendingAvailFormats[b] = (profile.availabilityFormats || {})[b] || (ZOOM_ONLY_BLOCKS.includes(b) ? "Online" : "In-Person");
  });

  function renderAvailabilityGrid() {
    const availabilityGrid = document.getElementById("availability-grid");
    let availHtml = `<div class="avail-corner"></div>`;
    AVAILABILITY_BLOCKS.forEach((b) => {
      const fmt = pendingAvailFormats[b];
      const fmtText = fmt === "Both" ? "In-Person & Online" : fmt === "Online" ? "Online" : "In-Person";
      availHtml += `<div class="avail-block-label">${escapeHtml(b)}<br />(${fmtText})</div>`;
    });
    AVAILABILITY_DAYS.forEach((day) => {
      availHtml += `<div class="avail-day-label">${day}</div>`;
      AVAILABILITY_BLOCKS.forEach((block) => {
        const token = `${day}-${block}`;
        availHtml += `
          <label class="avail-cell">
            <input type="checkbox" name="availability" value="${token}" ${profile.availability.includes(token) ? "checked" : ""} />
            <span>
              <svg class="avail-cell-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>
              <span class="avail-cell-label">Selected</span>
            </span>
          </label>`;
      });
    });
    availabilityGrid.innerHTML = availHtml;
  }

  const availLocations = profile.availabilityLocations || {};
  function renderAvailLocations() {
    document.getElementById("avail-locations").innerHTML =
      `<div class="avail-location-corner"></div>` +
      AVAILABILITY_BLOCKS.map((block) => {
        const fmt = pendingAvailFormats[block];
        const showLocation = fmt !== "Online";
        return `
          <div class="avail-location-field">
            <label>Format</label>
            <select data-format-block="${escapeHtml(block)}">
              ${AVAILABILITY_FORMATS.map((f) => `<option value="${f}" ${fmt === f ? "selected" : ""}>${f}</option>`).join("")}
            </select>
            ${
              showLocation
                ? `<input type="text" data-block="${escapeHtml(block)}" value="${escapeHtml(availLocations[block] || "")}" placeholder="e.g. Library" />`
                : ""
            }
          </div>`;
      }).join("");

    document.querySelectorAll('#avail-locations select[data-format-block]').forEach((select) => {
      select.addEventListener("change", () => {
        pendingAvailFormats[select.dataset.formatBlock] = select.value;
        renderAvailLocations();
        renderAvailabilityGrid();
      });
    });
  }

  renderAvailabilityGrid();
  renderAvailLocations();

  document.getElementById("profile-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const availability = Array.from(document.querySelectorAll('input[name="availability"]:checked')).map((i) => i.value);
    const availabilityLocations = {};
    AVAILABILITY_BLOCKS.forEach((block) => {
      const input = document.querySelector(`#avail-locations input[data-block="${block}"]`);
      availabilityLocations[block] = input ? input.value.trim() : "";
    });
    const subjects = isTutor ? getTeachableCourses(pendingTakenCourses).map((c) => c.label) : Array.from(pendingSubjects);
    const newProfile = {
      subjects,
      availability,
      availabilityLocations,
      availabilityFormats: pendingAvailFormats,
      photo: pendingPhoto,
      bio: document.getElementById("bio-input").value.trim(),
      takenCourses: isTutor ? pendingTakenCourses.slice() : [],
      introVideo: isTutor ? pendingIntroVideo : "",
      rate: isTutor ? document.getElementById("rate-input").value.trim() : "",
      tutoringHours: isTutor ? document.getElementById("tutoring-hours-input").value.trim() : "",
      offer: isTutor ? "" : document.getElementById("offer-input").value.trim(),
      paymentMethods: isTutor
        ? []
        : Array.from(document.querySelectorAll('input[name="paymentMethod"]:checked')).map((i) => i.value),
      paymentHandle: isTutor ? "" : document.getElementById("payment-handle-input").value.trim(),
    };
    if (isTutor) {
      newProfile.gradeLevels = Array.from(document.querySelectorAll('input[name="grade"]:checked')).map((i) => i.value);
      newProfile.gradeLevel = "";
      const checkedClassYear = document.querySelector('input[name="classYear"]:checked');
      newProfile.classYear = checkedClassYear ? checkedClassYear.value : "";
    } else {
      const checked = document.querySelector('input[name="grade"]:checked');
      newProfile.gradeLevel = checked ? checked.value : "";
      newProfile.gradeLevels = [];
      newProfile.classYear = "";
    }
    await saveMyProfile(newProfile);
    renderHeaderAvatar();

    const alertEl = document.getElementById("profile-alert");
    alertEl.textContent = "Profile saved.";
    alertEl.classList.add("show");
    setTimeout(() => alertEl.classList.remove("show"), 2500);
  });
}

function toggleModal(id, show) {
  document.getElementById(id).classList.toggle("show", show);
}

function openLightbox(src) {
  document.getElementById("lightbox-img").src = src;
  toggleModal("image-lightbox", true);
}

// ---------------- Chats tab ----------------

function initChatsTab() {
  document.getElementById("chat-empty-text").textContent =
    me.role === "tutee" ? "Select a chat to get going, or visit the Matching tab to start one." : "Select a chat to get going.";
  document.getElementById("schedule-btn").addEventListener("click", goToScheduleForActiveChat);

  document.getElementById("chat-composer").addEventListener("submit", handleSendMessage);
  document.getElementById("attach-btn").addEventListener("click", () => document.getElementById("file-input").click());
  document.getElementById("file-input").addEventListener("change", handleFileSelect);

  renderChatList();
  renderSessions();
}

// ---------------- Rate agreement widget ----------------
// Either party can propose an hourly rate; the *other* party has to accept
// it (never the proposer) — recorded server-side (rate_agreements table) so
// it can be pulled into an admin view later.

async function renderRateWidget(chat) {
  const widget = document.getElementById("chat-rate-widget");
  if (!widget) return;
  const partnerName = otherPartyName(chat, me.email) || "the other person";
  const agreement = await getRateAgreement(chat.id);

  if (!agreement) {
    widget.innerHTML = `<button type="button" class="btn-ghost chat-rate-propose-btn">Propose a Rate</button>`;
  } else if (agreement.status === "pending" && agreement.proposedBy === me.email) {
    widget.innerHTML = `
      <span>Waiting for ${escapeHtml(partnerName)} to accept ${escapeHtml(agreement.rate)}</span>
      <button type="button" class="link-btn chat-rate-propose-btn">Change</button>`;
  } else if (agreement.status === "pending") {
    widget.innerHTML = `
      <span>${escapeHtml(partnerName)} proposed ${escapeHtml(agreement.rate)}</span>
      <button type="button" class="btn-primary chat-rate-accept-btn">Accept</button>
      <button type="button" class="link-btn chat-rate-propose-btn">Propose different rate</button>`;
  } else {
    widget.innerHTML = `
      <span>✓ Agreed rate: ${escapeHtml(agreement.rate)}</span>
      <button type="button" class="link-btn chat-rate-propose-btn">Renegotiate</button>`;
  }

  const proposeBtn = widget.querySelector(".chat-rate-propose-btn");
  if (proposeBtn) proposeBtn.addEventListener("click", () => showRateProposeForm(chat));
  const acceptBtn = widget.querySelector(".chat-rate-accept-btn");
  if (acceptBtn) acceptBtn.addEventListener("click", () => handleAcceptRate(chat));
}

function showRateProposeForm(chat) {
  const widget = document.getElementById("chat-rate-widget");
  widget.innerHTML = `
    <form class="chat-rate-form" id="chat-rate-propose-form">
      <input type="text" id="chat-rate-input" placeholder="e.g. $15/hr" autoComplete="off" />
      <button type="submit" class="btn-ghost">Propose</button>
      <button type="button" class="link-btn" id="chat-rate-propose-cancel">Cancel</button>
    </form>`;
  document.getElementById("chat-rate-input").focus();
  document.getElementById("chat-rate-propose-cancel").addEventListener("click", () => renderRateWidget(chat));
  document.getElementById("chat-rate-propose-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const rate = document.getElementById("chat-rate-input").value.trim();
    if (!rate) return;
    await proposeRate(chat.id, rate);
    await addMessage(chat.id, `${me.name} proposed an hourly rate of ${rate}.`, null, true);
    renderRateWidget(chat);
    renderMessages(chat.id);
  });
}

async function handleAcceptRate(chat) {
  const agreement = await acceptRate(chat.id);
  await addMessage(chat.id, `${me.name} accepted the hourly rate of ${agreement.rate}.`, null, true);
  renderRateWidget(chat);
  renderMessages(chat.id);
}

async function renderChatList() {
  const chats = await getMyChats();
  const list = document.getElementById("chat-list");

  if (chats.length === 0) {
    list.innerHTML =
      me.role === "tutee"
        ? `<p class="chat-list-empty">No chats yet. Choose a tutor from the Matching tab to start one.</p>`
        : `<p class="chat-list-empty">No chats yet. They'll show up here once a tutee chooses you.</p>`;
    renderChatsTabBadge(0);
    return;
  }

  let totalUnread = 0;
  const rows = await Promise.all(
    chats.map(async (chat) => {
      const partnerEmail = otherPartyEmail(chat, me.email);
      const partnerName = otherPartyName(chat, me.email) || partnerEmail;
      const msgs = await getMessagesForChat(chat.id);
      const last = msgs[msgs.length - 1];
      const preview = last ? (last.attachment ? `📎 ${last.attachment.name}` : last.text) : "No messages yet";
      const accentColor = subjectColor(chat.subject);
      const unread = chat.id === activeChatId ? 0 : await getUnreadCountForChat(me.email, chat.id);
      totalUnread += unread;
      return `
        <button class="chat-list-item ${chat.id === activeChatId ? "active" : ""}" data-chat-id="${chat.id}" style="--accent-color:${accentColor}">
          <span class="chat-avatar" style="background:${colorForPerson(partnerEmail)}">${initials(partnerName)}</span>
          <span class="chat-list-item-body">
            <span class="chat-list-item-name">${escapeHtml(partnerName)}</span>
            <span class="chat-list-item-preview"><span class="chip-dot" style="background:${accentColor}"></span>${escapeHtml(preview)}</span>
          </span>
          ${unread ? `<span class="chat-list-item-unread">${unread}</span>` : ""}
        </button>`;
    })
  );
  list.innerHTML = rows.join("");

  list.querySelectorAll(".chat-list-item").forEach((btn) => {
    btn.addEventListener("click", () => openChat(btn.dataset.chatId));
  });

  renderChatsTabBadge(totalUnread);
}

function renderChatsTabBadge(totalUnread) {
  const badge = document.getElementById("chats-tab-badge");
  if (!badge) return;
  badge.textContent = String(totalUnread);
  badge.style.display = totalUnread ? "inline-block" : "none";
}

async function openChat(chatId) {
  activeChatId = chatId;
  const chat = await getChatById(chatId);
  if (!chat) return;

  document.getElementById("chat-empty").style.display = "none";
  document.getElementById("chat-active").style.display = "flex";

  const accentColor = subjectColor(chat.subject);
  document.getElementById("chat-partner-name").textContent = otherPartyName(chat, me.email) || otherPartyEmail(chat, me.email);
  const subjectEl = document.getElementById("chat-subject");
  subjectEl.textContent = chat.subject || "General tutoring";
  subjectEl.style.background = `${accentColor}22`;
  subjectEl.style.color = accentColor;
  document.getElementById("chat-thread-head").style.setProperty("--accent-color", accentColor);
  document.getElementById("schedule-btn").style.display = me.role === "tutor" ? "inline-block" : "none";
  renderRateWidget(chat);

  markChatRead(me.email, chatId);
  renderChatList();
  renderMessages(chatId);
}

async function renderMessages(chatId) {
  if (chatId !== activeChatId) return;
  const messages = await getMessagesForChat(chatId);
  if (chatId !== activeChatId) return; // could have switched chats while awaiting
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

async function handleSendMessage(e) {
  e.preventDefault();
  if (!activeChatId) return;
  const input = document.getElementById("message-input");
  const text = input.value.trim();
  if (!text && !pendingAttachment) return;

  const chatId = activeChatId;
  await addMessage(chatId, text, pendingAttachment);
  input.value = "";
  clearAttachment();
  renderMessages(chatId);
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

// ---------------- Matching tab (tutees only — they choose a tutor to start
// chatting with, based on shared classes, availability, and rate; tutors
// don't get a browsing/selecting view, only Chats) ----------------

function initMatchingTab() {
  const deptFilter = document.getElementById("matching-department-filter");
  Object.keys(COURSE_CATALOG).forEach((category) => {
    deptFilter.innerHTML += `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`;
  });
  const availFilter = document.getElementById("matching-availability-filter");
  AVAILABILITY_BLOCKS.forEach((block) => {
    availFilter.innerHTML += `<option value="${escapeHtml(block)}">${escapeHtml(block)}</option>`;
  });
  deptFilter.addEventListener("change", renderMatchingList);
  availFilter.addEventListener("change", renderMatchingList);
  document.getElementById("matching-sort-filter").addEventListener("change", renderMatchingList);

  document.getElementById("candidate-profile-close").addEventListener("click", () => toggleModal("candidate-profile-modal", false));

  renderMatchingList();
}

// Best-effort read of a free-text rate like "$20/hr" or "free during Warrior
// Time" into a comparable number, for sorting only — not validated input.
function parseRateValue(text) {
  if (!text) return Infinity;
  const match = text.match(/\d+(\.\d+)?/);
  if (match) return parseFloat(match[0]);
  return text.toLowerCase().includes("free") ? 0 : Infinity;
}

function candidateSubtitle(profile) {
  return [profile.classYear, gradeRangeText(profile.gradeLevels)].filter(Boolean).join(" · ");
}

// Only a tutee calls this — they're the one choosing a tutor to chat with.
async function startChatWith(tutorEmail) {
  const myProfile = await getMyProfile();
  const { profile: tutorProfile } = await getProfileByEmail(tutorEmail);
  const shared = myProfile.subjects.find((s) => tutorProfile.subjects.includes(s));
  const subject = shared || myProfile.subjects[0] || tutorProfile.subjects[0] || "General tutoring";
  const existingChats = await getMyChats();
  const isNewChat = !existingChats.some((c) => c.tutorEmail === tutorEmail);
  const chat = await createChat(tutorEmail, subject);
  if (isNewChat && myProfile.offer) {
    await addMessage(chat.id, `${me.name} offered ${myProfile.offer} for tutoring — reply here to agree on a rate.`, null, true);
  }
  window.goToTab("chats");
  openChat(chat.id);
}

// `user`/`profile` are always a tutor's — this modal only opens from a
// tutee's Matching tab.
function openCandidateProfileModal(user, profile) {
  document.getElementById("candidate-profile-name").textContent = user.name;
  document.getElementById("candidate-profile-subtitle").textContent = candidateSubtitle(profile);
  document.getElementById("candidate-profile-bio").textContent = profile.bio || "No bio yet.";
  document.getElementById("candidate-profile-courses-label").textContent = "Classes They Can Teach";

  const avatarImg = document.getElementById("candidate-profile-avatar-img");
  const avatarInitials = document.getElementById("candidate-profile-avatar-initials");
  if (profile.photo) {
    avatarImg.src = profile.photo;
    avatarImg.style.display = "block";
    avatarInitials.style.display = "none";
  } else {
    avatarImg.style.display = "none";
    avatarInitials.style.display = "flex";
    avatarInitials.textContent = initials(user.name);
  }

  const videoEl = document.getElementById("candidate-profile-video");
  if (profile.introVideo) {
    videoEl.src = profile.introVideo;
    videoEl.style.display = "block";
  } else {
    videoEl.removeAttribute("src");
    videoEl.style.display = "none";
  }

  const extraRows = [];
  if (profile.rate) extraRows.push(["Rate", profile.rate]);
  if (profile.tutoringHours) extraRows.push(["Tutoring Hours", `${profile.tutoringHours} hrs`]);

  const extraSection = document.getElementById("candidate-profile-extra-section");
  if (extraRows.length) {
    extraSection.style.display = "block";
    document.getElementById("candidate-profile-extra-label").textContent = "Details";
    document.getElementById("candidate-profile-extra").innerHTML = extraRows
      .map(
        ([label, value]) => `
        <div class="candidate-profile-extra-row">
          <span class="candidate-profile-extra-label">${escapeHtml(label)}</span>
          <span class="candidate-profile-extra-value">${escapeHtml(value)}</span>
        </div>`
      )
      .join("");
  } else {
    extraSection.style.display = "none";
  }

  const coursesEl = document.getElementById("candidate-profile-courses");
  coursesEl.innerHTML = profile.subjects.length
    ? profile.subjects.map((s) => `<span class="course-tag">${escapeHtml(s)}</span>`).join("")
    : `<p class="chat-list-empty">Nothing listed yet.</p>`;

  document.getElementById("candidate-profile-chat-btn").onclick = () => {
    toggleModal("candidate-profile-modal", false);
    startChatWith(user.email);
  };

  // Feedback: tutees can leave (and see) comments about a tutor.
  renderCandidateComments(user.email);
  document.getElementById("candidate-comment-hint").textContent = "";
  document.getElementById("candidate-comment-form").onsubmit = async (e) => {
    e.preventDefault();
    const input = document.getElementById("candidate-comment-input");
    const text = input.value.trim();
    if (!text) return;
    await addComment(user.email, text);
    input.value = "";
    document.getElementById("candidate-comment-hint").textContent = "Thanks — this is shared with the program coordinator.";
    renderCandidateComments(user.email);
  };

  toggleModal("candidate-profile-modal", true);
}

async function renderCandidateComments(tutorEmail) {
  const comments = await getVisibleCommentsForTutor(tutorEmail);
  document.getElementById("candidate-profile-comments-list").innerHTML = comments.length
    ? comments
        .map(
          (c) => `
      <div class="tutor-comment-row">
        <span class="tutor-comment-author">${escapeHtml(c.authorName || c.authorEmail)}</span>
        <span class="tutor-comment-date">${formatDateTime(c.createdAt)}</span>
        <p class="tutor-comment-text">${escapeHtml(c.text)}</p>
      </div>`
        )
        .join("")
    : `<p class="chat-list-empty">No feedback yet — be the first!</p>`;
}

async function renderMatchingList() {
  const listEl = document.getElementById("matching-list");
  const legendEl = document.getElementById("matching-legend-text");
  if (!listEl || me.role !== "tutee") return;

  const [tutorPairs, myProfile, myChats] = await Promise.all([getAllTutors(), getMyProfile(), getMyChats()]);

  // Only tutors qualified to teach at least one class this tutee needs — the
  // tutee's "classes need help with" and the tutor's "classes can teach"
  // lists actually overlap.
  const matched = tutorPairs
    .map(({ user, profile }) => {
      const shared = myProfile.subjects.filter((s) => (profile.subjects || []).includes(s));
      return { user, profile, shared };
    })
    .filter((m) => m.shared.length > 0);

  const deptValue = document.getElementById("matching-department-filter").value;
  const availValue = document.getElementById("matching-availability-filter").value;
  const sortValue = document.getElementById("matching-sort-filter").value;
  const filtered = matched.filter((m) => {
    const deptOk = !deptValue || m.shared.some((label) => categoryForLabel(label) === deptValue);
    const availOk = !availValue || (m.profile.availability || []).some((a) => a.endsWith(availValue));
    return deptOk && availOk;
  });

  if (sortValue === "rate") {
    filtered.sort((a, b) => parseRateValue(a.profile.rate) - parseRateValue(b.profile.rate));
  } else if (sortValue === "hours") {
    filtered.sort((a, b) => (parseFloat(b.profile.tutoringHours) || 0) - (parseFloat(a.profile.tutoringHours) || 0));
  } else {
    filtered.sort((a, b) => b.shared.length - a.shared.length);
  }

  legendEl.textContent = `A filled sky chip means you both have that exact class. ${filtered.length} tutor${
    filtered.length === 1 ? "" : "s"
  } match right now.`;

  const departmentCount = new Set(myProfile.subjects.map(categoryForLabel).filter(Boolean)).size;
  document.getElementById("matching-stats").innerHTML = `
    <div class="matching-stat"><span class="matching-stat-num">${matched.length}</span><span class="matching-stat-label">Matches</span></div>
    <div class="matching-stat"><span class="matching-stat-num">${myProfile.subjects.length}</span><span class="matching-stat-label">Classes You Need</span></div>
    <div class="matching-stat"><span class="matching-stat-num">${departmentCount}</span><span class="matching-stat-label">Departments</span></div>
  `;

  if (tutorPairs.length === 0) {
    listEl.innerHTML = `<p class="chat-list-empty">No tutors have signed up yet. Check back soon.</p>`;
    return;
  }
  if (matched.length === 0) {
    listEl.innerHTML = `<p class="chat-list-empty">No tutors share any of your classes yet. Update your classes on your profile, or check back soon.</p>`;
    return;
  }
  if (filtered.length === 0) {
    listEl.innerHTML = `<p class="chat-list-empty">No matches for these filters. Try a different department or availability.</p>`;
    return;
  }

  listEl.innerHTML = filtered
    .map(({ user: u, profile, shared }) => {
      const chipsHtml = shared
        .map(
          (s) =>
            `<span class="match-subject-chip shared"><span class="chip-dot" style="background:${subjectColor(s)}"></span>${escapeHtml(
              s
            )}</span>`
        )
        .join("");
      const subtitle = candidateSubtitle(profile);
      const existingChat = myChats.some((c) => c.tutorEmail === u.email);
      const accentColor = subjectColor(shared[0]);
      return `
        <div class="match-row" style="--accent-color:${accentColor}">
          <span class="chat-avatar" style="background:${colorForPerson(u.email)}">${initials(u.name)}</span>
          <span class="match-row-body">
            <span class="match-row-name-line">
              <span class="new-chat-row-name">${escapeHtml(u.name)}</span>
              ${subtitle ? `<span class="match-row-subtitle">${escapeHtml(subtitle)}</span>` : ""}
              ${profile.rate ? `<span class="match-rate-badge">${escapeHtml(profile.rate)}</span>` : ""}
            </span>
            <span class="match-subjects">${chipsHtml}</span>
          </span>
          <span class="match-row-side">
            <span class="match-shared-badge">${shared.length} shared</span>
            <span class="match-row-actions">
              <button class="btn-ghost match-view-profile" data-email="${u.email}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                View Profile
              </button>
              <button class="btn-primary new-chat-start" data-email="${u.email}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                ${existingChat ? "Go to Chat" : "Start Chat"}
              </button>
            </span>
          </span>
        </div>`;
    })
    .join("");

  listEl.querySelectorAll(".new-chat-start").forEach((btn) => {
    btn.addEventListener("click", () => startChatWith(btn.dataset.email));
  });
  listEl.querySelectorAll(".match-view-profile").forEach((btn) => {
    btn.addEventListener("click", () => {
      const match = filtered.find((m) => m.user.email === btn.dataset.email);
      if (match) openCandidateProfileModal(match.user, match.profile);
    });
  });
}

// ---------------- Schedule tab (tutors only) ----------------

function initScheduleTab() {
  populateScheduleTuteeSelect();
  renderScheduleUpcoming();
  document.getElementById("schedule-tab-form").addEventListener("submit", handleScheduleTabSubmit);
}

async function populateScheduleTuteeSelect(preselectEmail) {
  const select = document.getElementById("schedule-tutee-select");
  if (!select) return;
  const priorValue = preselectEmail || select.value;

  const chats = await getMyChats();
  const tuteeEmails = chats.map((c) => otherPartyEmail(c, me.email));
  const nameByEmail = new Map(chats.map((c) => [otherPartyEmail(c, me.email), otherPartyName(c, me.email)]));

  if (tuteeEmails.length === 0) {
    select.innerHTML = `<option value="">No matched tutees yet — visit the Matching tab first</option>`;
    select.disabled = true;
    return;
  }

  select.disabled = false;
  select.innerHTML = tuteeEmails
    .map((email) => `<option value="${email}">${escapeHtml(nameByEmail.get(email) || email)}</option>`)
    .join("");

  if (priorValue && tuteeEmails.includes(priorValue)) select.value = priorValue;
}

async function goToScheduleForActiveChat() {
  const chat = await getChatById(activeChatId);
  if (!chat) return;
  const tuteeEmail = otherPartyEmail(chat, me.email);
  window.goToTab("schedule");
  populateScheduleTuteeSelect(tuteeEmail);
}

async function handleScheduleTabSubmit(e) {
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
  if (zoomLink && !/^https?:\/\//i.test(zoomLink)) {
    errorEl.textContent = "Zoom link should start with http:// or https://";
    return;
  }
  const datetime = new Date(`${date}T${time}`);
  if (Number.isNaN(datetime.getTime()) || datetime < new Date()) {
    errorEl.textContent = "Pick a time in the future.";
    return;
  }

  const chats = await getMyChats();
  const chat = chats.find((c) => c.tutorEmail === me.email && c.tuteeEmail === tuteeEmail);
  if (!chat) {
    errorEl.textContent = "Couldn't find a chat with that tutee.";
    return;
  }

  let session;
  try {
    session = await createSession({ chatId: chat.id, datetime: datetime.toISOString(), durationMinutes: duration, zoomLink });
  } catch (err) {
    errorEl.textContent = err.message;
    return;
  }

  await addMessage(chat.id, `Session scheduled for ${formatDateTime(session.datetime)} (${duration} min).`, null, true);

  document.getElementById("schedule-tab-form").reset();
  renderScheduleUpcoming();
  renderSessions();
  renderChatList();
}

async function renderScheduleUpcoming() {
  const list = document.getElementById("schedule-upcoming-list");
  if (!list) return;
  const sessions = await getMySessions();
  list.innerHTML = sessionListHtml(sessions);
  wireSessionButtons(list);
}

// ---------------- Sessions sidebar ----------------

async function renderSessions() {
  const sessions = await getMySessions();
  const list = document.getElementById("sessions-list");
  list.innerHTML = sessionListHtml(sessions);
  wireSessionButtons(list);
}

function sessionListHtml(sessions) {
  if (sessions.length === 0) {
    return `<p class="chat-list-empty">No sessions scheduled yet.</p>`;
  }

  const now = Date.now();
  return sessions
    .map((s) => {
      const partnerName = otherPartyName(s, me.email) || otherPartyEmail(s, me.email);
      const start = new Date(s.datetime).getTime();
      const joinOpensAt = start - 5 * 60000;
      const end = start + s.durationMinutes * 60000 + 15 * 60000;
      const cancelled = s.status === "cancelled";
      const cancelledByName = s.cancelledBy === s.tutorEmail ? s.tutorName : s.tuteeName;

      let statusHtml;
      if (cancelled) {
        statusHtml = `<span class="session-countdown session-cancelled-label">Cancelled${
          s.cancelledBy === me.email ? " by you" : cancelledByName ? ` by ${escapeHtml(cancelledByName)}` : ""
        }</span>`;
      } else if (now < joinOpensAt) {
        statusHtml = `<span class="session-countdown">${countdownText(start - now)}</span>`;
      } else if (now <= end) {
        statusHtml = `<button class="btn-primary session-join" data-session-id="${s.id}">Join Video Call</button>`;
      } else {
        statusHtml = `<span class="session-countdown session-past">Completed</span>`;
      }

      let zoomHtml = "";
      if (!cancelled) {
        if (s.zoomLink) {
          zoomHtml = `
            <div class="session-zoom-row">
              <a class="btn-ghost session-zoom" href="${escapeHtml(s.zoomLink)}" target="_blank" rel="noopener noreferrer">Open Zoom Link</a>
              <button type="button" class="link-btn session-zoom-copy" data-zoom-link="${escapeHtml(s.zoomLink)}">Copy</button>
              ${
                me.email === s.tutorEmail
                  ? `<button type="button" class="link-btn session-zoom-edit" data-session-id="${s.id}" data-chat-id="${s.chatId}" data-zoom-link="${escapeHtml(s.zoomLink)}">Edit</button>`
                  : ""
              }
            </div>`;
        } else if (me.email === s.tutorEmail) {
          zoomHtml = `<button type="button" class="link-btn session-zoom-edit" data-session-id="${s.id}" data-chat-id="${s.chatId}" data-zoom-link="">+ Add Zoom Link</button>`;
        }
      }

      const cancelHtml =
        !cancelled && now < end
          ? `<button type="button" class="link-btn session-cancel" data-session-id="${s.id}" data-chat-id="${s.chatId}" data-datetime="${s.datetime}">Cancel Session</button>`
          : "";

      return `
        <div class="session-card ${cancelled ? "session-card-cancelled" : ""}" style="--accent-color:${subjectColor(s.subject)}">
          <span class="session-partner">${escapeHtml(partnerName)}</span>
          <span class="session-subject">${escapeHtml(s.subject || "General tutoring")}</span>
          <span class="session-time">${formatDateTime(s.datetime)} · ${s.durationMinutes} min</span>
          ${statusHtml}
          ${zoomHtml}
          ${cancelHtml}
        </div>`;
    })
    .join("");
}

function wireSessionButtons(container) {
  container.querySelectorAll(".session-join").forEach((btn) => {
    btn.addEventListener("click", () => {
      window.location.href = `/video?session=${btn.dataset.sessionId}`;
    });
  });
  container.querySelectorAll(".session-cancel").forEach((btn) => {
    btn.addEventListener("click", () => handleCancelSession(btn.dataset.sessionId, btn.dataset.chatId, btn.dataset.datetime));
  });
  container.querySelectorAll(".session-zoom-copy").forEach((btn) => {
    btn.addEventListener("click", () => {
      const flash = (label) => {
        const original = btn.textContent;
        btn.textContent = label;
        setTimeout(() => {
          btn.textContent = original;
        }, 1500);
      };
      if (!navigator.clipboard) {
        flash("Copy failed");
        return;
      }
      navigator.clipboard
        .writeText(btn.dataset.zoomLink)
        .then(() => flash("Copied!"))
        .catch(() => flash("Copy failed"));
    });
  });
  container.querySelectorAll(".session-zoom-edit").forEach((btn) => {
    btn.addEventListener("click", () => handleEditZoomLink(btn.dataset.sessionId, btn.dataset.chatId, btn.dataset.zoomLink));
  });
}

// Cancellation is a status flip (not a delete) so both people keep a record.
// The other party is "notified" the same way every other session update is
// communicated here — a system message dropped into their shared chat.
async function handleCancelSession(sessionId, chatId, datetime) {
  if (!confirm("Cancel this session? The other person will see this in your chat.")) return;

  await cancelSession(sessionId);
  if (chatId) {
    await addMessage(chatId, `${me.name} cancelled the session scheduled for ${formatDateTime(datetime)}.`, null, true);
  }

  renderSessions();
  renderScheduleUpcoming();
  renderChatList();
  if (activeChatId === chatId) renderMessages(chatId);
}

// Zoom link editing after scheduling — not just at creation time — plus a
// basic URL sanity check. Posts a system message so a link change counts as
// an "essential session update" the other party sees, same as cancellation.
async function handleEditZoomLink(sessionId, chatId, currentLink) {
  const value = prompt("Zoom link for this session:", currentLink || "");
  if (value === null) return;
  const trimmed = value.trim();
  if (trimmed && !/^https?:\/\//i.test(trimmed)) {
    alert("That doesn't look like a valid link — it should start with http:// or https://");
    return;
  }

  try {
    await updateSessionZoomLink(sessionId, trimmed);
  } catch (err) {
    alert(err.message);
    return;
  }
  if (chatId) {
    await addMessage(chatId, trimmed ? `Zoom link updated: ${trimmed}` : "Zoom link removed.", null, true);
  }

  renderSessions();
  renderScheduleUpcoming();
  if (activeChatId === chatId) renderMessages(chatId);
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

// ---------------- Color helpers ----------------
// Deterministic per-person avatar color (hashed from email, stable across
// reloads) and per-subject color (reusing the course-catalog category
// palette), so the Matching and Chats UIs read as more distinct/lively.

function colorForPerson(key) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return PERSON_COLORS[hash % PERSON_COLORS.length];
}

function subjectColor(subject) {
  return CATEGORY_COLORS[categoryForLabel(subject)] || "#8a94a6";
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
