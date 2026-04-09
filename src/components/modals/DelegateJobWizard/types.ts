export type WizardMode = "resources" | "delegate_part" | "delegate_full";
export type WizardStep = "mode" | "config" | "summary";

export interface DelegateJobWizardProps {
  visible: boolean;
  jobId: string;
  companyId?: number;
  initialMode?: WizardMode;
  onClose: () => void;
  onSuccess: () => void;
}

export interface ResourceEntry {
  id: string;
  type: "vehicle" | "staff";
  resourceId: string;
  label: string;
  sublabel?: string;
  role?: "driver" | "offsider" | "supervisor";
}

export const STEPS: WizardStep[] = ["mode", "config", "summary"];
