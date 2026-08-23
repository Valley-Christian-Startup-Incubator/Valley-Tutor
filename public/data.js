const PROFILES_KEY = "wc_profiles";
const CHATS_KEY = "wc_chats";
const MESSAGES_KEY = "wc_messages";
const SESSIONS_KEY = "wc_sessions";
const COMMENTS_KEY = "wc_comments";

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

function readJSON(key, fallback) {
  return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // Most likely a quota overrun from a large photo/video data URL — this is
    // a prototype storing everything in localStorage, so there's no server
    // fallback, just a clear message instead of a silent failure.
    alert("This device is out of local storage space. Try removing a photo, video, or old chat attachment and saving again.");
    throw err;
  }
}

// ---------- Profiles ----------

function getProfiles() {
  return readJSON(PROFILES_KEY, {});
}

// Merges the stored profile over these defaults (rather than only using
// defaults when a profile is missing entirely) so an account saved before
// some field existed — schema has grown a lot across iterations — still
// gets a well-formed object instead of `undefined` where code expects an
// array or string.
function getProfile(email) {
  const defaults = {
    photo: "",
    bio: "",
    classYear: "",
    takenCourses: [],
    subjects: [],
    gradeLevel: "",
    gradeLevels: [],
    availability: [],
    availabilityLocations: {},
    availabilityFormats: {},
    introVideo: "",
    rate: "",
    offer: "",
    tutoringHours: "",
    paymentMethods: [],
    paymentHandle: "",
  };
  return Object.assign({}, defaults, getProfiles()[email] || {});
}

function saveProfile(email, profile) {
  const profiles = getProfiles();
  profiles[email] = profile;
  writeJSON(PROFILES_KEY, profiles);
  notifyUpdate("profile");
}

// ---------- Chats ----------

function getChats() {
  return readJSON(CHATS_KEY, []);
}

function getChatsForUser(email) {
  return getChats().filter((c) => c.tutorEmail === email || c.tuteeEmail === email);
}

function getChatById(chatId) {
  return getChats().find((c) => c.id === chatId) || null;
}

function findChat(tutorEmail, tuteeEmail) {
  return getChats().find((c) => c.tutorEmail === tutorEmail && c.tuteeEmail === tuteeEmail) || null;
}

function createChat(tutorEmail, tuteeEmail, subject) {
  const existing = findChat(tutorEmail, tuteeEmail);
  if (existing) return existing;
  const chats = getChats();
  const chat = {
    id: crypto.randomUUID(),
    tutorEmail,
    tuteeEmail,
    subject: subject || "",
    agreedRate: "",
    createdAt: new Date().toISOString(),
  };
  chats.push(chat);
  writeJSON(CHATS_KEY, chats);
  notifyUpdate("chat");
  return chat;
}

function otherPartyEmail(chat, myEmail) {
  return chat.tutorEmail === myEmail ? chat.tuteeEmail : chat.tutorEmail;
}

// The hourly rate a tutor and tutee land on for this relationship, recorded
// on the chat itself (rather than only in a one-off message) so either side
// can look it up later without scrolling back through history.
function setChatAgreedRate(chatId, rate) {
  const chats = getChats();
  const idx = chats.findIndex((c) => c.id === chatId);
  if (idx === -1) return null;
  chats[idx] = { ...chats[idx], agreedRate: rate || "" };
  writeJSON(CHATS_KEY, chats);
  notifyUpdate("chat");
  return chats[idx];
}

// ---------- Messages ----------

function getAllMessages() {
  return readJSON(MESSAGES_KEY, []);
}

function getMessagesForChat(chatId) {
  return getAllMessages()
    .filter((m) => m.chatId === chatId)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

function addMessage(chatId, sender, text, attachment, system) {
  const messages = getAllMessages();
  const message = {
    id: crypto.randomUUID(),
    chatId,
    sender,
    text: text || "",
    attachment: attachment || null,
    system: Boolean(system),
    timestamp: new Date().toISOString(),
  };
  messages.push(message);
  writeJSON(MESSAGES_KEY, messages);
  notifyUpdate("message");
  return message;
}

// ---------- Read state (unread-message badges) ----------
// Per-user, per-chat "last read" timestamps, so the Chats tab and chat list
// can show an unread indicator without a real backend read-receipt system.

const READ_STATE_KEY = "wc_read_state";

function getReadState() {
  return readJSON(READ_STATE_KEY, {});
}

function markChatRead(email, chatId) {
  const state = getReadState();
  if (!state[email]) state[email] = {};
  state[email][chatId] = new Date().toISOString();
  writeJSON(READ_STATE_KEY, state);
}

function getUnreadCountForChat(email, chatId) {
  const state = getReadState();
  const lastRead = state[email] && state[email][chatId];
  return getMessagesForChat(chatId).filter(
    (m) => !m.system && m.sender !== email && (!lastRead || new Date(m.timestamp) > new Date(lastRead))
  ).length;
}

// ---------- Sessions ----------

function getSessions() {
  return readJSON(SESSIONS_KEY, []);
}

function getSessionsForUser(email) {
  return getSessions()
    .filter((s) => s.tutorEmail === email || s.tuteeEmail === email)
    .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
}

function getSessionById(id) {
  return getSessions().find((s) => s.id === id) || null;
}

function createSession({ chatId, tutorEmail, tuteeEmail, subject, datetime, durationMinutes, zoomLink }) {
  const sessions = getSessions();
  const session = {
    id: crypto.randomUUID(),
    chatId,
    tutorEmail,
    tuteeEmail,
    subject: subject || "",
    datetime,
    durationMinutes: Number(durationMinutes) || 30,
    zoomLink: zoomLink || "",
    status: "scheduled",
    createdAt: new Date().toISOString(),
  };
  sessions.push(session);
  writeJSON(SESSIONS_KEY, sessions);
  notifyUpdate("session");
  return session;
}

// Cancellation is a status flip, not a delete — a cancelled session stays
// visible (marked as such) instead of vanishing, so both sides retain a
// record of it. `cancelledByEmail` drives the "cancelled by you" vs.
// "cancelled by <name>" distinction in the UI.
function cancelSession(sessionId, cancelledByEmail) {
  const sessions = getSessions();
  const idx = sessions.findIndex((s) => s.id === sessionId);
  if (idx === -1) return null;
  sessions[idx] = {
    ...sessions[idx],
    status: "cancelled",
    cancelledBy: cancelledByEmail,
    cancelledAt: new Date().toISOString(),
  };
  writeJSON(SESSIONS_KEY, sessions);
  notifyUpdate("session");
  return sessions[idx];
}

function updateSessionZoomLink(sessionId, zoomLink) {
  const sessions = getSessions();
  const idx = sessions.findIndex((s) => s.id === sessionId);
  if (idx === -1) return null;
  sessions[idx] = { ...sessions[idx], zoomLink: zoomLink || "" };
  writeJSON(SESSIONS_KEY, sessions);
  notifyUpdate("session");
  return sessions[idx];
}

// ---------- Comments (tutee feedback on tutors) ----------
// Not real moderation — there's no backend or human reviewer here, just a
// keyword heuristic standing in for one. "Warm" comments show up on the
// tutor's profile immediately; "cold" ones are held back (never shown to
// anyone in this prototype) instead of being emailed to a coordinator, since
// there's nowhere to send that email from a static site.

const NEGATIVE_COMMENT_WORDS = [
  "bad",
  "rude",
  "late",
  "unprepared",
  "mean",
  "awful",
  "terrible",
  "worst",
  "unhelpful",
  "disrespectful",
  "cancel",
  "no show",
  "noshow",
  "yell",
  "angry",
  "hate",
  "horrible",
  "waste",
  "annoying",
  "condescending",
  "never showed",
  "didn't show",
  "didn't help",
  "confusing",
  "useless",
];

function classifyComment(text) {
  const lower = text.toLowerCase();
  return NEGATIVE_COMMENT_WORDS.some((w) => lower.includes(w)) ? "cold" : "warm";
}

function getComments() {
  return readJSON(COMMENTS_KEY, []);
}

function getVisibleCommentsForTutor(tutorEmail) {
  return getComments()
    .filter((c) => c.tutorEmail === tutorEmail && c.sentiment === "warm")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function addComment(tutorEmail, authorEmail, text) {
  const comments = getComments();
  const comment = {
    id: crypto.randomUUID(),
    tutorEmail,
    authorEmail,
    text,
    sentiment: classifyComment(text),
    createdAt: new Date().toISOString(),
  };
  comments.push(comment);
  writeJSON(COMMENTS_KEY, comments);
  notifyUpdate("comment");
  return comment;
}

// ---------- Cross-tab live updates ----------
// Chats/sessions are demoed across two tabs in the same browser (tutor +
// tutee), so a BroadcastChannel keeps every open tab in sync without a
// manual refresh. `storage` is a fallback for browsers without it.

const wcChannel = "BroadcastChannel" in window ? new BroadcastChannel("wc_updates") : null;

function notifyUpdate(type) {
  if (wcChannel) wcChannel.postMessage({ type, at: Date.now() });
}

function onUpdate(callback) {
  if (wcChannel) {
    wcChannel.onmessage = (e) => callback(e.data.type);
  }
  window.addEventListener("storage", (e) => {
    if ([PROFILES_KEY, CHATS_KEY, MESSAGES_KEY, SESSIONS_KEY, COMMENTS_KEY, READ_STATE_KEY].includes(e.key)) {
      callback("storage");
    }
  });
}

function formatName(email) {
  const user = getUserByEmail(email);
  return user ? user.name : email;
}

function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
