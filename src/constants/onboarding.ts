/**
 * Onboarding tour configuration constants.
 * Centralizes timings, limits, and feature flags so they can be tuned
 * from a single place (and eventually driven by remote config).
 */

export const ONBOARDING_CONFIG = {
  /** Storage key for persisted tour progress. Bump when schema changes. */
  STORAGE_KEY: "@onboarding_tour_v1",

  /** Total number of steps in the tour (1..26). */
  TOTAL_STEPS: 26,

  /** Step 1 welcome modal: delay after Home layout is ready (ms). */
  STEP1_REVEAL_DELAY_MS: 1500,

  /** Hard fallback: show step 1 even if onLayout never fires (ms). */
  STEP1_LAYOUT_FALLBACK_MS: 5000,

  /** Welcome modal: staggered reveal between elements (ms). */
  WELCOME_STAGGER_MS: 170,

  /** Welcome modal: duration of each element fade-in (ms). */
  WELCOME_FADE_MS: 320,

  /** Overlay card: slide-in spring speed. */
  OVERLAY_SLIDE_SPEED: 14,

  /** Overlay card: slide-in spring bounciness. */
  OVERLAY_SLIDE_BOUNCINESS: 6,

  /** Spotlight ring pulse period (ms). */
  SPOTLIGHT_PULSE_MS: 900,

  /** Bubble auto-dismiss delay (ms). Bubble hides itself after this timeout. */
  BUBBLE_AUTO_DISMISS_MS: 7000,
} as const;

/** Roles allowed to see the onboarding tour. */
export const ONBOARDING_PATRON_ROLES = ["patron", "owner", "admin"] as const;

/** Navigation route for step 15 (Stripe activation). */
export const ONBOARDING_STRIPE_ROUTE = "StripeOnboarding" as const;

/** Steps where the user must act themselves (no "Next" button — card dismisses on action). */
export const ONBOARDING_ACTION_STEPS: readonly number[] = [2, 3, 4, 12];

/** Steps where the "Next" button is shown. */
export const ONBOARDING_BUTTON_STEPS: readonly number[] = [
  5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
];

/** Steps where the overlay must be positioned above the bottom safe area (card at top). */
export const ONBOARDING_TOP_POSITION_STEPS: readonly number[] = [3, 4];
