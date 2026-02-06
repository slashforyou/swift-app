/**
 * Stripe Requirements Mapping
 * Maps Stripe requirement field names to human-readable labels
 */

export const STRIPE_REQUIREMENT_LABELS: Record<
  string,
  { fr: string; en: string }
> = {
  // Individual Information
  "individual.id_number": {
    fr: "Numéro d'identité",
    en: "ID Number",
  },
  "individual.ssn_last_4": {
    fr: "Derniers 4 chiffres du SSN",
    en: "Last 4 SSN digits",
  },
  "individual.dob.day": {
    fr: "Date de naissance (jour)",
    en: "Date of birth (day)",
  },
  "individual.dob.month": {
    fr: "Date de naissance (mois)",
    en: "Date of birth (month)",
  },
  "individual.dob.year": {
    fr: "Date de naissance (année)",
    en: "Date of birth (year)",
  },
  "individual.dob": {
    fr: "Date de naissance",
    en: "Date of birth",
  },
  "individual.first_name": {
    fr: "Prénom",
    en: "First name",
  },
  "individual.last_name": {
    fr: "Nom",
    en: "Last name",
  },
  "individual.email": {
    fr: "Email",
    en: "Email",
  },
  "individual.phone": {
    fr: "Téléphone",
    en: "Phone",
  },

  // Address
  "individual.address.line1": {
    fr: "Adresse ligne 1",
    en: "Address line 1",
  },
  "individual.address.line2": {
    fr: "Adresse ligne 2",
    en: "Address line 2",
  },
  "individual.address.city": {
    fr: "Ville",
    en: "City",
  },
  "individual.address.state": {
    fr: "État/Province",
    en: "State/Province",
  },
  "individual.address.postal_code": {
    fr: "Code postal",
    en: "Postal code",
  },
  "individual.address.country": {
    fr: "Pays",
    en: "Country",
  },

  // Verification Documents
  "individual.verification.document": {
    fr: "Pièce d'identité",
    en: "ID Document",
  },
  "individual.verification.additional_document": {
    fr: "Document additionnel",
    en: "Additional document",
  },

  // Company Information
  "company.name": {
    fr: "Nom de l'entreprise",
    en: "Company name",
  },
  "company.tax_id": {
    fr: "Numéro SIRET/SIREN",
    en: "Tax ID",
  },
  "company.vat_id": {
    fr: "Numéro de TVA",
    en: "VAT ID",
  },
  "company.address.line1": {
    fr: "Adresse entreprise ligne 1",
    en: "Company address line 1",
  },
  "company.address.city": {
    fr: "Ville entreprise",
    en: "Company city",
  },
  "company.address.postal_code": {
    fr: "Code postal entreprise",
    en: "Company postal code",
  },
  "company.address.state": {
    fr: "État/Province entreprise",
    en: "Company state",
  },
  "company.phone": {
    fr: "Téléphone entreprise",
    en: "Company phone",
  },
  "company.verification.document": {
    fr: "Extrait Kbis / Document entreprise",
    en: "Company verification document",
  },

  // Business Profile
  "business_profile.url": {
    fr: "Site web de l'entreprise",
    en: "Business website",
  },
  "business_profile.mcc": {
    fr: "Code d'activité (MCC)",
    en: "Business category (MCC)",
  },
  "business_profile.product_description": {
    fr: "Description des produits/services",
    en: "Product/service description",
  },
  business_type: {
    fr: "Type d'entreprise",
    en: "Business type",
  },

  // External Account (Bank)
  external_account: {
    fr: "Compte bancaire",
    en: "Bank account",
  },
  bank_account: {
    fr: "Compte bancaire",
    en: "Bank account",
  },

  // Terms of Service
  "tos_acceptance.date": {
    fr: "Acceptation des conditions",
    en: "Terms acceptance",
  },
  "tos_acceptance.ip": {
    fr: "Adresse IP d'acceptation",
    en: "Acceptance IP address",
  },

  // Representative
  "representative.first_name": {
    fr: "Prénom du représentant",
    en: "Representative first name",
  },
  "representative.last_name": {
    fr: "Nom du représentant",
    en: "Representative last name",
  },
  "representative.email": {
    fr: "Email du représentant",
    en: "Representative email",
  },
  "representative.phone": {
    fr: "Téléphone du représentant",
    en: "Representative phone",
  },
  "representative.dob": {
    fr: "Date de naissance du représentant",
    en: "Representative date of birth",
  },
  "representative.address": {
    fr: "Adresse du représentant",
    en: "Representative address",
  },
  "representative.verification.document": {
    fr: "Pièce d'identité du représentant",
    en: "Representative ID document",
  },
};

/**
 * Get requirement label in specified language
 * @param field Stripe requirement field name
 * @param language Language code ('fr', 'en')
 * @returns Human-readable label
 */
export const getRequirementLabel = (
  field: string,
  language: "fr" | "en" = "fr",
): string => {
  const mapping = STRIPE_REQUIREMENT_LABELS[field];
  if (mapping) {
    return mapping[language];
  }

  // Fallback: return field name with formatting
  return field
    .replace(/^(individual|company|business_profile|representative)\./, "")
    .replace(/\./g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Get requirement priority based on field name
 * @param field Stripe requirement field name
 * @param isPastDue Whether the requirement is past due
 * @returns Priority level
 */
export const getRequirementPriority = (
  field: string,
  isPastDue: boolean = false,
): "critical" | "high" | "medium" | "low" => {
  if (isPastDue) {
    return "critical";
  }

  // Critical fields
  const criticalFields = [
    "individual.id_number",
    "individual.verification.document",
    "external_account",
    "bank_account",
    "tos_acceptance.date",
  ];

  if (criticalFields.some((f) => field.includes(f))) {
    return "high";
  }

  // Medium priority
  const mediumFields = [
    "individual.dob",
    "individual.address",
    "company.tax_id",
    "company.verification.document",
  ];

  if (mediumFields.some((f) => field.includes(f))) {
    return "medium";
  }

  // Low priority (eventually_due)
  return "low";
};

/**
 * Get icon name for requirement field
 * @param field Stripe requirement field name
 * @returns Ionicons name
 */
export const getRequirementIcon = (field: string): string => {
  if (field.includes("verification.document")) {
    return "document-text";
  }
  if (field.includes("address")) {
    return "location";
  }
  if (field.includes("email")) {
    return "mail";
  }
  if (field.includes("phone")) {
    return "call";
  }
  if (field.includes("external_account") || field.includes("bank_account")) {
    return "card";
  }
  if (field.includes("dob") || field.includes("date")) {
    return "calendar";
  }
  if (field.includes("url")) {
    return "globe";
  }
  if (field.includes("tos_acceptance")) {
    return "checkmark-circle";
  }
  return "information-circle";
};
