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
  };
}

export function profileJsonToRow(body: Record<string, unknown>) {
  return {
    photo: body.photo ?? "",
    bio: body.bio ?? "",
    class_year: body.classYear ?? "",
    taken_courses: body.takenCourses ?? [],
    subjects: body.subjects ?? [],
    grade_level: body.gradeLevel ?? "",
    grade_levels: body.gradeLevels ?? [],
    availability: body.availability ?? [],
    availability_locations: body.availabilityLocations ?? {},
    availability_formats: body.availabilityFormats ?? {},
    intro_video: body.introVideo ?? "",
    rate: body.rate ?? "",
    offer: body.offer ?? "",
    tutoring_hours: body.tutoringHours ?? "",
    payment_methods: body.paymentMethods ?? [],
    payment_handle: body.paymentHandle ?? "",
    updated_at: new Date().toISOString(),
  };
}
