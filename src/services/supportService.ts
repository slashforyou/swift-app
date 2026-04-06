/**
 * Support Service — API calls for support conversations and messages
 */
import { ServerData } from "../constants/ServerData";
import { authenticatedFetch } from "../utils/auth";

const API = ServerData.serverUrl;

export interface Conversation {
  id: number;
  category: "help" | "feedback" | "feature" | "bug";
  subject: string;
  status: "open" | "answered" | "closed";
  created_at: string;
  updated_at: string;
  unread_count: number;
  last_message: string | null;
  last_sender: "user" | "admin" | null;
}

export interface Message {
  id: number;
  sender_type: "user" | "admin";
  message: string;
  is_read: number;
  created_at: string;
}

export async function getConversations(): Promise<Conversation[]> {
  const res = await authenticatedFetch(`${API}v1/support/conversations`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.conversations || [];
}

export async function createConversation(params: {
  category: Conversation["category"];
  subject: string;
  message: string;
}): Promise<{ id: number }> {
  const res = await authenticatedFetch(`${API}v1/support/conversations`, {
    method: "POST",
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.conversation;
}

export async function getMessages(conversationId: number): Promise<Message[]> {
  const res = await authenticatedFetch(
    `${API}v1/support/conversations/${conversationId}/messages`,
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.messages || [];
}

export async function sendMessage(
  conversationId: number,
  message: string,
): Promise<Message> {
  const res = await authenticatedFetch(
    `${API}v1/support/conversations/${conversationId}/messages`,
    {
      method: "POST",
      body: JSON.stringify({ message }),
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.message;
}
