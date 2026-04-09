/**
 * usePlans — Hook for subscription plans data
 */
import { useCallback, useEffect, useState } from "react";
import {
    CompanyPlan,
    Plan,
    SelectPlanResponse,
    SubscriptionStatus,
    cancelSubscription as apiCancelSubscription,
    changePlan as apiChangePlan,
    createSubscription as apiCreateSubscription,
    getSubscriptionStatus as apiGetSubscriptionStatus,
    resumeSubscription as apiResumeSubscription,
    selectPlan as apiSelectPlan,
    getCompanyPlan,
    getPlans,
} from "../services/plansService";

export function useSubscription() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [companyPlan, setCompanyPlan] = useState<CompanyPlan | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const allPlans = await getPlans();
      setPlans(allPlans);
    } catch (e) {
      console.error("useSubscription plans error:", e);
    }
    try {
      const current = await getCompanyPlan();
      setCompanyPlan(current);
    } catch (e) {
      console.error("useSubscription companyPlan error:", e);
    }
    try {
      const status = await apiGetSubscriptionStatus();
      setSubscriptionStatus(status);
    } catch (e) {
      console.error("useSubscription status error:", e);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const subscribe = useCallback(async (planId: string) => {
    setActionLoading(true);
    try {
      const data = await apiCreateSubscription(planId);
      return data;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const cancel = useCallback(async () => {
    setActionLoading(true);
    try {
      await apiCancelSubscription();
      await refresh();
    } finally {
      setActionLoading(false);
    }
  }, [refresh]);

  const resume = useCallback(async () => {
    setActionLoading(true);
    try {
      await apiResumeSubscription();
      await refresh();
    } finally {
      setActionLoading(false);
    }
  }, [refresh]);

  const upgrade = useCallback(
    async (planId: string) => {
      setActionLoading(true);
      try {
        await apiChangePlan(planId);
        await refresh();
      } finally {
        setActionLoading(false);
      }
    },
    [refresh],
  );

  const selectPlan = useCallback(
    async (planId: string): Promise<SelectPlanResponse> => {
      setActionLoading(true);
      try {
        const result = await apiSelectPlan(planId);
        await refresh();
        return result;
      } finally {
        setActionLoading(false);
      }
    },
    [refresh],
  );

  return {
    plans,
    companyPlan,
    subscriptionStatus,
    isLoading,
    actionLoading,
    refresh,
    subscribe,
    cancel,
    resume,
    upgrade,
    selectPlan,
  };
}
