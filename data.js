const PROFILES_KEY = "wc_profiles";
const CHATS_KEY = "wc_chats";
const MESSAGES_KEY = "wc_messages";
const SESSIONS_KEY = "wc_sessions";

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

// Given the classes a tutor has taken, returns every class (course + level)
// they're qualified to teach: anything they took, anything at a lower level
// of the same course (AP unlocks Honors and Regular of that course, Honors
// unlocks Regular), and anything reachable through CROSS_COURSE_PREREQS —
// transitively, so taking Advanced Data Analysis also unlocks Statistics
// Honors (AP Statistics is the direct prereq, and AP unlocks Honors in turn).
function getTeachableCourses(takenCourses) {
  const unlocked = new Map(); // "course::level" -> {course, level}
  const queue = (takenCourses || []).map((t) => ({ course: t.course, level: t.level }));

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

  return Array.from(unlocked.values()).map(({ course, level }) => {
    const catalogEntry = findCatalogCourse(course);
    return { course, level, category: catalogEntry ? catalogEntry.category : "", label: courseLabel(course, level) };
  });
}

const GRADE_LEVELS = ["Elementary", "Junior High", "High School"];
const CLASS_YEARS = ["Freshman", "Sophomore", "Junior", "Senior"];
const AVAILABILITY_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const AVAILABILITY_BLOCKS = ["Before School", "After School", "Evening"];

function readJSON(key, fallback) {
  return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---------- Profiles ----------

function getProfiles() {
  return readJSON(PROFILES_KEY, {});
}

function getProfile(email) {
  return (
    getProfiles()[email] || {
      photo: "",
      bio: "",
      classYear: "",
      takenCourses: [],
      subjects: [],
      gradeLevel: "",
      gradeLevels: [],
      availability: [],
    }
  );
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
    createdAt: new Date().toISOString(),
  };
  sessions.push(session);
  writeJSON(SESSIONS_KEY, sessions);
  notifyUpdate("session");
  return session;
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
    if ([PROFILES_KEY, CHATS_KEY, MESSAGES_KEY, SESSIONS_KEY].includes(e.key)) {
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
