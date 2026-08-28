export function rateAgreementRowToJson(row: Record<string, unknown>) {
  return {
    id: row.id,
    chatId: row.chat_id,
    rate: row.rate,
    proposedBy: row.proposed_by,
    status: row.status,
    acceptedBy: row.accepted_by,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at,
  };
}
