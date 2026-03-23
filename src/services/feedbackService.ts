/**
 * Feedback Service - Envoie les messages de contact/feedback au serveur
 */
import { ServerData } from "../constants/ServerData";
import { authenticatedFetch } from "../utils/auth";

const API = ServerData.serverUrl;

export type FeedbackType = "help" | "feedback" | "feature" | "bug";

interface SubmitFeedbackParams {
  type: FeedbackType;
  message: string;
}

export async function submitFeedback(
  params: SubmitFeedbackParams,
): Promise<void> {
  const res = await authenticatedFetch(`${API}v1/feedback`, {
    method: "POST",
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: "Failed to submit feedback" }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }
}
