export function messageRowToJson(row: Record<string, unknown>) {
  return {
    id: row.id,
    chatId: row.chat_id,
    sender: row.sender,
    text: row.text,
    attachment: row.attachment,
    system: row.system,
    timestamp: row.created_at,
  };
}
