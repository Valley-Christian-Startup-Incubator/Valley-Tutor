// Data-source registry for the /admin data pages (ported from the former
// mulls-monster Data Admin). Server-only: imports node:fs and reads service keys.
//
// Data-source registry.
//
// A "source" is a Supabase/Postgres REST endpoint the dashboard reads from, plus
// a human-readable description of the tables it cares about. Adding another
// database to the org's admin page is a config change here (or in
// config/sources.local.json, which is git-ignored and merged in at boot) — no
// code changes required.
//
// Credentials are NEVER stored in source. Each source names the *env var* that
// holds its service-role key, so secrets live only in .env.local.

export type ColumnKind = "text" | "date" | "datetime" | "number" | "pdf" | "badge" | "email" | "link" | "profile";

export interface Column {
   key: string;          // column name in the DB / REST response
   label: string;        // human label
   kind?: ColumnKind;    // how the UI should render/format it
   bucket?: string;      // for "pdf" columns: storage bucket
   pathColumn?: string;  // for "pdf" columns: column holding the object path
   badge?: Record<string, string>; // for "badge" columns: value -> css class
   searchable?: boolean;
   profileKey?: string;  // for "profile" columns: the OTHER column on this row holding the actual email to link to (defaults to this column's own value)
}

export interface TableFilter {
   key: string;          // column to filter on
   label: string;
   options: string[];    // allowed values (shown as a dropdown)
}

export interface LookupField {
   key: string;      // row key to attach the looked-up value under (e.g. "tutor_name")
   column: string;   // column on the looked-up table to pull it from (e.g. "name")
}

export interface LookupDef {
   sourceColumn: string;   // column on this row to look up by (e.g. "tutor_email")
   table: string;          // table to look up in (e.g. "users")
   matchColumn: string;    // column on that table matching sourceColumn (e.g. "email")
   fields: LookupField[];  // one fetch, multiple columns pulled back per matched row
}

export interface TableDef {
   id: string;           // REST table name (e.g. "agreements")
   label: string;
   description?: string;
   columns: Column[];
   primary?: string;
   filters?: TableFilter[];
   lookups?: LookupDef[]; // columns filled in via a batched lookup against another table, not a real column on this table
}

export interface BucketDef {
   id: string;
   label?: string;
   description?: string;
}

export interface SourceDef {
   id: string;           // short id used in URLs (e.g. "peer-tutoring")
   name: string;
   description?: string;
   kind: "supabase";
   apiBaseUrlEnv?: string;
   defaultBaseUrl: string;
   serviceKeyEnv: string;
   tables: TableDef[];
   buckets?: BucketDef[];
}

// ---- Built-in sources ----

export const BUILTIN_SOURCES: SourceDef[] = [
     {
     id: "peer-tutoring",
     name: "Peer Tutoring",
     description:
          "Students & tutors who signed the peer-tutoring consent agreement, with their signed PDFs. (Supabase on valley-big-mac)",
     kind: "supabase",
     apiBaseUrlEnv: "SUPABASE_URL",
     defaultBaseUrl: "https://peertutor-db.valleychristianai.com",
     serviceKeyEnv: "SUPABASE_SERVICE_ROLE_KEY",
     tables: [
          {
           id: "agreements",
           label: "Signed Agreements",
           description:
                "One row per signed consent agreement. The 'Signed PDF' column opens the generated, signed document.",
           primary: "id",
           columns: [
                { key: "user_email", label: "Email", kind: "email", searchable: true },
                { key: "role", label: "Role", kind: "badge", badge: { tutor: "ok", tutee: "info", parent: "warn" }, searchable: true },
                { key: "student_name", label: "Student", kind: "text", searchable: true },
                { key: "student_email", label: "Student Email (parent rows)", kind: "email", searchable: true },
                { key: "guardian_name", label: "Guardian", kind: "text", searchable: true },
                { key: "signed_date", label: "Date Signed", kind: "date" },
                { key: "document_version", label: "Document", kind: "text" },
                { key: "signed_at", label: "Recorded At", kind: "datetime" },
                { key: "pdf_storage_path", label: "Signed PDF", kind: "pdf", bucket: "signed-agreements" },
             ],
           filters: [{ key: "role", label: "Role", options: ["tutor", "tutee", "parent"] }],
          },
          {
           id: "rate_agreements",
           label: "Rate Agreements",
           description:
                "The price a tutor and tutee agreed on for their sessions. The latest row per chat is the current state — a new proposal (e.g. renegotiating) always inserts another row rather than editing the old one.",
           primary: "created_at",
           columns: [
                { key: "tutor_name", label: "Tutor Name", kind: "text", searchable: false },
                { key: "tutor_email", label: "Tutor Email", kind: "email", searchable: true },
                { key: "tutee_name", label: "Tutee Name", kind: "text", searchable: false },
                { key: "tutee_email", label: "Tutee Email", kind: "email", searchable: true },
                { key: "rate", label: "Rate", kind: "text", searchable: true },
                { key: "status", label: "Status", kind: "badge", badge: { pending: "warn", accepted: "ok" }, searchable: true },
                { key: "proposed_by", label: "Proposed By", kind: "email" },
                { key: "accepted_by", label: "Accepted By", kind: "email" },
                { key: "accepted_at", label: "Accepted At", kind: "datetime" },
                { key: "created_at", label: "Proposed At", kind: "datetime" },
             ],
           filters: [{ key: "status", label: "Status", options: ["pending", "accepted"] }],
           lookups: [
                { sourceColumn: "tutor_email", table: "users", matchColumn: "email", fields: [{ key: "tutor_name", column: "name" }] },
                { sourceColumn: "tutee_email", table: "users", matchColumn: "email", fields: [{ key: "tutee_name", column: "name" }] },
             ],
          },
          {
           id: "users",
           label: "Tutors & Tutees",
           description:
                "Everyone registered for peer tutoring, with what they gave at signup/registration (grade, classes they're tutoring, class year, etc). Click a name or email to open their full profile — photo, resume, bio, intro video, availability, and payment info live there rather than in this list, since those can be large.",
           primary: "name",
           columns: [
                { key: "name", label: "Name", kind: "profile", profileKey: "email", searchable: true },
                { key: "email", label: "Email", kind: "profile", searchable: true },
                { key: "role", label: "Role", kind: "badge", badge: { tutor: "ok", tutee: "info", parent: "warn" }, searchable: true },
                { key: "grade_level", label: "Grade", kind: "text", searchable: false },
                { key: "class_year", label: "Class Year", kind: "text", searchable: false },
                { key: "subjects", label: "Classes Tutoring", kind: "text", searchable: false },
             ],
           filters: [{ key: "role", label: "Role", options: ["tutor", "tutee", "parent"] }],
           lookups: [
                {
                 sourceColumn: "email",
                 table: "profiles",
                 matchColumn: "email",
                 fields: [
                      { key: "grade_level", column: "grade_level" },
                      { key: "class_year", column: "class_year" },
                      { key: "subjects", column: "subjects" },
                   ],
                },
             ],
          },
          {
           id: "chats",
           label: "Matches",
           description:
                "Every tutor/tutee pair that has matched and can message each other. The row count here is the total number of matches. Logged Sessions/Hours are what they've recorded together via the chat's session log.",
           primary: "created_at",
           columns: [
                { key: "tutor_name", label: "Tutor", kind: "profile", profileKey: "tutor_email", searchable: false },
                { key: "tutee_name", label: "Tutee", kind: "profile", profileKey: "tutee_email", searchable: false },
                { key: "subject", label: "Subject", kind: "text", searchable: true },
                { key: "logged_sessions", label: "Sessions Logged", kind: "number" },
                { key: "logged_hours", label: "Hours Logged", kind: "number" },
                { key: "created_at", label: "Matched At", kind: "datetime" },
             ],
           lookups: [
                { sourceColumn: "tutor_email", table: "users", matchColumn: "email", fields: [{ key: "tutor_name", column: "name" }] },
                { sourceColumn: "tutee_email", table: "users", matchColumn: "email", fields: [{ key: "tutee_name", column: "name" }] },
             ],
          },
          {
           id: "parent_links",
           label: "Parent Links",
           description: "A parent account linked to a student (tutee) account via the student's invite code.",
           primary: "created_at",
           columns: [
                { key: "parent_name", label: "Parent", kind: "profile", profileKey: "parent_email", searchable: false },
                { key: "parent_email", label: "Parent Email", kind: "email", searchable: true },
                { key: "student_name", label: "Student", kind: "profile", profileKey: "student_email", searchable: false },
                { key: "student_email", label: "Student Email", kind: "email", searchable: true },
                { key: "created_at", label: "Linked At", kind: "datetime" },
             ],
           lookups: [
                { sourceColumn: "parent_email", table: "users", matchColumn: "email", fields: [{ key: "parent_name", column: "name" }] },
                { sourceColumn: "student_email", table: "users", matchColumn: "email", fields: [{ key: "student_name", column: "name" }] },
             ],
          },
       ],
     buckets: [
          { id: "signed-agreements", label: "Signed Agreements (PDFs)", description: "Signed consent documents, one per agreement." },
       ],
     },
];

// ---- Optional user-defined sources (git-ignored) ----
import fs from "node:fs";
import path from "node:path";

function loadLocalSources(): SourceDef[] {
   const file = path.join(process.cwd(), "config", "sources.local.json");
   if (!fs.existsSync(file)) return [];
   try {
     const raw = JSON.parse(fs.readFileSync(file, "utf8"));
     const arr = Array.isArray(raw) ? raw : raw.sources;
     return (arr as SourceDef[]) ?? [];
     } catch (err) {
     console.error("[sources] failed to load config/sources.local.json:", err);
     return [];
     }
}

export function getSources(): SourceDef[] {
   const local = loadLocalSources();
   const byId = new Map<string, SourceDef>();
   for (const s of BUILTIN_SOURCES) byId.set(s.id, s);
   for (const s of local) byId.set(s.id, s);
   return [...byId.values()];
}

export function getSource(id: string): SourceDef | undefined {
   return getSources().find((s) => s.id === id);
}

export function getTable(sourceId: string, tableId: string): { source: SourceDef; table: TableDef } | undefined {
   const source = getSource(sourceId);
   if (!source) return undefined;
   const table = source.tables.find((t) => t.id === tableId);
   if (!table) return undefined;
   return { source, table };
}

export function resolveApiBaseUrl(source: SourceDef): string {
   const fromEnv = source.apiBaseUrlEnv ? process.env[source.apiBaseUrlEnv] : undefined;
   return (fromEnv || source.defaultBaseUrl).replace(/\/+$/, "");
}

export function resolveServiceKey(source: SourceDef): string {
   const key = process.env[source.serviceKeyEnv];
   if (!key) {
     throw new Error(
         `Missing service key env var "${source.serviceKeyEnv}" for source "${source.id}". Set it in .env.local (see .env.example).`,
     );
   }
   return key;
}
