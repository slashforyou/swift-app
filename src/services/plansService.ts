/**
 * Plans Service — API calls for subscription plans
 */
import { ServerData } from "../constants/ServerData";
import { authenticatedFetch } from "../utils/auth";

const API = ServerData.serverUrl;

export interface Plan {
  id: string;
  label: string;
  display_name: string;
  price_monthly: number;
  included_users: number;
  extra_user_price: number;
  max_jobs_created: number; // -1 = unlimited
  max_jobs_accepted: number; // -1 = unlimited
  platform_fee_percentage: number;
  commission_rate: number; // decimal e.g. 0.025 = 2.5%
  min_fee_aud: number;
  features: {
    branding?: boolean;
    priority_support?: boolean;
    admin_only?: boolean;
  };
  is_public: number;
  sort_order: number;
}

export interface PlanUsage {
  current_users: number;
  extra_users: number;
  jobs_created_this_month: number;
  jobs_remaining: number; // -1 = unlimited
}

export interface CompanyPlan {
  plan: Plan;
  usage: PlanUsage;
}

export async function getPlans(): Promise<Plan[]> {
  const res = await fetch(`${API}v1/plans`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Failed to fetch plans");
  return json.data;
}

export async function getCompanyPlan(): Promise<CompanyPlan> {
  const res = await authenticatedFetch(`${API}v1/company/plan`);
  const json = await res.json();
  if (!json.success)
    throw new Error(json.error || "Failed to fetch company plan");
  return json.data;
}

// ── Subscription API ──────────────────────────────────────────────────────

export interface SubscriptionCreateResponse {
  subscriptionId: string;
  clientSecret: string;
  ephemeralKey: string;
  customerId: string;
  publishableKey: string;
}

export interface SubscriptionStatus {
  plan_type: string;
  subscription_status: string;
  subscription_id: string | null;
  stripe_details: {
    status: string;
    current_period_start: number;
    current_period_end: number;
    cancel_at_period_end: boolean;
    cancel_at: number | null;
    default_payment_method: string | null;
  } | null;
}

export async function createSubscription(
  planId: string,
): Promise<SubscriptionCreateResponse> {
  const res = await authenticatedFetch(
    `${API}v1/stripe/subscriptions/create`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan_id: planId }),
    },
  );
  const json = await res.json();
  if (!json.success)
    throw new Error(json.error || "Failed to create subscription");
  return json.data;
}

export async function cancelSubscription(): Promise<void> {
  const res = await authenticatedFetch(
    `${API}v1/stripe/subscriptions/cancel`,
    { method: "POST" },
  );
  const json = await res.json();
  if (!json.success)
    throw new Error(json.error || "Failed to cancel subscription");
}

export async function resumeSubscription(): Promise<void> {
  const res = await authenticatedFetch(
    `${API}v1/stripe/subscriptions/resume`,
    { method: "POST" },
  );
  const json = await res.json();
  if (!json.success)
    throw new Error(json.error || "Failed to resume subscription");
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const res = await authenticatedFetch(
    `${API}v1/stripe/subscriptions/status`,
  );
  const json = await res.json();
  if (!json.success)
    throw new Error(json.error || "Failed to get subscription status");
  return json.data;
}

export async function changePlan(planId: string): Promise<void> {
  const res = await authenticatedFetch(
    `${API}v1/stripe/subscriptions/change-plan`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan_id: planId }),
    },
  );
  const json = await res.json();
  if (!json.success)
    throw new Error(json.error || "Failed to change plan");
}

export interface SelectPlanResponse {
  plan_id: string;
  plan_label: string;
  price_monthly: number;
  platform_fee_percentage: number;
  commission_rate: number;
  requires_subscription: boolean;
}

export async function selectPlan(planId: string): Promise<SelectPlanResponse> {
  const res = await authenticatedFetch(
    `${API}v1/company/select-plan`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan_id: planId }),
    },
  );
  const json = await res.json();
  if (!json.success)
    throw new Error(json.error || "Failed to select plan");
  return json.data;
}
