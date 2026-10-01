// Aggregates everything the peer-tutoring DB knows about one person, across
// tables that the generic table browser can't join: their account (users),
// their registration/profile fields (profiles), any signed consent
// agreements, and any rate agreements they're party to (as tutor or tutee).
import type { SourceDef } from "./sources";
import { resolveApiBaseUrl, resolveServiceKey } from "./sources";

type Row = Record<string, unknown>;

async function restGet(base: string, key: string, table: string, params: Record<string, string>): Promise<Row[]> {
   const url = new URL(`${base}/rest/v1/${encodeURIComponent(table)}`);
   url.searchParams.set("select", "*");
   for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
   const resp = await fetch(url.toString(), {
     headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" },
     cache: "no-store",
      });
   if (!resp.ok) return [];
   const data = await resp.json().catch(() => []);
   return Array.isArray(data) ? (data as Row[]) : [];
}

export interface PersonProfile {
   user: Row | null;
   profile: Row | null;
   agreements: Row[];
   rateAgreements: Row[];
   matches: Row[];                                  // chats (matches) this person is part of, either side
   tutoringTotals: { sessions: number; hours: number }; // summed from chats where they're the tutor
   reviews: Row[];                                   // comments left for them as a tutor
   reviewStats: { count: number; average: number | null };
}

export async function getPersonProfile(source: SourceDef, email: string): Promise<PersonProfile> {
   const base = resolveApiBaseUrl(source);
   const key = resolveServiceKey(source);

   const [users, profiles, agreements, rateAsTutor, rateAsTutee, chatsAsTutor, chatsAsTutee, reviews] = await Promise.all([
     restGet(base, key, "users", { email: `eq.${email}` }),
     restGet(base, key, "profiles", { email: `eq.${email}` }),
     restGet(base, key, "agreements", { user_email: `eq.${email}`, order: "signed_at.desc" }),
     restGet(base, key, "rate_agreements", { tutor_email: `eq.${email}`, order: "created_at.desc" }),
     restGet(base, key, "rate_agreements", { tutee_email: `eq.${email}`, order: "created_at.desc" }),
     restGet(base, key, "chats", { tutor_email: `eq.${email}`, order: "created_at.desc" }),
     restGet(base, key, "chats", { tutee_email: `eq.${email}`, order: "created_at.desc" }),
     restGet(base, key, "comments", { tutor_email: `eq.${email}`, order: "created_at.desc" }),
    ]);

   const seen = new Set<string>();
   const rateAgreements = [...rateAsTutor, ...rateAsTutee].filter((r) => {
     const id = String(r.id);
     if (seen.has(id)) return false;
     seen.add(id);
     return true;
      });
   rateAgreements.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

   const matches = [...chatsAsTutor, ...chatsAsTutee].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

    // Who's on the other side of each match, with a display name.
   const partnerEmails = Array.from(
     new Set(
       matches
         .map((m) => (m.tutor_email === email ? m.tutee_email : m.tutor_email))
         .filter((v): v is string => typeof v === "string" && v.length > 0),
        ),
     );
   const partnerRows = partnerEmails.length ? await restGet(base, key, "users", { email: `in.(${partnerEmails.join(",")})` }) : [];
   const partnerNames = new Map(partnerRows.map((r) => [String(r.email), String(r.name ?? r.email)]));
   for (const m of matches) {
     const partnerEmail = m.tutor_email === email ? m.tutee_email : m.tutor_email;
     m.partner_email = partnerEmail;
     m.partner_name = typeof partnerEmail === "string" ? (partnerNames.get(partnerEmail) ?? partnerEmail) : null;
      }

   const tutoringTotals = chatsAsTutor.reduce(
     (acc: { sessions: number; hours: number }, c) => {
       acc.sessions += Number(c.logged_sessions ?? 0);
       acc.hours += Number(c.logged_hours ?? 0);
       return acc;
        },
     { sessions: 0, hours: 0 },
     );
   tutoringTotals.hours = Math.round(tutoringTotals.hours * 100) / 100;

   const rated = reviews.filter((r) => typeof r.rating === "number");
   const reviewStats = {
     count: reviews.length,
     average: rated.length
       ? Math.round((rated.reduce((a, r) => a + (r.rating as number), 0) / rated.length) * 10) / 10
       : null,
    };

   return {
     user: users[0] ?? null,
     profile: profiles[0] ?? null,
     agreements,
     rateAgreements,
     matches,
     tutoringTotals,
     reviews,
     reviewStats,
    };
}
