/**
 * Calendar date utilities
 * Centralized date calculations for calendar operations
 */

export interface DateRange {
  start: Date
  end: Date
}

/**
 * Calculate the date range for initial calendar data load
 * Loads data for previous month to next month
 */
export function getCalendarDateRange(): DateRange {
  const start = new Date()
  start.setMonth(start.getMonth() - 1)
  start.setDate(1)
  start.setHours(0, 0, 0, 0) // Start of day
  
  const end = new Date()
  end.setMonth(end.getMonth() + 1)
  end.setDate(1)
  end.setHours(0, 0, 0, 0) // Start of day
  
  return { start, end }
}

/**
 * Get date range for a specific month
 */
export function getMonthDateRange(year: number, month: number): DateRange {
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0) // Last day of the month
  
  return { start, end }
}

/**
 * Get date range for a specific year
 */
export function getYearDateRange(year: number): DateRange {
  const start = new Date(year, 0, 1) // January 1st
  const end = new Date(year, 11, 31) // December 31st
  
  return { start, end }
}

/**
 * Format date for display
 */
export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Check if two dates are on the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate()
}

/**
 * Get the number of days between two dates
 */
export function getDaysBetween(startDate: Date, endDate: Date): number {
  const timeDiff = endDate.getTime() - startDate.getTime()
  return Math.ceil(timeDiff / (1000 * 3600 * 24))
}