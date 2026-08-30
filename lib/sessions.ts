export function sessionRowToJson(row: Record<string, unknown>, names?: Map<string, string>) {
  return {
    id: row.id,
    chatId: row.chat_id,
    tutorEmail: row.tutor_email,
    tuteeEmail: row.tutee_email,
    tutorName: names?.get(row.tutor_email as string) ?? null,
    tuteeName: names?.get(row.tutee_email as string) ?? null,
    subject: row.subject,
    datetime: row.datetime,
    durationMinutes: row.duration_minutes,
    zoomLink: row.zoom_link,
    status: row.status,
    rate: row.rate,
    proposedBy: row.proposed_by,
    cancelledBy: row.cancelled_by,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
  };
}
