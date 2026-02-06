/**
 * 🧪 Test Data Configuration
 *
 * This file contains test data used to auto-fill forms in development mode.
 * Modify these values to generate different test scenarios.
 *
 * Usage: Forms will be automatically filled with this data when __DEV__ is true
 */

export const TEST_DATA = {
  /**
   * Step 1: Personal Information
   */
  personalInfo: {
    firstName: "James",
    lastName: "Wilson",
    email: "test.owner@gmail.com",
    phone: "0412345678",
    dateOfBirth: "1985-03-15", // Format: YYYY-MM-DD
    password: "Xk9#mP2@wT5!",
    confirmPassword: "Xk9#mP2@wT5!",
  },

  /**
   * Step 2: Business Details
   */
  businessDetails: {
    companyName: "Cobbr Clean Services Pty Ltd",
    tradingName: "Cobbr Clean",
    abn: "51824753556", // Valid checksum: 51 824 753 556
    acn: "123456780", // Valid checksum: 123 456 780
    businessType: "company", // soleTrader | partnership | company | trust
    industryType: "moving", // Locked to moving
    companyEmail: "info.cobbrclean@gmail.com",
    companyPhone: "0298765432", // Will be converted to +61298765432
  },

  /**
   * Step 3: Business Address
   */
  businessAddress: {
    streetAddress: "123 George Street",
    suburb: "Sydney",
    state: "NSW", // NSW | VIC | QLD | SA | WA | TAS | NT | ACT
    postcode: "2000",
  },

  /**
   * Step 4: Banking Information
   */
  bankingInfo: {
    bsb: "062000", // Commonwealth Bank Sydney (display: 062-000)
    accountNumber: "12345678",
    accountName: "Cobbr Clean Services Pty Ltd",
  },

  /**
   * Step 5: Insurance (Optional)
   */
  insurance: {
    hasInsurance: false, // Toggle to true for insurance test
    insuranceProvider: "CGU Insurance",
    policyNumber: "POL-SC-2025-001",
    expiryDate: "2026-12-31", // Format: YYYY-MM-DD
  },

  /**
   * Step 6: Subscription Plan
   */
  subscription: {
    planType: "professional", // starter | professional | enterprise
    billingFrequency: "monthly", // monthly | yearly
  },

  /**
   * Step 7: Legal Agreements
   */
  legalAgreements: {
    termsAccepted: true,
    privacyAccepted: true,
    stripeAccepted: true,
  },
};

/**
 * Alternative Test Data Set
 *
 * Use this for testing multiple account registrations
 */
export const TEST_DATA_ALT = {
  personalInfo: {
    firstName: "Sarah",
    lastName: "Thompson",
    email: "sarah.thompson@cobbr.test",
    phone: "0423456789",
    dateOfBirth: "1990-07-22",
    password: "SecurePass456!",
    confirmPassword: "SecurePass456!",
  },

  businessDetails: {
    companyName: "Premium Services Australia Pty Ltd",
    tradingName: "Premium Services",
    abn: "53004085616", // Valid checksum
    acn: "004085616",
    businessType: "company",
    industryType: "moving",
    companyEmail: "info@premiumservices.test",
    companyPhone: "0287654321",
  },

  businessAddress: {
    streetAddress: "456 Pitt Street",
    suburb: "Melbourne",
    state: "VIC",
    postcode: "3000",
  },

  bankingInfo: {
    bsb: "032002", // Westpac Sydney (display: 032-002)
    accountNumber: "87654321",
    accountName: "Premium Services Australia Pty Ltd",
  },

  insurance: {
    hasInsurance: true,
    insuranceProvider: "Allianz Insurance",
    policyNumber: "POL-PS-2025-002",
    expiryDate: "2027-06-30",
  },

  subscription: {
    planType: "starter",
    billingFrequency: "yearly",
  },

  legalAgreements: {
    termsAccepted: true,
    privacyAccepted: true,
    stripeAccepted: true,
  },
};

/**
 * Helper function to get test data
 *
 * @param useAlternative - Use alternative test data set
 * @returns Test data object
 */
export function getTestData(useAlternative: boolean = false) {
  return useAlternative ? TEST_DATA_ALT : TEST_DATA;
}

/**
 * Check if auto-fill should be enabled
 *
 * @returns true if in development mode
 */
export function shouldAutoFill(): boolean {
  return __DEV__;
}
