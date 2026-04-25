/**
 * useJobPaymentStatus — Hook de suivi du statut de paiement d'un job
 * Démarre automatiquement un polling toutes les 30s quand un lien de dépôt
 * est en attente de règlement. S'arrête dès que le paiement est confirmé.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchJobById } from "../services/jobs";

export type DepositStatus = "none" | "link_sent" | "pending" | "paid";

export interface JobPaymentStatusState {
  paymentStatus: string;
  depositPaid: boolean;
  depositAmount: number | null;
  depositLinkUrl: string | null;
  depositLinkId: string | null;
  depositStatus: DepositStatus;
  lastChecked: Date | null;
  isPolling: boolean;
  isRefreshing: boolean;
}

export interface JobPaymentStatusActions {
  refresh: () => Promise<void>;
  syncFromJob: (job: any) => void;
}

const POLL_INTERVAL_MS = 30_000;

export const useJobPaymentStatus = (
  jobId: number | string | undefined,
): JobPaymentStatusState & JobPaymentStatusActions => {
  const [state, setState] = useState<JobPaymentStatusState>({
    paymentStatus: "pending",
    depositPaid: false,
    depositAmount: null,
    depositLinkUrl: null,
    depositLinkId: null,
    depositStatus: "none",
    lastChecked: null,
    isPolling: false,
    isRefreshing: false,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const parseJobData = useCallback((raw: any): Partial<JobPaymentStatusState> => {
    const jobData = raw?.job || raw;
    return {
      paymentStatus: jobData?.payment_status || "pending",
      depositPaid: !!jobData?.deposit_paid,
      depositAmount: jobData?.deposit_amount ?? null,
      depositLinkUrl: jobData?.deposit_payment_link_url ?? null,
      depositLinkId: jobData?.deposit_payment_link_id ?? null,
      depositStatus: (jobData?.deposit_status as DepositStatus) || "none",
    };
  }, []);

  /** Sync depuis un objet job déjà en mémoire (pas d'appel réseau) */
  const syncFromJob = useCallback(
    (job: any) => {
      if (!isMountedRef.current) return;
      setState((prev) => ({
        ...prev,
        ...parseJobData(job),
        lastChecked: new Date(),
      }));
    },
    [parseJobData],
  );

  /** Rafraîchissement manuel (appel GET /v1/jobs/:id) */
  const refresh = useCallback(async () => {
    if (!jobId || !isMountedRef.current) return;
    setState((prev) => ({ ...prev, isRefreshing: true }));
    try {
      const data = await fetchJobById(String(jobId));
      if (!isMountedRef.current) return;
      setState((prev) => ({
        ...prev,
        ...parseJobData(data),
        lastChecked: new Date(),
        isRefreshing: false,
      }));
    } catch {
      if (isMountedRef.current) {
        setState((prev) => ({ ...prev, isRefreshing: false }));
      }
    }
  }, [jobId, parseJobData]);

  /** Démarrer / arrêter le polling selon l'état du dépôt */
  useEffect(() => {
    const shouldPoll =
      state.depositStatus === "link_sent" || state.depositStatus === "pending";

    if (shouldPoll && !intervalRef.current) {
      setState((prev) => ({ ...prev, isPolling: true }));
      intervalRef.current = setInterval(() => {
        refresh();
      }, POLL_INTERVAL_MS);
    } else if (!shouldPoll && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setState((prev) => ({ ...prev, isPolling: false }));
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.depositStatus, refresh]);

  return { ...state, refresh, syncFromJob };
};
