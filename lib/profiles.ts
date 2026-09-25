// Maps a `profiles` DB row (snake_case) to the camelCase shape the client
// has always used (matches the old localStorage profile object exactly, so
// app.js's rendering code didn't need to change field names).
export function profileRowToJson(row: Record<string, unknown>) {
  return {
    photo: row.photo,
    bio: row.bio,
    classYear: row.class_year,
    takenCourses: row.taken_courses,
    subjects: row.subjects,
    gradeLevel: row.grade_level,
    gradeLevels: row.grade_levels,
    availability: row.availability,
    availabilityLocations: row.availability_locations,
    availabilityFormats: row.availability_formats,
    introVideo: row.intro_video,
    rate: row.rate,
    offer: row.offer,
    tutoringHours: row.tutoring_hours,
    paymentMethods: row.payment_methods,
    paymentHandle: row.payment_handle,
    resume: row.resume,
  };
}

const PROFILE_FIELD_MAP: Record<string, string> = {
  photo: "photo",
  bio: "bio",
  classYear: "class_year",
  takenCourses: "taken_courses",
  subjects: "subjects",
  gradeLevel: "grade_level",
  gradeLevels: "grade_levels",
  availability: "availability",
  availabilityLocations: "availability_locations",
  availabilityFormats: "availability_formats",
  introVideo: "intro_video",
  rate: "rate",
  offer: "offer",
  tutoringHours: "tutoring_hours",
  paymentMethods: "payment_methods",
  paymentHandle: "payment_handle",
  resume: "resume",
};

// A genuine partial patch — only columns whose camelCase key is actually
// present in the request body get touched. This matters once the profile
// is split across separate Profile/Subjects/Availability tabs (each saves
// independently): if this defaulted missing fields to "", saving from one
// tab would silently wipe out data owned by the others.
export function profileJsonToRow(body: Record<string, unknown>) {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const [jsonKey, column] of Object.entries(PROFILE_FIELD_MAP)) {
    if (jsonKey in body) row[column] = body[jsonKey];
  }
  return row;
}
