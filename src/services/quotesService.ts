import { ServerData } from "../constants/ServerData";
import { authenticatedFetch } from "../utils/auth";

const API = ServerData.serverUrl;

export interface QuoteItem {
  id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  total?: number;
}

export interface Quote {
  id: number;
  quote_number: string;
  title: string;
  status: string; // "draft" | "sent" | "accepted" | "rejected" | "expired"
  total: number;
  subtotal?: number;
  tax?: number;
  client_id?: number;
  client_name?: string;
  valid_until?: string;
  notes?: string;
  terms?: string;
  items: QuoteItem[];
  created_at: string;
  updated_at?: string;
}

export const getQuotes = async (): Promise<Quote[]> => {
  const res = await authenticatedFetch(`${API}v1/quotes`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.quotes ?? data ?? [];
};

export const getQuoteById = async (id: number): Promise<Quote> => {
  const res = await authenticatedFetch(`${API}v1/quotes/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.quote ?? data;
};

export const createQuote = async (
  payload: Omit<Quote, "id" | "quote_number" | "created_at" | "updated_at">,
): Promise<Quote> => {
  const res = await authenticatedFetch(`${API}v1/quotes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.quote ?? data;
};

export const updateQuote = async (id: number, payload: Partial<Quote>): Promise<Quote> => {
  const res = await authenticatedFetch(`${API}v1/quotes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.quote ?? data;
};

export const deleteQuote = async (id: number): Promise<void> => {
  const res = await authenticatedFetch(`${API}v1/quotes/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
};

export const convertQuoteToJob = async (id: number): Promise<{ job_id: string | number }> => {
  const res = await authenticatedFetch(`${API}v1/quotes/${id}/convert-to-job`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};
