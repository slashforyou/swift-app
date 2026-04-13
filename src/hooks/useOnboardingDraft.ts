import { useCallback, useRef } from "react";
import { saveDraft } from "../services/StripeService";

/**
 * Hook for auto-saving onboarding draft data on field blur.
 * Debounces saves to avoid excessive server calls.
 */
export function useOnboardingDraft(step: string) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestData = useRef<Record<string, unknown>>({});

  const save = useCallback(
    (data: object) => {
      latestData.current = data as Record<string, unknown>;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        saveDraft(step, latestData.current);
      }, 400);
    },
    [step],
  );

  return { saveDraftNow: save };
}
