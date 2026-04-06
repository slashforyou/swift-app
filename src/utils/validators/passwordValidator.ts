/**
 * Password validation — mirrors server-side policy in resetPassword.js
 *
 * Rules:
 * - Min 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 digit
 * - At least 1 special character
 */

export interface PasswordValidationResult {
  valid: boolean;
  /** i18n-ready error key, null when valid */
  errorKey: string | null;
}

export function validatePassword(password: string): PasswordValidationResult {
  if (password.length < 8) {
    return { valid: false, errorKey: "validation.password.tooShort" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, errorKey: "validation.password.needsUppercase" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, errorKey: "validation.password.needsLowercase" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, errorKey: "validation.password.needsNumber" };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, errorKey: "validation.password.needsSpecial" };
  }
  return { valid: true, errorKey: null };
}
