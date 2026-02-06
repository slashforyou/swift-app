export interface BusinessOwnerRegistrationData {
  // Step 1: Personal Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  password: string;
  confirmPassword: string;

  // Step 2: Business Details
  companyName: string;
  tradingName: string;
  abn: string;
  acn: string;
  businessType: "sole_trader" | "partnership" | "company" | "trust" | "";
  industryType: "removals" | "logistics" | "storage" | "other" | "";
  companyEmail: string;
  companyPhone: string;

  // Step 3: Business Address
  streetAddress: string;
  suburb: string;
  state: "NSW" | "VIC" | "QLD" | "SA" | "WA" | "TAS" | "NT" | "ACT" | "";
  postcode: string;
  country: string;

  // Step 4: Banking Info
  bsb: string;
  accountNumber: string;
  accountName: string;

  // Step 5: Insurance (Optional)
  insuranceProvider: string;
  insurancePolicyNumber: string;
  insuranceExpiryDate: string;

  // Step 6: Subscription Plan
  planType: "starter" | "professional" | "enterprise" | "";
  billingFrequency: "monthly" | "yearly" | "";
  estimatedJobsPerMonth: string;

  // Step 7: Legal Agreements
  termsAccepted: boolean;
  privacyAccepted: boolean;
  stripeConnectAccepted: boolean;

  // Step 8: Documents (handled separately)
  // Files will be uploaded after registration
}

export const initialBusinessOwnerData: BusinessOwnerRegistrationData = {
  // Step 1
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  password: "",
  confirmPassword: "",

  // Step 2
  companyName: "",
  tradingName: "",
  abn: "",
  acn: "",
  businessType: "",
  industryType: "",
  companyEmail: "",
  companyPhone: "",

  // Step 3
  streetAddress: "",
  suburb: "",
  state: "",
  postcode: "",
  country: "Australia",

  // Step 4
  bsb: "",
  accountNumber: "",
  accountName: "",

  // Step 5
  insuranceProvider: "",
  insurancePolicyNumber: "",
  insuranceExpiryDate: "",

  // Step 6
  planType: "",
  billingFrequency: "",
  estimatedJobsPerMonth: "",

  // Step 7
  termsAccepted: false,
  privacyAccepted: false,
  stripeConnectAccepted: false,
};
