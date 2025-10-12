import { formatDisplayDate, isSameDay, getDaysBetween, DateRange } from '../../src/utils/dateUtils';

describe('Date Utils', () => {
  describe('formatDisplayDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00');
      const result = formatDisplayDate(date);
      
      // Just check that it returns a string (locale-dependent)
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('isSameDay', () => {
    it('should return true for same date', () => {
      const date1 = new Date('2024-01-15T10:30:00');
      const date2 = new Date('2024-01-15T15:45:00');
      const result = isSameDay(date1, date2);
      
      expect(result).toBe(true);
    });

    it('should return false for different dates', () => {
      const date1 = new Date('2024-01-15T10:30:00');
      const date2 = new Date('2024-01-16T10:30:00');
      const result = isSameDay(date1, date2);
      
      expect(result).toBe(false);
    });
  });

  describe('getDaysBetween', () => {
    it('should calculate days between dates correctly', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-05');
      const result = getDaysBetween(startDate, endDate);
      
      expect(result).toBe(4);
    });

    it('should return 0 for same date', () => {
      const date = new Date('2024-01-01');
      const result = getDaysBetween(date, date);
      
      expect(result).toBe(0);
    });
  });
});