import { useCallback, useEffect, useState } from "react";
import {
  Conversation,
  getConversations,
  createConversation,
  Message,
  getMessages,
  sendMessage,
} from "../services/supportService";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getConversations();
      setConversations(data);
    } catch {
      // silent fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (params: {
      category: Conversation["category"];
      subject: string;
      message: string;
    }) => {
      const conv = await createConversation(params);
      await refresh();
      return conv;
    },
    [refresh],
  );

  const unreadTotal = conversations.reduce(
    (sum, c) => sum + (c.unread_count || 0),
    0,
  );

  return { conversations, isLoading, refresh, create, unreadTotal };
}

export function useConversationMessages(conversationId: number | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!conversationId) return;
    try {
      setIsLoading(true);
      const data = await getMessages(conversationId);
      setMessages(data);
    } catch {
      // silent fail
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const send = useCallback(
    async (text: string) => {
      if (!conversationId) return;
      const msg = await sendMessage(conversationId, text);
      setMessages((prev) => [...prev, msg]);
      return msg;
    },
    [conversationId],
  );

  return { messages, isLoading, refresh, send };
}
