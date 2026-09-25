import { NextRequest, NextResponse } from "next/server";
import { resolveAuthToken } from "@/lib/auth";
import { getChatIfParticipant, chatRowToJson, namesForEmails } from "@/lib/chats";

export async function GET(req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const email = await resolveAuthToken(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chatId } = await params;
  const chat = await getChatIfParticipant(chatId, email);
  if (!chat) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const names = await namesForEmails([chat.tutor_email, chat.tutee_email]);
  return NextResponse.json(chatRowToJson(chat, names));
}
