/**
 * Australian-specific validators for registration
 */

/**
 * Validate ABN (Australian Business Number)
 * Format: XX XXX XXX XXX (11 digits)
 */
export const validateABN = (
  abn: string,
): { isValid: boolean; message?: string } => {
  // Remove spaces and non-digits
  const cleanABN = abn.replace(/\s/g, "").replace(/[^\d]/g, "");

  if (cleanABN.length !== 11) {
    return {
      isValid: false,
      message: "ABN must be 11 digits",
    };
  }

  // ABN checksum validation
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  let sum = 0;

  // Subtract 1 from the first digit
  const firstDigit = parseInt(cleanABN[0]) - 1;
  sum += firstDigit * weights[0];

  // Calculate weighted sum for remaining digits
  for (let i = 1; i < 11; i++) {
    sum += parseInt(cleanABN[i]) * weights[i];
  }

  if (sum % 89 !== 0) {
    return {
      isValid: false,
      message: "Invalid ABN checksum",
    };
  }

  return { isValid: true };
};

/**
 * Format ABN to standard display format
 * Input: "12345678901" -> Output: "12 345 678 901"
 */
export const formatABN = (abn: string): string => {
  const cleanABN = abn.replace(/\s/g, "").replace(/[^\d]/g, "");

  if (cleanABN.length !== 11) {
    return abn;
  }

  return `${cleanABN.slice(0, 2)} ${cleanABN.slice(2, 5)} ${cleanABN.slice(5, 8)} ${cleanABN.slice(8, 11)}`;
};

/**
 * Validate ACN (Australian Company Number)
 * Format: XXX XXX XXX (9 digits)
 */
export const validateACN = (
  acn: string,
): { isValid: boolean; message?: string } => {
  const cleanACN = acn.replace(/\s/g, "").replace(/[^\d]/g, "");

  if (cleanACN.length !== 9) {
    return {
      isValid: false,
      message: "ACN must be 9 digits",
    };
  }

  // ACN checksum validation
  const weights = [8, 7, 6, 5, 4, 3, 2, 1];
  let sum = 0;

  for (let i = 0; i < 8; i++) {
    sum += parseInt(cleanACN[i]) * weights[i];
  }

  const remainder = sum % 10;
  const checkDigit = remainder === 0 ? 0 : 10 - remainder;

  if (checkDigit !== parseInt(cleanACN[8])) {
    return {
      isValid: false,
      message: "Invalid ACN checksum",
    };
  }

  return { isValid: true };
};

/**
 * Format ACN to standard display format
 * Input: "123456789" -> Output: "123 456 789"
 */
export const formatACN = (acn: string): string => {
  const cleanACN = acn.replace(/\s/g, "").replace(/[^\d]/g, "");

  if (cleanACN.length !== 9) {
    return acn;
  }

  return `${cleanACN.slice(0, 3)} ${cleanACN.slice(3, 6)} ${cleanACN.slice(6, 9)}`;
};

/**
 * Validate BSB (Bank State Branch)
 * Format: XXX-XXX (6 digits)
 */
export const validateBSB = (
  bsb: string,
): { isValid: boolean; message?: string } => {
  const cleanBSB = bsb.replace(/\s/g, "").replace(/[^\d]/g, "");

  if (cleanBSB.length !== 6) {
    return {
      isValid: false,
      message: "BSB must be 6 digits",
    };
  }

  return { isValid: true };
};

/**
 * Format BSB to standard display format
 * Input: "062000" -> Output: "062-000"
 */
export const formatBSB = (bsb: string): string => {
  const cleanBSB = bsb.replace(/\s/g, "").replace(/[^\d]/g, "");

  if (cleanBSB.length !== 6) {
    return bsb;
  }

  return `${cleanBSB.slice(0, 3)}-${cleanBSB.slice(3, 6)}`;
};

/**
 * Validate Australian phone number
 * Format: +61 4XX XXX XXX (mobile)
 */
export const validateAustralianPhone = (
  phone: string,
): { isValid: boolean; message?: string } => {
  // Remove spaces and formatting
  const cleanPhone = phone.replace(/\s/g, "").replace(/[^\d+]/g, "");

  // Australian mobile with +61: +61 4XX XXX XXX
  const mobileInternationalRegex = /^\+61[45]\d{8}$/;

  // Australian mobile with 0: 04XX XXX XXX
  const mobileLocalRegex = /^0[45]\d{8}$/;

  // Australian landline with +61: +61 [2-9]X XXX XXXX
  const landlineInternationalRegex = /^\+61[2-9]\d{8}$/;

  // Australian landline with 0: 0[2-9] XXXX XXXX
  const landlineLocalRegex = /^0[2-9]\d{8}$/;

  if (
    !mobileInternationalRegex.test(cleanPhone) &&
    !mobileLocalRegex.test(cleanPhone) &&
    !landlineInternationalRegex.test(cleanPhone) &&
    !landlineLocalRegex.test(cleanPhone)
  ) {
    return {
      isValid: false,
      message:
        "Invalid Australian phone number. Format: 04XX XXX XXX or +61 4XX XXX XXX",
    };
  }

  return { isValid: true };
};

/**
 * Format Australian phone to standard display format
 * Input: "0412345678" -> Output: "+61 412 345 678"
 * Input: "+61412345678" -> Output: "+61 412 345 678"
 */
export const formatAustralianPhone = (phone: string): string => {
  const cleanPhone = phone.replace(/\s/g, "").replace(/[^\d+]/g, "");

  // Convert 04XX format to +614XX
  if (cleanPhone.startsWith("0") && cleanPhone.length === 10) {
    const international = "+61" + cleanPhone.slice(1);
    return `${international.slice(0, 3)} ${international.slice(3, 6)} ${international.slice(6, 9)} ${international.slice(9, 12)}`;
  }

  // Format +61 numbers
  if (cleanPhone.length === 12 && cleanPhone.startsWith("+61")) {
    return `${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3, 6)} ${cleanPhone.slice(6, 9)} ${cleanPhone.slice(9, 12)}`;
  }

  return phone;
};

/**
 * Validate Australian postcode
 * Format: XXXX (4 digits)
 */
export const validatePostcode = (
  postcode: string,
): { isValid: boolean; message?: string } => {
  const cleanPostcode = postcode.replace(/\s/g, "").replace(/[^\d]/g, "");

  if (cleanPostcode.length !== 4) {
    return {
      isValid: false,
      message: "Postcode must be 4 digits",
    };
  }

  const postcodeNum = parseInt(cleanPostcode);

  // Australian postcodes range from 0200 to 9999
  if (postcodeNum < 200 || postcodeNum > 9999) {
    return {
      isValid: false,
      message: "Invalid Australian postcode",
    };
  }

  return { isValid: true };
};

/**
 * Validate TFN (Tax File Number) - Optional, for contractors
 * Format: XXX XXX XXX (9 digits)
 */
export const validateTFN = (
  tfn: string,
): { isValid: boolean; message?: string } => {
  const cleanTFN = tfn.replace(/\s/g, "").replace(/[^\d]/g, "");

  if (cleanTFN.length !== 9) {
    return {
      isValid: false,
      message: "TFN must be 9 digits",
    };
  }

  // TFN checksum validation
  const weights = [1, 4, 3, 7, 5, 8, 6, 9, 10];
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanTFN[i]) * weights[i];
  }

  if (sum % 11 !== 0) {
    return {
      isValid: false,
      message: "Invalid TFN checksum",
    };
  }

  return { isValid: true };
};

/**
 * Format TFN to standard display format
 * Input: "123456789" -> Output: "123 456 789"
 */
export const formatTFN = (tfn: string): string => {
  const cleanTFN = tfn.replace(/\s/g, "").replace(/[^\d]/g, "");

  if (cleanTFN.length !== 9) {
    return tfn;
  }

  return `${cleanTFN.slice(0, 3)} ${cleanTFN.slice(3, 6)} ${cleanTFN.slice(6, 9)}`;
};
