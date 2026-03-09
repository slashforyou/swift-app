export type StripeOnboardingBusinessType = "individual" | "company";

type StripeRequirements = {
  currently_due?: string[];
  past_due?: string[];
  eventually_due?: string[];
};

export type StripeOnboardingStep =
  | "PersonalInfo"
  | "BusinessProfile"
  | "Address"
  | "CompanyDetails"
  | "Representative"
  | "BankAccount"
  | "Documents"
  | "Review";

const stepsByType: Record<
  StripeOnboardingBusinessType,
  StripeOnboardingStep[]
> = {
  individual: [
    "PersonalInfo",
    "BusinessProfile",
    "Address",
    "BankAccount",
    "Documents",
    "Review",
  ],
  company: [
    "PersonalInfo",
    "BusinessProfile",
    "Address",
    "CompanyDetails",
    "Representative",
    "BankAccount",
    "Documents",
    "Review",
  ],
};

export const resolveBusinessType = (
  businessType?: string | null,
  requirements?: StripeRequirements | null,
): StripeOnboardingBusinessType => {
  if (businessType === "company") {
    return "company";
  }

  const fields = [
    ...(requirements?.currently_due ?? []),
    ...(requirements?.past_due ?? []),
  ];

  if (fields.some((field) => field.startsWith("company."))) {
    return "company";
  }

  if (fields.some((field) => field.startsWith("representative."))) {
    return "company";
  }

  // Backend v3.1 can return requirements like person_<id>.relationship.title
  // which only exist in the company persons model.
  if (fields.some((field) => field.startsWith("person_"))) {
    return "company";
  }

  if (
    fields.some(
      (field) =>
        field.startsWith("directors.") ||
        field.startsWith("executives.") ||
        field.startsWith("owners."),
    )
  ) {
    return "company";
  }

  return "individual";
};

const mapRequirementToStep = (field: string): StripeOnboardingStep | null => {
  if (field.startsWith("business_profile.")) {
    return "BusinessProfile";
  }

  if (field === "business_type") {
    return "BusinessProfile";
  }

  if (field.startsWith("company.")) {
    if (
      field === "company.phone" ||
      field === "company.registration_number" ||
      field === "company.tax_id" ||
      field === "company.name"
    ) {
      return "CompanyDetails";
    }

    if (
      field === "company.directors_provided" ||
      field === "company.executives_provided" ||
      field === "company.owners_provided"
    ) {
      return "Representative";
    }

    return "CompanyDetails";
  }

  // Stripe can require company persons by role (owners/directors/executives)
  // We reuse the existing Representative screen to collect and submit these.
  if (
    field.startsWith("directors.") ||
    field.startsWith("executives.") ||
    field.startsWith("owners.")
  ) {
    return "Representative";
  }

  if (field.startsWith("representative.")) {
    return "Representative";
  }

  // Backend v3.1 can return requirements like person_<id>.relationship.title
  // These still belong to the company persons collection step.
  if (field.startsWith("person_")) {
    if (field.includes(".verification.")) {
      return "Documents";
    }
    return "Representative";
  }

  if (
    field === "external_account" ||
    field === "bank_account" ||
    field.startsWith("external_account") ||
    field.startsWith("bank_account")
  ) {
    return "BankAccount";
  }

  if (field.startsWith("individual.address.")) {
    return "Address";
  }

  if (field.startsWith("individual.verification.")) {
    return "Documents";
  }

  if (field.startsWith("individual.")) {
    return "PersonalInfo";
  }

  if (field.startsWith("tos_acceptance")) {
    return "Review";
  }

  return null;
};

export const getMissingOnboardingSteps = (
  requirements?: StripeRequirements | null,
  businessType?: StripeOnboardingBusinessType,
): { steps: StripeOnboardingStep[]; unhandled: string[] } => {
  const fields = [
    ...(requirements?.past_due ?? []),
    ...(requirements?.currently_due ?? []),
  ];

  const missingSteps = new Set<StripeOnboardingStep>();
  const unhandled: string[] = [];

  fields.forEach((field) => {
    const step = mapRequirementToStep(field);
    if (step) {
      missingSteps.add(step);
    } else {
      unhandled.push(field);
    }
  });

  const steps =
    stepsByType[businessType || "individual"] || stepsByType.individual;

  return {
    steps: steps.filter((step) => missingSteps.has(step)),
    unhandled,
  };
};

export const getStartOnboardingStep = (
  requirements?: StripeRequirements | null,
  businessType?: StripeOnboardingBusinessType,
): StripeOnboardingStep => {
  const { steps } = getMissingOnboardingSteps(requirements, businessType);
  return steps[0] || "Review";
};

export const getNextOnboardingStep = (
  currentStep: StripeOnboardingStep,
  requirements?: StripeRequirements | null,
  businessType?: StripeOnboardingBusinessType,
): StripeOnboardingStep => {
  const { steps } = getMissingOnboardingSteps(requirements, businessType);
  if (steps.length === 0) {
    return "Review";
  }

  const orderedSteps =
    stepsByType[businessType || "individual"] || stepsByType.individual;
  const currentIndex = orderedSteps.indexOf(currentStep);

  for (let i = currentIndex + 1; i < orderedSteps.length; i += 1) {
    const step = orderedSteps[i];
    if (steps.includes(step)) {
      return step;
    }
  }

  return "Review";
};

export const getOnboardingStepMeta = (
  step: StripeOnboardingStep,
  businessType: StripeOnboardingBusinessType,
) => {
  const steps = stepsByType[businessType] || stepsByType.individual;
  const index = Math.max(steps.indexOf(step), 0);
  const total = steps.length;
  const progress = Math.round(((index + 1) / total) * 100);

  return {
    index,
    total,
    progress,
  };
};
