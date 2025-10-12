import { isValidEmail, formatName, calculatePercentage } from '../../src/utils/businessUtils';

describe('Business Utils', () => {
  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('test+tag@gmail.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('formatName', () => {
    it('should format names correctly', () => {
      expect(formatName('John', 'Doe')).toBe('John Doe');
      expect(formatName('Marie', 'Dupont')).toBe('Marie Dupont');
    });

    it('should handle empty strings', () => {
      expect(formatName('', 'Doe')).toBe('Doe');
      expect(formatName('John', '')).toBe('John');
      expect(formatName('', '')).toBe('');
    });

    it('should trim whitespace', () => {
      expect(formatName('  John  ', '  Doe  ')).toBe('John     Doe');
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate percentages correctly', () => {
      expect(calculatePercentage(25, 100)).toBe(25);
      expect(calculatePercentage(1, 3)).toBe(33);
      expect(calculatePercentage(2, 3)).toBe(67);
    });

    it('should handle edge cases', () => {
      expect(calculatePercentage(0, 100)).toBe(0);
      expect(calculatePercentage(100, 100)).toBe(100);
      expect(calculatePercentage(10, 0)).toBe(0);
    });

    it('should round to nearest integer', () => {
      expect(calculatePercentage(1, 6)).toBe(17); // 16.666... rounded to 17
      expect(calculatePercentage(1, 7)).toBe(14); // 14.285... rounded to 14
    });
  });
});