import { notFound } from "next/navigation";
import Link from "next/link";
import { getSource } from "@/lib/adminData/sources";
import { requireAuthRedirect } from "@/lib/adminSession";
import { getPersonProfile } from "@/lib/adminData/profile";

type Row = Record<string, unknown>;

function str(v: unknown): string | null {
   if (v === null || v === undefined || v === "") return null;
   return String(v);
}

function list(v: unknown): string | null {
   if (!Array.isArray(v) || v.length === 0) return null;
   return v
     .map((item) => {
       if (item && typeof item === "object") {
         const o = item as Row;
         return [o.course, o.level].filter(Boolean).join(" — ");
          }
       return String(item);
        })
     .join(", ");
}

function dt(v: unknown): string | null {
   const s = str(v);
   if (!s) return null;
   const d = new Date(s);
   return Number.isNaN(d.getTime()) ? s : d.toLocaleString();
}

export default async function ProfilePage({
   params,
}: {
   params: Promise<{ source: string; email: string }>;
}) {
   await requireAuthRedirect();
   const { source, email: rawEmail } = await params;
   const email = decodeURIComponent(rawEmail);
   const s = getSource(source);
   if (!s) notFound();

   const data = await getPersonProfile(s, email);
   if (!data.user && !data.profile) notFound();

   const u = data.user ?? {};
   const p = data.profile ?? {};
   const name = str(u.name) ?? email;
   const role = str(u.role);
   const photo = str(p.photo);
   const introVideo = str(p.intro_video);
   const resume = str(p.resume);

   const availability = Array.isArray(p.availability) ? (p.availability as unknown[]).map(String) : [];
   const availFormats = (p.availability_formats && typeof p.availability_formats === "object" ? p.availability_formats : {}) as Row;
   const availLocations = (p.availability_locations && typeof p.availability_locations === "object" ? p.availability_locations : {}) as Row;

   return (
        <>
           <p className="muted" style={{ margin: "0 0 6px" }}>
              <Link href={`/admin/data/sources/${s.id}`}>{s.name}</Link> · <Link href={`/admin/data/sources/${s.id}/tables/users`}>Tutors &amp; Tutees</Link> · {email}
           </p>

           <div className="profile-header">
              {photo && (
                  <a href={photo} target="_blank" rel="noreferrer" title="Open full size">
                     <img className="profile-photo" src={photo} alt="" />
                  </a>
                  )}
              <div>
                 <h1 style={{ margin: 0 }}>{name}</h1>
                 <div className="meta" style={{ marginTop: 6 }}>
                    {role && <span className={`badge ${role === "tutor" ? "ok" : "info"}`}>{role}</span>}
                    <span className="pill">{email}</span>
                    <span className="pill">{data.matches.length} match{data.matches.length === 1 ? "" : "es"}</span>
                    {data.tutoringTotals.hours > 0 && <span className="pill">{data.tutoringTotals.hours} hrs tutored</span>}
                    {data.reviewStats.average !== null && <span className="pill">★ {data.reviewStats.average} ({data.reviewStats.count})</span>}
                 </div>
              </div>
           </div>

           <div className="mm-profile-grid">
              <div className="card">
                 <div className="title">Registration Info</div>
                 <dl className="field-list" style={{ marginTop: 12 }}>
                    <dt>Grade</dt><dd>{str(p.grade_level) ?? "—"}</dd>
                    <dt>Class Year</dt><dd>{str(p.class_year) ?? "—"}</dd>
                    <dt>Subjects</dt><dd>{list(p.subjects) ?? "—"}</dd>
                    <dt>Grade Levels Tutored</dt><dd>{list(p.grade_levels) ?? "—"}</dd>
                    <dt>Courses Taken</dt><dd>{list(p.taken_courses) ?? "—"}</dd>
                    <dt>Bio</dt><dd>{str(p.bio) ?? "—"}</dd>
                 </dl>
              </div>

              <div className="card">
                 <div className="title">Availability</div>
                 {availability.length === 0 ? (
                     <div className="muted" style={{ marginTop: 8 }}>No availability set yet.</div>
                     ) : (
                     <table className="mini-table">
                        <thead>
                           <tr><th>Block</th><th>Format</th><th>Location</th></tr>
                        </thead>
                        <tbody>
                           {availability.map((block) => (
                               <tr key={block}>
                                  <td>{block}</td>
                                  <td>{str(availFormats[block]) ?? "—"}</td>
                                  <td>{str(availLocations[block]) ?? "—"}</td>
                               </tr>
                               ))}
                        </tbody>
                     </table>
                     )}
              </div>

              <div className="card">
                 <div className="title">Rate &amp; Payment</div>
                 <dl className="field-list" style={{ marginTop: 12 }}>
                    <dt>Declared Rate</dt><dd>{str(p.rate) ?? "—"}</dd>
                    <dt>Offer</dt><dd>{str(p.offer) ?? "—"}</dd>
                    <dt>Tutoring Hours</dt><dd>{str(p.tutoring_hours) ?? "—"}</dd>
                    <dt>Payment Methods</dt><dd>{list(p.payment_methods) ?? "—"}</dd>
                    <dt>Payment Handle</dt><dd>{str(p.payment_handle) ?? "—"}</dd>
                 </dl>
              </div>

              {introVideo && (
                  <div className="card" style={{ gridColumn: "1 / -1" }}>
                     <div className="title">Intro Video</div>
                     {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                     <video className="profile-video" src={introVideo} controls />
                  </div>
                  )}

              {resume && (
                  <div className="card" style={{ gridColumn: "1 / -1" }}>
                     <div className="title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>Resume</span>
                        <a href={resume} target="_blank" rel="noreferrer">Open / download ↗</a>
                     </div>
                     <iframe src={resume} title="Resume" className="profile-resume" />
                  </div>
                  )}

              <div className="card">
                 <div className="title">Tutoring Activity</div>
                 <dl className="field-list" style={{ marginTop: 12 }}>
                    <dt>Sessions Logged</dt><dd>{data.tutoringTotals.sessions}</dd>
                    <dt>Hours Tutored</dt><dd>{data.tutoringTotals.hours}</dd>
                    <dt>Average Rating</dt><dd>{data.reviewStats.average !== null ? `★ ${data.reviewStats.average} / 5` : "—"}</dd>
                    <dt>Reviews Received</dt><dd>{data.reviewStats.count}</dd>
                 </dl>
              </div>

              <div className="card">
                 <div className="title">Matches ({data.matches.length})</div>
                 {data.matches.length === 0 ? (
                     <div className="muted" style={{ marginTop: 8 }}>Not matched with anyone yet.</div>
                     ) : (
                     <table className="mini-table">
                        <thead>
                           <tr><th>With</th><th>As</th><th>Subject</th><th>Sessions</th><th>Hours</th><th>Matched</th></tr>
                        </thead>
                        <tbody>
                           {data.matches.map((m) => (
                               <tr key={String(m.id)}>
                                  <td>
                                     <a href={`/admin/data/sources/${s.id}/profiles/${encodeURIComponent(String(m.partner_email))}`}>
                                       {str(m.partner_name) ?? "—"}
                                     </a>
                                  </td>
                                  <td><span className={`badge ${m.tutor_email === email ? "ok" : "info"}`}>{m.tutor_email === email ? "tutor" : "tutee"}</span></td>
                                  <td>{str(m.subject) ?? "—"}</td>
                                  <td>{str(m.logged_sessions) ?? "0"}</td>
                                  <td>{str(m.logged_hours) ?? "0"}</td>
                                  <td>{dt(m.created_at) ?? "—"}</td>
                               </tr>
                               ))}
                        </tbody>
                     </table>
                     )}
              </div>

              <div className="card" style={{ gridColumn: "1 / -1" }}>
                 <div className="title">Reviews ({data.reviews.length})</div>
                 {data.reviews.length === 0 ? (
                     <div className="muted" style={{ marginTop: 8 }}>No reviews yet.</div>
                     ) : (
                     <table className="mini-table">
                        <thead>
                           <tr><th>Rating</th><th>Review</th><th>From</th><th>Sentiment</th><th>Date</th></tr>
                        </thead>
                        <tbody>
                           {data.reviews.map((r) => (
                               <tr key={String(r.id)}>
                                  <td>{typeof r.rating === "number" ? `★ ${r.rating}` : "—"}</td>
                                  <td>{str(r.text) ?? "—"}</td>
                                  <td>{str(r.author_email) ?? "—"}</td>
                                  <td><span className={`badge ${r.sentiment === "cold" ? "danger" : "ok"}`}>{str(r.sentiment) ?? "—"}</span></td>
                                  <td>{dt(r.created_at) ?? "—"}</td>
                               </tr>
                               ))}
                        </tbody>
                     </table>
                     )}
              </div>

              <div className="card">
                 <div className="title">Rate Agreements ({data.rateAgreements.length})</div>
                 {data.rateAgreements.length === 0 ? (
                     <div className="muted" style={{ marginTop: 8 }}>No rate agreements yet.</div>
                     ) : (
                     <table className="mini-table">
                        <thead>
                           <tr><th>Rate</th><th>Status</th><th>With</th><th>Proposed</th></tr>
                        </thead>
                        <tbody>
                           {data.rateAgreements.map((r) => {
                             const withEmail = r.tutor_email === email ? r.tutee_email : r.tutor_email;
                             return (
                                 <tr key={String(r.id)}>
                                    <td>{str(r.rate) ?? "—"}</td>
                                    <td><span className={`badge ${r.status === "accepted" ? "ok" : "warn"}`}>{str(r.status)}</span></td>
                                    <td>{str(withEmail) ?? "—"}</td>
                                    <td>{dt(r.created_at) ?? "—"}</td>
                                 </tr>
                                 );
                              })}
                        </tbody>
                     </table>
                     )}
              </div>

              <div className="card">
                 <div className="title">Signed Agreements ({data.agreements.length})</div>
                 {data.agreements.length === 0 ? (
                     <div className="muted" style={{ marginTop: 8 }}>No signed consent agreements yet.</div>
                     ) : (
                     <table className="mini-table">
                        <thead>
                           <tr><th>Role</th><th>Student</th><th>Guardian</th><th>Signed</th><th></th></tr>
                        </thead>
                        <tbody>
                           {data.agreements.map((a) => (
                               <tr key={String(a.id)}>
                                  <td><span className={`badge ${a.role === "tutor" ? "ok" : "info"}`}>{str(a.role)}</span></td>
                                  <td>{str(a.student_name) ?? "—"}</td>
                                  <td>{str(a.guardian_name) ?? "—"}</td>
                                  <td>{str(a.signed_date) ?? "—"}</td>
                                  <td>
                                     {str(a.pdf_storage_path) && (
                                         <a
                                           href={`/api/admin/data/sources/${s.id}/buckets/signed-agreements/object?path=${encodeURIComponent(String(a.pdf_storage_path))}`}
                                           target="_blank"
                                           rel="noreferrer"
                                            >
                                           PDF ↗
                                         </a>
                                         )}
                                  </td>
                               </tr>
                               ))}
                        </tbody>
                     </table>
                     )}
              </div>
           </div>
        </>
        );
}
