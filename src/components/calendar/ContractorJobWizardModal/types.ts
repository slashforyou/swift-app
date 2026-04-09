import { Job } from "../../../hooks/useJobsForDay";

export type WizardStep =
  | "overview"
  | "decision"
  | "assign_staff"
  | "decline_reason"
  | "counter_proposal"
  | "counter_proposed"
  | "success"
  | "declined";

export interface ContractorJobWizardModalProps {
  visible: boolean;
  job: Job | null;
  onClose: () => void;
  onJobUpdated: () => void;
}

export const formatTime = (dateString: string) => {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "—";
  }
};

export const formatDate = (dateString: string) => {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  } catch {
    return "—";
  }
};
