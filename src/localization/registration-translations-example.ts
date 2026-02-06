// Registration i18n keys example
// Add these translations to your localization files (en.ts, fr.ts, etc.)

export const registrationTranslations = {
  registration: {
    step: "Step",
    exitTitle: "Exit Registration",
    exitMessage: "Do you want to save your progress before leaving?",
    saveAndExit: "Save and Exit",
    exitWithoutSaving: "Exit without Saving",

    buttons: {
      back: "Back",
      next: "Next",
      skip: "Skip",
      submit: "Submit Registration",
      submitting: "Submitting...",
      edit: "Edit",
    },

    personalInfo: {
      title: "Personal Information",
      subtitle: "Tell us about yourself",
    },

    businessDetails: {
      title: "Business Details",
      subtitle: "Information about your business",
    },

    businessAddress: {
      title: "Business Address",
      subtitle: "Where is your business located?",
    },

    banking: {
      title: "Banking Information",
      subtitle: "For receiving payments via Stripe Connect",
    },

    insurance: {
      title: "Insurance (Optional)",
      subtitle: "Add your business insurance details",
      optional:
        "This step is optional. You can add insurance information later.",
    },

    subscription: {
      title: "Choose Your Plan",
      subtitle: "Select a subscription plan that fits your needs",
    },

    legal: {
      title: "Legal Agreements",
      subtitle: "Please review and accept the following agreements",
      termsAndConditions: "I accept the Terms and Conditions",
      privacyPolicy: "I accept the Privacy Policy",
      stripeConnectAgreement: "I accept the Stripe Connect Agreement",
      viewDocument: "View",
      dataSecurityNote:
        "Your data is encrypted and securely stored. We never share your information with third parties.",
    },

    review: {
      title: "Review & Submit",
      subtitle: "Please review your information before submitting",
      importantNote:
        "After submission, you will receive a verification email. Please verify your email to activate your account.",
    },

    fields: {
      firstName: "First Name",
      lastName: "Last Name",
      email: "Email Address",
      phone: "Phone Number",
      dateOfBirth: "Date of Birth",
      password: "Password",
      confirmPassword: "Confirm Password",

      companyName: "Company Name",
      tradingName: "Trading Name",
      abn: "ABN",
      acn: "ACN",
      businessType: "Business Type",
      industryType: "Industry Type",
      companyEmail: "Company Email",
      companyPhone: "Company Phone",
      selectBusinessType: "Select Business Type",
      selectIndustryType: "Select Industry Type",

      streetAddress: "Street Address",
      suburb: "Suburb",
      state: "State",
      postcode: "Postcode",
      country: "Country",
      selectState: "Select State",

      bsb: "BSB",
      accountNumber: "Account Number",
      accountName: "Account Name",
      accountNamePlaceholder: "Business or Personal Name",
      accountNameHelper: "Must match the name on the bank account",

      insuranceProvider: "Insurance Provider",
      insurancePolicyNumber: "Policy Number",
      insuranceExpiryDate: "Expiry Date",

      planType: "Plan Type",
      billingFrequency: "Billing Frequency",
      estimatedJobsPerMonth: "Estimated Jobs per Month",
      selectBillingFrequency: "Select Billing Frequency",
    },

    businessTypes: {
      sole_trader: "Sole Trader",
      partnership: "Partnership",
      company: "Company",
      trust: "Trust",
    },

    industryTypes: {
      removals: "Removals",
      logistics: "Logistics",
      storage: "Storage",
      other: "Other",
    },

    billingFrequency: {
      monthly: "Monthly",
      yearly: "Yearly",
    },

    validation: {
      firstNameRequired: "First name is required",
      lastNameRequired: "Last name is required",
      emailRequired: "Email is required",
      emailInvalid: "Please enter a valid email address",
      phoneRequired: "Phone number is required",
      phoneInvalid: "Please enter a valid Australian phone number (+61)",
      dateOfBirthRequired: "Date of birth is required",
      dateOfBirthInvalid: "Please enter a valid date (YYYY-MM-DD)",
      ageTooYoung: "You must be at least 18 years old to register",
      passwordRequired: "Password is required",
      passwordTooShort: "Password must be at least 8 characters",
      passwordNoUppercase:
        "Password must contain at least one uppercase letter",
      passwordNoNumber: "Password must contain at least one number",
      confirmPasswordRequired: "Please confirm your password",
      passwordsMismatch: "Passwords do not match",

      companyNameRequired: "Company name is required",
      abnRequired: "ABN is required",
      abnInvalid: "Please enter a valid 11-digit ABN",
      acnInvalid: "Please enter a valid 9-digit ACN",
      businessTypeRequired: "Please select a business type",
      industryTypeRequired: "Please select an industry type",
      companyPhoneRequired: "Company phone number is required",
      companyPhoneInvalid: "Please enter a valid Australian phone number",

      streetAddressRequired: "Street address is required",
      suburbRequired: "Suburb is required",
      stateRequired: "Please select a state",
      postcodeRequired: "Postcode is required",
      postcodeInvalid: "Please enter a valid 4-digit postcode",

      bsbRequired: "BSB is required",
      bsbInvalid: "Please enter a valid 6-digit BSB (XXX-XXX)",
      accountNumberRequired: "Account number is required",
      accountNumberInvalid: "Account number must be 6-10 digits",
      accountNameRequired: "Account name is required",

      planTypeRequired: "Please select a plan",
      billingFrequencyRequired: "Please select a billing frequency",

      termsRequired: "You must accept the Terms and Conditions",
      privacyRequired: "You must accept the Privacy Policy",
      stripeConnectRequired: "You must accept the Stripe Connect Agreement",
    },

    errors: {
      submissionFailed: "Registration failed. Please try again.",
      draftLoadFailed: "Failed to load saved draft",
      draftSaveFailed: "Failed to save draft",
    },
  },

  common: {
    error: "Error",
    success: "Success",
    cancel: "Cancel",
    exit: "Exit",
  },
};
