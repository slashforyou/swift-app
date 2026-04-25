/**
 * Lightweight onboarding telemetry.
 * Logs tour lifecycle events so we can measure funnel success and drop-off points.
 * Replace the `emit` body with a real analytics backend when available.
 */

type OnboardingEvent =
  | "tour_init"
  | "tour_resume"
  | "tour_start"
  | "tour_step_enter"
  | "tour_step_advance"
  | "tour_step_skip_request"
  | "tour_skip"
  | "tour_complete"
  | "tour_reset"
  | "tour_storage_error"
  | "tour_bounds_exceeded"
  | "tour_unmapped_wizard_step";

interface OnboardingEventPayload {
  step?: number;
  nextStep?: number;
  wizardStep?: string;
  error?: unknown;
  reason?: string;
}

function emit(event: OnboardingEvent, payload?: OnboardingEventPayload): void {
  if (__DEV__) {
    console.log(`[onboarding] ${event}`, payload ?? {});
  }
  // TODO: forward to analytics SDK (Sentry breadcrumb, Amplitude, etc.)
}

export const onboardingTelemetry = {
  init: (step: number) => emit("tour_init", { step }),
  resume: (step: number) => emit("tour_resume", { step }),
  start: () => emit("tour_start"),
  stepEnter: (step: number) => emit("tour_step_enter", { step }),
  stepAdvance: (step: number, nextStep: number) =>
    emit("tour_step_advance", { step, nextStep }),
  skipRequest: (step: number) => emit("tour_step_skip_request", { step }),
  skip: (step: number) => emit("tour_skip", { step }),
  complete: (step: number) => emit("tour_complete", { step }),
  reset: () => emit("tour_reset"),
  storageError: (reason: string, error: unknown) =>
    emit("tour_storage_error", { reason, error }),
  boundsExceeded: (step: number, nextStep: number) =>
    emit("tour_bounds_exceeded", { step, nextStep }),
  unmappedWizardStep: (wizardStep: string, step: number) =>
    emit("tour_unmapped_wizard_step", { wizardStep, step }),
};
