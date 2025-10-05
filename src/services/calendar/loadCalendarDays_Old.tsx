import { getAuthHeaders } from '../../utils/auth';
import { ServerData } from '@/src/constants/ServerData';

const loadCalendarDays = async (startDate: Date, endDate: Date) => {
    console.log("Loading calendar days from", startDate, "to", endDate);

  try {
    const headers = await getAuthHeaders();

    // We format dates as "dd-mm-yyyy" for the API (with the - between day, month, year to avoid confusion)
    const formattedStartDate = startDate.toISOString().split('T')[0].split('-').reverse().join('-');
    const formattedEndDate = endDate.toISOString().split('T')[0].split('-').reverse().join('-');

    console.log("Formatted dates:", { formattedStartDate, formattedEndDate });

    const response = await fetch(`${ServerData.serverUrl}calendar-days`, {
      method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
        body: JSON.stringify({
            startDate: formattedStartDate,
            endDate: formattedEndDate,
        }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch calendar days');
    }

    const data = await response.json();
    if ( !data.success) {
        throw new Error(data.error || 'Failed to fetch calendar days');
    }

    console.log("Calendar days loaded:", data.json);

    return data.json;
  } catch (error) {
    console.error('Error loading calendar days:', error);
    throw error;
  }
};

export default loadCalendarDays;
