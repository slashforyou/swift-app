import { useCallback, useEffect, useState } from "react";
import { ServerData } from "../constants/ServerData";
import { getAuthHeaders } from "../utils/auth";

export interface ChecklistItem {
  id: string;
  completed: boolean;
  loading: boolean;
}

export interface OnboardingChecklist {
  items: ChecklistItem[];
  completedCount: number;
  totalCount: number;
  allCompleted: boolean;
  loading: boolean;
  refresh: () => void;
}

interface ChecklistResponse {
  success: boolean;
  checklist: {
    profile_completed: boolean;
    first_job_created: boolean;
    team_invited: boolean;
    payments_setup: boolean;
    first_payment_received: boolean;
  };
}

export function useOnboardingChecklist(): OnboardingChecklist {
  const [data, setData] = useState<ChecklistResponse["checklist"] | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `${ServerData.serverUrl}v1/onboarding/checklist`,
        { headers },
      );
      const json: ChecklistResponse = await res.json();
      if (json.success) {
        setData(json.checklist);
      }
    } catch (err) {
      console.warn("[OnboardingChecklist] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const items: ChecklistItem[] = [
    {
      id: "profile",
      completed: data?.profile_completed ?? false,
      loading,
    },
    {
      id: "first_job",
      completed: data?.first_job_created ?? false,
      loading,
    },
    {
      id: "invite_team",
      completed: data?.team_invited ?? false,
      loading,
    },
    {
      id: "setup_payments",
      completed: data?.payments_setup ?? false,
      loading,
    },
  ];

  const completedCount = items.filter((i) => i.completed).length;

  return {
    items,
    completedCount,
    totalCount: items.length,
    allCompleted: completedCount === items.length,
    loading,
    refresh: loadData,
  };
}
