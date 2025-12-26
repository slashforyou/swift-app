import { getAuthHeaders } from '../../utils/auth'

// Types
export interface CalendarDay {
  id: string
  date: string
  jobs: Array<{
    id: string
    title: string
    startTime: string
    endTime: string
    clientName: string
    status: 'scheduled' | 'completed' | 'cancelled'
  }>
  isWorkingDay: boolean
}

export interface CalendarResponse {
  success: boolean
  data: CalendarDay[]
  error?: string
  totalDays: number
}

// API Errors
export class CalendarApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'CalendarApiError'
  }
}

/**
 * Format date to dd-mm-yyyy format for API
 * @param date Date object to format
 * @returns Formatted date string (dd-mm-yyyy)
 */
function formatDateForApi(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0') // Month is 0-indexed
  const year = date.getFullYear().toString()
  
  return `${day}-${month}-${year}`
}

/**
 * Validate date range
 * @param startDate Start date
 * @param endDate End date
 */
function validateDateRange(startDate: Date, endDate: Date): void {
  if (startDate >= endDate) {
    throw new CalendarApiError('Start date must be before end date')
  }
  
  const maxRangeMs = 365 * 24 * 60 * 60 * 1000 // 1 year in milliseconds
  if (endDate.getTime() - startDate.getTime() > maxRangeMs) {
    throw new CalendarApiError('Date range cannot exceed 1 year')
  }
}

/**
 * Load calendar days from the API
 * @param startDate Start date for the range
 * @param endDate End date for the range
 * @returns Promise with calendar data
 */
const loadCalendarDays = async (
  startDate: Date, 
  endDate: Date
): Promise<CalendarDay[]> => {

    // TEMP_DISABLED: console.log("***** loadCalendarDays called *****");
  // Validate inputs
  validateDateRange(startDate, endDate)

  if (__DEV__) {}

  try {
    // Get authentication headers
    const authHeaders = await getAuthHeaders()
    
    // Format dates for API
    const formattedStartDate = formatDateForApi(startDate)
    const formattedEndDate = formatDateForApi(endDate)

    if (__DEV__) {
      // TEMP_DISABLED: console.log("Formatted dates:", { formattedStartDate, formattedEndDate })
    }

    // Prepare headers with proper typing
    // const headers: Record<string, string> = {
      // 'Content-Type': 'application/json',
    // }
    
    // Add auth header if available
    // if ('Authorization' in authHeaders && authHeaders.Authorization) {
      // headers.Authorization = authHeaders.Authorization
    // }

    // Make API request
    // const response = await fetch(`${ServerData.serverUrl}calendar-days`, {
      // method: 'POST',
      // headers,
      // body: JSON.stringify({
        // startDate: formattedStartDate,
        // endDate: formattedEndDate,
      // }),
    // })

    // Handle HTTP errors
    // if (!response.ok) {
      // const errorText = await response.text()
      // throw new CalendarApiError(
        // `HTTP ${response.status}: ${response.statusText}`,
        // response.status
      // )
    // }

    // Parse response
    // const data: CalendarResponse = await response.json()
    
    // Handle API-level errors
    // if (!data.success) {
      // throw new CalendarApiError(
        // data.error || 'Failed to fetch calendar days'
      // )
    // }

    // Validate response data
    // if (!Array.isArray(data.data)) {
      // throw new CalendarApiError('Invalid response format: expected array')
    // }

    // if (__DEV__) {
      // TEMP_DISABLED: console.log(`Calendar days loaded: ${data.data.length} days`)
    // }

    // return data.data

  } catch (error) {

    // Re-throw CalendarApiError as-is
    // if (error instanceof CalendarApiError) {
      // throw error
    // }

    // Network or other errors
    // if (error instanceof TypeError && error.message.includes('fetch')) {
      // throw new CalendarApiError(
        // 'Network error: Please check your internet connection',
        // undefined,
        // error as Error
      // )
    // }

    // JSON parsing errors
    // if (error instanceof SyntaxError) {
      // throw new CalendarApiError(
        // 'Invalid response format from server',
        // undefined,
        // error as Error
      // )
    // }

    // Unknown errors
    // const message = error instanceof Error ? error.message : 'Unknown error occurred'
    // throw new CalendarApiError(message, undefined, error as Error)
  }
  
  // Temporary return for compilation
  return [];
}

export default loadCalendarDays