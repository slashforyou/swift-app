/**
 * Tests pour les utilitaires métier simples
 */

// Utilitaire simple pour valider un email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Utilitaire pour formater un nom
export const formatName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`.trim();
};

// Utilitaire pour calculer un pourcentage
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};