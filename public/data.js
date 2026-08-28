// ---------- Course catalog ----------
// Pulled from the school's course list, teachers stripped (a class taught by
// three different teachers is still one class) and grouped by base course
// name, with the levels it's actually offered at. "Regular" covers plain and
// "Accelerated" listings, since the picker only distinguishes Regular/Honors/AP.

const LEVEL_ORDER = ["Regular", "Honors", "AP"];

const COURSE_CATALOG = {
  English: [
    { name: "African American Literature", levels: ["Regular"] },
    { name: "American Literature", levels: ["Regular"] },
    { name: "English Language Composition", levels: ["AP"] },
    { name: "English Literature & Composition", levels: ["AP"] },
    { name: "British Literature", levels: ["Regular"] },
    { name: "English 9", levels: ["Regular", "Honors"] },
    { name: "English 10", levels: ["Regular", "Honors"] },
    { name: "Philosophy in Literature", levels: ["Honors"] },
    { name: "Screenwriting & Literature", levels: ["Regular"] },
  ],
  Math: [
    { name: "Advanced Data Analysis", levels: ["Honors"] },
    { name: "Algebra I", levels: ["Regular"] },
    { name: "Algebra II", levels: ["Regular", "Honors"] },
    { name: "Calculus AB", levels: ["AP"] },
    { name: "Calculus BC", levels: ["AP"] },
    { name: "Calculus", levels: ["Honors"] },
    { name: "Statistics", levels: ["Honors", "AP"] },
    { name: "Geometry", levels: ["Regular", "Honors"] },
    { name: "Linear Algebra", levels: ["Honors"] },
    { name: "Multi-Variable Calculus", levels: ["Honors"] },
    { name: "Pre-Algebra", levels: ["Regular"] },
    { name: "Pre-Calculus", levels: ["Honors"] },
    { name: "Pre-Calculus Accelerated", levels: ["Regular"] },
  ],
  Science: [
    { name: "Anatomy & Physiology", levels: ["Regular", "Honors"] },
    { name: "Biology", levels: ["Regular", "Honors", "AP"] },
    { name: "Chemistry", levels: ["Regular", "Honors", "AP"] },
    { name: "Environmental Science", levels: ["AP"] },
    { name: "Physics", levels: ["Regular", "Honors", "AP"] },
    { name: "Physics C: E&M", levels: ["AP"] },
    { name: "Forensic Science", levels: ["Regular"] },
    { name: "Integrated Science", levels: ["Regular"] },
    { name: "Scientific Research", levels: ["Regular"] },
  ],
  "Social Sciences": [
    { name: "African American Studies", levels: ["AP"] },
    { name: "Human Geography", levels: ["AP"] },
    { name: "Microeconomics", levels: ["AP"] },
    { name: "Psychology", levels: ["AP"] },
    { name: "US Government & Politics", levels: ["AP"] },
    { name: "US History", levels: ["Regular", "AP"] },
    { name: "World History", levels: ["AP"] },
    { name: "Civic Leadership & Communication", levels: ["Regular"] },
    { name: "Economics/US Government", levels: ["Regular"] },
    { name: "History & Music", levels: ["Honors"] },
    { name: "Modern World History", levels: ["Regular"] },
    { name: "Speech", levels: ["Regular"] },
    { name: "Student Government & Leadership", levels: ["Regular"] },
    { name: "US Government/Economics", levels: ["Regular"] },
  ],
  "World Language": [
    { name: "Chinese Language & Culture", levels: ["AP"] },
    { name: "Latin", levels: ["AP"] },
    { name: "Spanish Language & Culture", levels: ["AP"] },
    { name: "ASL I", levels: ["Regular"] },
    { name: "ASL II", levels: ["Regular"] },
    { name: "ASL III", levels: ["Regular"] },
    { name: "ASL IV", levels: ["Honors"] },
    { name: "French I", levels: ["Regular"] },
    { name: "French II", levels: ["Regular"] },
    { name: "French III", levels: ["Regular"] },
    { name: "French IV", levels: ["Honors"] },
    { name: "Latin I", levels: ["Regular"] },
    { name: "Latin II", levels: ["Regular"] },
    { name: "Mandarin I", levels: ["Regular"] },
    { name: "Mandarin II", levels: ["Regular"] },
    { name: "Mandarin III", levels: ["Regular"] },
    { name: "Spanish I", levels: ["Regular"] },
    { name: "Spanish II", levels: ["Regular"] },
    { name: "Spanish III", levels: ["Regular"] },
  ],
  // Not academic courses, but folded into the same "classes you've taken /
  // need help with" picker at the coordinator's request rather than kept as
  // separate free-text fields — same matching mechanics apply. Every entry
  // is single-level since "Regular/Honors/AP" doesn't mean anything here.
  Music: [
    { name: "Piano", levels: ["Regular"] },
    { name: "Guitar", levels: ["Regular"] },
    { name: "Bass Guitar", levels: ["Regular"] },
    { name: "Violin", levels: ["Regular"] },
    { name: "Viola", levels: ["Regular"] },
    { name: "Cello", levels: ["Regular"] },
    { name: "Drums", levels: ["Regular"] },
    { name: "Flute", levels: ["Regular"] },
    { name: "Clarinet", levels: ["Regular"] },
    { name: "Saxophone", levels: ["Regular"] },
    { name: "Trumpet", levels: ["Regular"] },
    { name: "Trombone", levels: ["Regular"] },
    { name: "Voice (Singing)", levels: ["Regular"] },
    { name: "Ukulele", levels: ["Regular"] },
  ],
  Athletics: [
    { name: "Basketball", levels: ["Regular"] },
    { name: "Soccer", levels: ["Regular"] },
    { name: "Volleyball", levels: ["Regular"] },
    { name: "Tennis", levels: ["Regular"] },
    { name: "Track & Field", levels: ["Regular"] },
    { name: "Cross Country", levels: ["Regular"] },
    { name: "Swimming", levels: ["Regular"] },
    { name: "Baseball", levels: ["Regular"] },
    { name: "Softball", levels: ["Regular"] },
    { name: "Football", levels: ["Regular"] },
    { name: "Golf", levels: ["Regular"] },
    { name: "Wrestling", levels: ["Regular"] },
    { name: "Water Polo", levels: ["Regular"] },
    { name: "Lacrosse", levels: ["Regular"] },
  ],
};

const CATEGORY_COLORS = {
  English: "#7c5cd6",
  Math: "#1a8f80",
  Science: "#4c9a5b",
  "Social Sciences": "#a13b52",
  "World Language": "#d98a34",
  Music: "#c2477a",
  Athletics: "#3b7dbf",
};

function findCatalogCourse(course) {
  for (const category of Object.keys(COURSE_CATALOG)) {
    const found = COURSE_CATALOG[category].find((c) => c.name === course);
    if (found) return { ...found, category };
  }
  return null;
}

function courseLabel(course, level) {
  if (level === "AP") return `AP ${course}`;
  if (level === "Honors") return `${course} Honors`;
  return course;
}

// Flattens a category into one selectable row per (course, level) pair —
// e.g. Chemistry (Regular/Honors/AP) becomes three separate rows.
function getCourseCategoryRows(category) {
  return COURSE_CATALOG[category].flatMap((c) =>
    c.levels.map((level) => ({ course: c.name, level, category, label: courseLabel(c.name, level) }))
  );
}

function totalCatalogCourseCount() {
  return Object.values(COURSE_CATALOG).reduce((sum, courses) => sum + courses.length, 0);
}

let labelCategoryCache = null;
function categoryForLabel(label) {
  if (!labelCategoryCache) {
    labelCategoryCache = {};
    Object.keys(COURSE_CATALOG).forEach((category) => {
      getCourseCategoryRows(category).forEach((r) => {
        labelCategoryCache[r.label] = category;
      });
    });
  }
  return labelCategoryCache[label] || "";
}

// "6th"/"12th" -> 6/12, for turning a tutor's gradeLevels selection into a
// human-readable range like "teaches grades 6-10".
function gradeRangeText(gradeLevels) {
  if (!gradeLevels || gradeLevels.length === 0) return "";
  const numbers = gradeLevels.map((g) => parseInt(g, 10)).sort((a, b) => a - b);
  const min = numbers[0];
  const max = numbers[numbers.length - 1];
  return min === max ? `teaches grade ${min}` : `teaches grades ${min}-${max}`;
}

// Cross-course prerequisite edges, beyond the automatic same-course level
// tiering (Regular < Honors < AP) handled in getTeachableCourses(). Kept
// intentionally small — only chains that are unambiguous from the course
// numbering itself (World Language I/II/III/IV sequences, English 9 -> 10)
// plus the one explicit example the school gave us (Statistics -> Advanced
// Data Analysis). Add more edges here as real prerequisite info comes in.
function chainEdges(coursesLowToHigh) {
  const edges = [];
  for (let i = 1; i < coursesLowToHigh.length; i++) {
    edges.push({
      course: coursesLowToHigh[i].course,
      level: coursesLowToHigh[i].level,
      unlocksCourse: coursesLowToHigh[i - 1].course,
      unlocksLevel: coursesLowToHigh[i - 1].level,
    });
  }
  return edges;
}

const CROSS_COURSE_PREREQS = [
  { course: "Advanced Data Analysis", level: "Honors", unlocksCourse: "Statistics", unlocksLevel: "AP" },
  ...chainEdges([
    { course: "ASL I", level: "Regular" },
    { course: "ASL II", level: "Regular" },
    { course: "ASL III", level: "Regular" },
    { course: "ASL IV", level: "Honors" },
  ]),
  ...chainEdges([
    { course: "French I", level: "Regular" },
    { course: "French II", level: "Regular" },
    { course: "French III", level: "Regular" },
    { course: "French IV", level: "Honors" },
  ]),
  ...chainEdges([
    { course: "Latin I", level: "Regular" },
    { course: "Latin II", level: "Regular" },
    { course: "Latin", level: "AP" },
  ]),
  ...chainEdges([
    { course: "Mandarin I", level: "Regular" },
    { course: "Mandarin II", level: "Regular" },
    { course: "Mandarin III", level: "Regular" },
    { course: "Chinese Language & Culture", level: "AP" },
  ]),
  ...chainEdges([
    { course: "Spanish I", level: "Regular" },
    { course: "Spanish II", level: "Regular" },
    { course: "Spanish III", level: "Regular" },
    { course: "Spanish Language & Culture", level: "AP" },
  ]),
  ...chainEdges([
    { course: "English 9", level: "Regular" },
    { course: "English 10", level: "Regular" },
  ]),
  ...chainEdges([
    { course: "English 9", level: "Honors" },
    { course: "English 10", level: "Honors" },
  ]),
];

// Everything reachable from a single (course, level): itself, any lower
// level of the same course (AP unlocks Honors and Regular, Honors unlocks
// Regular), and anything chained through CROSS_COURSE_PREREQS — transitively,
// so Advanced Data Analysis also reaches Statistics Honors (AP Statistics is
// the direct prereq, and AP unlocks Honors of that same course in turn).
function reachableFrom(startCourse, startLevel) {
  const unlocked = new Map(); // "course::level" -> {course, level}
  const queue = [{ course: startCourse, level: startLevel }];

  while (queue.length) {
    const { course, level } = queue.shift();
    const key = `${course}::${level}`;
    if (unlocked.has(key)) continue;
    unlocked.set(key, { course, level });

    const catalogEntry = findCatalogCourse(course);
    if (catalogEntry) {
      const rank = LEVEL_ORDER.indexOf(level);
      catalogEntry.levels.forEach((lvl) => {
        if (LEVEL_ORDER.indexOf(lvl) <= rank && !unlocked.has(`${course}::${lvl}`)) {
          queue.push({ course, level: lvl });
        }
      });
    }

    CROSS_COURSE_PREREQS.filter((e) => e.course === course && e.level === level).forEach((e) => {
      if (!unlocked.has(`${e.unlocksCourse}::${e.unlocksLevel}`)) {
        queue.push({ course: e.unlocksCourse, level: e.unlocksLevel });
      }
    });
  }

  return Array.from(unlocked.values());
}

// Given the classes a tutor has taken, returns every class they're qualified
// to teach, each tagged with `viaLabel`: null if they took it directly, or
// the label of the taken class that unlocked it (tracing back to the root
// taken class even across multiple hops, e.g. Algebra 1 shows "via AP
// Calculus BC" rather than an intermediate step) — so the UI can show
// "You took it" vs. "via X".
function getTeachableCourses(takenCourses) {
  const taken = takenCourses || [];
  const takenKeys = new Set(taken.map((t) => `${t.course}::${t.level}`));
  const results = new Map(); // "course::level" -> { course, level, sourceLabel }

  taken.forEach((t) => {
    reachableFrom(t.course, t.level).forEach(({ course, level }) => {
      const key = `${course}::${level}`;
      if (!results.has(key)) {
        results.set(key, { course, level, sourceLabel: courseLabel(t.course, t.level) });
      }
    });
  });

  return Array.from(results.values()).map(({ course, level, sourceLabel }) => {
    const catalogEntry = findCatalogCourse(course);
    const key = `${course}::${level}`;
    return {
      course,
      level,
      category: catalogEntry ? catalogEntry.category : "",
      label: courseLabel(course, level),
      viaLabel: takenKeys.has(key) ? null : sourceLabel,
    };
  });
}

const GRADE_LEVELS = ["6th", "7th", "8th", "9th", "10th", "11th", "12th"];
const CLASS_YEARS = ["Freshman", "Sophomore", "Junior", "Senior"];
const AVAILABILITY_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const AVAILABILITY_BLOCKS = ["Before School", "Warrior Time", "After School", "Evening"];
// Evening defaults to Zoom-only (no location to collect); the rest default to
// on-campus. Both are just defaults now — tutors/tutees can override the
// format per block via profile.availabilityFormats (see AVAILABILITY_FORMATS).
const ZOOM_ONLY_BLOCKS = ["Evening"];
const AVAILABILITY_FORMATS = ["In-Person", "Online", "Both"];

const PAYMENT_METHODS = ["Venmo", "Zelle", "PayPal", "Cash"];

// ---------- Profiles ----------
// Everything below this point talks to the real database on the Mac Studio
// via authFetch (see core.js) instead of localStorage — accounts, profiles,
// chats, messages, and sessions are shared server-side now, so two different
// people on two different devices actually see the same data.

async function getMyProfile() {
  return authFetchJson("/api/profiles/me");
}

async function saveMyProfile(profile) {
  await authFetchJson("/api/profiles/me", { method: "PUT", body: JSON.stringify(profile) });
  notifyUpdate("profile");
}

async function getProfileByEmail(email) {
  return authFetchJson(`/api/profiles/${encodeURIComponent(email)}`);
}

async function getAllTutors() {
  return authFetchJson("/api/tutors");
}

// ---------- Chats ----------

async function getMyChats() {
  return authFetchJson("/api/chats");
}

async function getChatById(chatId) {
  return authFetchJson(`/api/chats/${chatId}`);
}

// Only a tutee calls this — they're the one choosing a tutor to chat with.
async function createChat(tutorEmail, subject) {
  const chat = await authFetchJson("/api/chats", { method: "POST", body: JSON.stringify({ tutorEmail, subject }) });
  notifyUpdate("chat");
  return chat;
}

function otherPartyEmail(chat, myEmail) {
  return chat.tutorEmail === myEmail ? chat.tuteeEmail : chat.tutorEmail;
}

function otherPartyName(chat, myEmail) {
  return chat.tutorEmail === myEmail ? chat.tuteeName : chat.tutorName;
}

// ---------- Messages ----------

async function getMessagesForChat(chatId) {
  return authFetchJson(`/api/chats/${chatId}/messages`);
}

async function addMessage(chatId, text, attachment, system) {
  const message = await authFetchJson(`/api/chats/${chatId}/messages`, {
    method: "POST",
    body: JSON.stringify({ text: text || "", attachment: attachment || null, system: Boolean(system) }),
  });
  notifyUpdate("message");
  return message;
}

// ---------- Read state (unread-message badges) ----------
// Kept as a lightweight per-device localStorage marker rather than moving to
// the server — "have I personally looked at this chat on this device" is a
// reasonable thing to keep local, and it degrades gracefully (worst case,
// the badge just reflects this device's own view) rather than blocking
// anything else in this migration.

const READ_STATE_KEY = "wc_read_state";

function readJSON(key, fallback) {
  return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getReadState() {
  return readJSON(READ_STATE_KEY, {});
}

function markChatRead(email, chatId) {
  const state = getReadState();
  if (!state[email]) state[email] = {};
  state[email][chatId] = new Date().toISOString();
  writeJSON(READ_STATE_KEY, state);
}

async function getUnreadCountForChat(email, chatId) {
  const state = getReadState();
  const lastRead = state[email] && state[email][chatId];
  const messages = await getMessagesForChat(chatId);
  return messages.filter(
    (m) => !m.system && m.sender !== email && (!lastRead || new Date(m.timestamp) > new Date(lastRead))
  ).length;
}

// ---------- Sessions ----------

async function getMySessions() {
  return authFetchJson("/api/sessions");
}

async function getSessionById(id) {
  return authFetchJson(`/api/sessions/${id}`);
}

async function createSession({ chatId, datetime, durationMinutes, zoomLink }) {
  const session = await authFetchJson("/api/sessions", {
    method: "POST",
    body: JSON.stringify({ chatId, datetime, durationMinutes, zoomLink }),
  });
  notifyUpdate("session");
  return session;
}

// Cancellation is a status flip, not a delete — a cancelled session stays
// visible (marked as such) instead of vanishing, so both sides retain a
// record of it.
async function cancelSession(sessionId) {
  const session = await authFetchJson(`/api/sessions/${sessionId}/cancel`, { method: "POST" });
  notifyUpdate("session");
  return session;
}

async function updateSessionZoomLink(sessionId, zoomLink) {
  const session = await authFetchJson(`/api/sessions/${sessionId}/zoom-link`, {
    method: "PATCH",
    body: JSON.stringify({ zoomLink }),
  });
  notifyUpdate("session");
  return session;
}

// ---------- Rate agreements ----------
// Either party can propose; the *other* party accepts — recorded on the
// server (see app/api/chats/[chatId]/rate-agreement/*) so it can be pulled
// into an admin view later.

async function getRateAgreement(chatId) {
  return authFetchJson(`/api/chats/${chatId}/rate-agreement`);
}

async function proposeRate(chatId, rate) {
  const agreement = await authFetchJson(`/api/chats/${chatId}/rate-agreement/propose`, {
    method: "POST",
    body: JSON.stringify({ rate }),
  });
  notifyUpdate("rateAgreement");
  return agreement;
}

async function acceptRate(chatId) {
  const agreement = await authFetchJson(`/api/chats/${chatId}/rate-agreement/accept`, { method: "POST" });
  notifyUpdate("rateAgreement");
  return agreement;
}

// ---------- Comments (tutee feedback on tutors) ----------
// Not real moderation — there's no human reviewer here, just a keyword
// heuristic standing in for one (see lib/comments.ts, now server-side).
// "Warm" comments show up on the tutor's profile immediately; "cold" ones
// are held back (never shown to anyone in this prototype).

async function getVisibleCommentsForTutor(tutorEmail) {
  return authFetchJson(`/api/comments/${encodeURIComponent(tutorEmail)}`);
}

async function addComment(tutorEmail, text) {
  await authFetchJson("/api/comments", { method: "POST", body: JSON.stringify({ tutorEmail, text }) });
  notifyUpdate("comment");
}

// ---------- Cross-tab live updates ----------
// Chats/sessions/etc. now live server-side, so BroadcastChannel is just a
// same-browser "someone made a change, refresh now" nudge layered on top of
// the periodic polling in app.js — it's not the sync mechanism itself
// anymore (that's real cross-device sync via the API), just a nice instant
// same-browser demo touch, same as before.

const wcChannel = "BroadcastChannel" in window ? new BroadcastChannel("wc_updates") : null;

function notifyUpdate(type) {
  if (wcChannel) wcChannel.postMessage({ type, at: Date.now() });
}

function onUpdate(callback) {
  if (wcChannel) {
    wcChannel.onmessage = (e) => callback(e.data.type);
  }
}

function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
