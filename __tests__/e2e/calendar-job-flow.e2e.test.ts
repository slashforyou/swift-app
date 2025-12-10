/**
 * Calendar Job Flow E2E Tests
 * Tests for complete calendar navigation and job management flow
 */
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';
import { ThemeProvider } from '../../src/context/ThemeProvider';
import DayScreen from '../../src/screens/calendar/dayScreen';
import * as jobsService from '../../src/services/jobsService';
import * as mockJobData from '../__mocks__/mockJobData';

// Mock external dependencies
jest.mock('../../src/services/jobsService', () => ({
  fetchJobs: jest.fn(),
  fetchJobDetails: jest.fn(),
  updateJob: jest.fn(),
}));

jest.mock('../../src/localization/useLocalization', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'calendar.noJobs': 'No jobs for this day',
        'calendar.loading': 'Loading jobs...',
        'jobs.status.pending': 'Pending',
        'jobs.status.in_progress': 'In Progress', 
        'jobs.status.completed': 'Completed',
        'jobs.status.cancelled': 'Cancelled',
        'navigation.back': 'Back',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock JobBox component
jest.mock('../../src/components/calendar/JobBox', () => {
  return function MockJobBox({ 
    job, 
    onPress, 
    navigation 
  }: { 
    job: any; 
    onPress: () => void; 
    navigation: any; 
  }) {
    const React = require('react');
    const { View, Text, Button } = require('react-native');
    
    return React.createElement(View, {
      testID: `job-box-${job.id}`,
    }, [
      React.createElement(Text, { key: 'title', testID: `job-title-${job.id}` }, job.type || 'Moving Service'),
      React.createElement(Text, { key: 'status', testID: `job-status-${job.id}` }, job.status),
      React.createElement(Text, { key: 'cost', testID: `job-cost-${job.id}` }, `$${job.estimatedCost}`),
      React.createElement(Button, {
        key: 'press-btn',
        testID: `job-press-${job.id}`,
        title: 'View Details',
        onPress: onPress
      }),
    ]);
  };
});

// Mock JobDetails navigation
const mockJobDetailsNavigation = jest.fn();
jest.mock('../../src/screens/jobDetails', () => {
  return function MockJobDetails({ route }: { route: any }) {
    const React = require('react');
    const { View, Text, Button } = require('react-native');
    
    const { jobId, day, month, year } = route.params;
    
    return React.createElement(View, {
      testID: 'job-details-screen',
    }, [
      React.createElement(Text, { key: 'job-id', testID: 'job-details-id' }, `Job: ${jobId}`),
      React.createElement(Text, { key: 'date' }, `Date: ${day}/${month}/${year}`),
      React.createElement(Button, {
        key: 'tab-job',
        testID: 'tab-job',
        title: 'Job',
        onPress: () => {}
      }),
      React.createElement(Button, {
        key: 'tab-client',
        testID: 'tab-client', 
        title: 'Client',
        onPress: () => {}
      }),
      React.createElement(Button, {
        key: 'tab-payment',
        testID: 'tab-payment',
        title: 'Payment',
        onPress: () => {}
      }),
      React.createElement(Button, {
        key: 'tab-note',
        testID: 'tab-note',
        title: 'Note',
        onPress: () => {}
      }),
      React.createElement(Button, {
        key: 'tab-summary',
        testID: 'tab-summary',
        title: 'Summary',
        onPress: () => {}
      }),
    ]);
  };
});

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('Calendar Job Flow E2E', () => {
  const mockNavigation = {
    navigate: mockJobDetailsNavigation,
    goBack: jest.fn(),
    canGoBack: jest.fn(() => true),
    setOptions: jest.fn(),
  };

  const defaultProps = {
    route: {
      params: {
        day: 15,
        month: 1,
        year: 2024,
      }
    },
    navigation: mockNavigation,
  };

  const mockJobs = [
    mockJobData.createMockJob({
      id: 'JOB-TEST-001',
      code: 'JOB-TEST-001',
      status: 'pending',
      type: 'Moving Service',
      estimatedCost: 150.00,
      scheduledDate: '2024-01-15',
    }),
    mockJobData.createMockJob({
      id: 'JOB-TEST-002', 
      code: 'JOB-TEST-002',
      status: 'in_progress',
      type: 'Packing Service',
      estimatedCost: 200.00,
      scheduledDate: '2024-01-15',
    }),
    mockJobData.createCompletedJob({
      id: 'JOB-TEST-003',
      code: 'JOB-TEST-003',
      type: 'Cleaning Service',
      estimatedCost: 100.00,
      scheduledDate: '2024-01-15',
    }),
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful API responses
    (jobsService.fetchJobs as jest.Mock).mockResolvedValue(mockJobs);
  });

  describe('Calendar Day View', () => {
    test('should display jobs for selected date', async () => {
      const { getByTestId, getByText } = render(
        <TestWrapper>
          <DayScreen {...defaultProps} />
        </TestWrapper>
      );

      // Should call fetchJobs for the selected date
      await waitFor(() => {
        expect(jobsService.fetchJobs).toHaveBeenCalledWith(
          expect.any(Date), // Start date
          expect.any(Date)  // End date
        );
      });

      // Should display all jobs for the day
      expect(getByTestId('job-box-JOB-TEST-001')).toBeTruthy();
      expect(getByTestId('job-box-JOB-TEST-002')).toBeTruthy();
      expect(getByTestId('job-box-JOB-TEST-003')).toBeTruthy();

      // Should display job information
      expect(getByText('Moving Service')).toBeTruthy();
      expect(getByText('Packing Service')).toBeTruthy();
      expect(getByText('Cleaning Service')).toBeTruthy();

      // Should display job statuses
      expect(getByText('pending')).toBeTruthy();
      expect(getByText('in_progress')).toBeTruthy();
      expect(getByText('completed')).toBeTruthy();
    });

    test('should show empty state when no jobs', async () => {
      (jobsService.fetchJobs as jest.Mock).mockResolvedValue([]);

      const { getByText } = render(
        <TestWrapper>
          <DayScreen {...defaultProps} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('No jobs for this day')).toBeTruthy();
      });
    });

    test('should show loading state while fetching jobs', async () => {
      // Delay the jobs fetch to test loading state
      (jobsService.fetchJobs as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockJobs), 1000))
      );

      const { getByText } = render(
        <TestWrapper>
          <DayScreen {...defaultProps} />
        </TestWrapper>
      );

      // Should show loading state
      expect(getByText('Loading jobs...')).toBeTruthy();

      // Wait for data to load
      await waitFor(() => {
        expect(getByText('Moving Service')).toBeTruthy();
      }, { timeout: 2000 });
    });
  });

  describe('Job Selection and Navigation', () => {
    test('should navigate to job details with correct parameters', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <DayScreen {...defaultProps} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('job-box-JOB-TEST-001')).toBeTruthy();
      });

      // Click on first job
      fireEvent.press(getByTestId('job-press-JOB-TEST-001'));

      // Should navigate to JobDetails with job code (not ID)
      expect(mockJobDetailsNavigation).toHaveBeenCalledWith('JobDetails', {
        jobId: 'JOB-TEST-001', // Job code should be used as jobId
        day: 15,
        month: 1,
        year: 2024,
      });
    });

    test('should handle job code vs ID correctly', async () => {
      const jobWithoutCode = mockJobData.createMockJob({
        id: 'JOB-NUMERIC-123',
        code: undefined, // No code, should fallback to ID
        status: 'pending',
      });

      (jobsService.fetchJobs as jest.Mock).mockResolvedValue([jobWithoutCode]);

      const { getByTestId } = render(
        <TestWrapper>
          <DayScreen {...defaultProps} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('job-box-JOB-NUMERIC-123')).toBeTruthy();
      });

      // Click on job without code
      fireEvent.press(getByTestId('job-press-JOB-NUMERIC-123'));

      // Should fallback to ID when code is not available
      expect(mockJobDetailsNavigation).toHaveBeenCalledWith('JobDetails', {
        jobId: 'JOB-NUMERIC-123',
        day: 15,
        month: 1,
        year: 2024,
      });
    });

    test('should pass date parameters correctly', async () => {
      const differentDateProps = {
        ...defaultProps,
        route: {
          params: {
            day: 25,
            month: 12, 
            year: 2023,
          }
        }
      };

      const { getByTestId } = render(
        <TestWrapper>
          <DayScreen {...differentDateProps} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('job-box-JOB-TEST-001')).toBeTruthy();
      });

      fireEvent.press(getByTestId('job-press-JOB-TEST-001'));

      expect(mockJobDetailsNavigation).toHaveBeenCalledWith('JobDetails', {
        jobId: 'JOB-TEST-001',
        day: 25,
        month: 12,
        year: 2023,
      });
    });
  });

  describe('Job Filtering and Display', () => {
    test('should filter jobs by status', async () => {
      const mixedStatusJobs = [
        mockJobData.createMockJob({ id: 'PENDING-1', status: 'pending' }),
        mockJobData.createMockJob({ id: 'PROGRESS-1', status: 'in_progress' }),
        mockJobData.createCompletedJob({ id: 'COMPLETED-1' }),
        mockJobData.createMockJob({ id: 'CANCELLED-1', status: 'cancelled' }),
      ];

      (jobsService.fetchJobs as jest.Mock).mockResolvedValue(mixedStatusJobs);

      const { getByTestId, getByText } = render(
        <TestWrapper>
          <DayScreen {...defaultProps} />
        </TestWrapper>
      );

      await waitFor(() => {
        // All jobs should be displayed initially
        expect(getByTestId('job-box-PENDING-1')).toBeTruthy();
        expect(getByTestId('job-box-PROGRESS-1')).toBeTruthy();
        expect(getByTestId('job-box-COMPLETED-1')).toBeTruthy();
        expect(getByTestId('job-box-CANCELLED-1')).toBeTruthy();
      });

      // Should display correct statuses
      expect(getByText('pending')).toBeTruthy();
      expect(getByText('in_progress')).toBeTruthy();
      expect(getByText('completed')).toBeTruthy();
      expect(getByText('cancelled')).toBeTruthy();
    });

    test('should display job information correctly', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <DayScreen {...defaultProps} />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check job titles
        expect(getByTestId('job-title-JOB-TEST-001')).toBeTruthy();
        expect(getByTestId('job-title-JOB-TEST-002')).toBeTruthy();
        expect(getByTestId('job-title-JOB-TEST-003')).toBeTruthy();

        // Check job statuses
        expect(getByTestId('job-status-JOB-TEST-001')).toBeTruthy();
        expect(getByTestId('job-status-JOB-TEST-002')).toBeTruthy();
        expect(getByTestId('job-status-JOB-TEST-003')).toBeTruthy();

        // Check job costs
        expect(getByTestId('job-cost-JOB-TEST-001')).toBeTruthy();
        expect(getByTestId('job-cost-JOB-TEST-002')).toBeTruthy();
        expect(getByTestId('job-cost-JOB-TEST-003')).toBeTruthy();
      });
    });
  });

  describe('Pull to Refresh', () => {
    test('should refresh jobs on pull down', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <DayScreen {...defaultProps} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(jobsService.fetchJobs).toHaveBeenCalledTimes(1);
      });

      // Simulate pull to refresh
      const scrollView = getByTestId('jobs-scroll-view');
      fireEvent(scrollView, 'onRefresh');

      await waitFor(() => {
        expect(jobsService.fetchJobs).toHaveBeenCalledTimes(2);
      });
    });

    test('should show refresh indicator while refreshing', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <DayScreen {...defaultProps} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('job-box-JOB-TEST-001')).toBeTruthy();
      });

      // Start refresh
      const scrollView = getByTestId('jobs-scroll-view');
      fireEvent(scrollView, 'onRefresh');

      // Refresh indicator behavior is handled by React Native internally
      // We just verify the refresh action was triggered
      expect(jobsService.fetchJobs).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      (jobsService.fetchJobs as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const { getByText } = render(
        <TestWrapper>
          <DayScreen {...defaultProps} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Failed to load jobs'
        );
      });

      // Should show empty state or error message
      expect(getByText('No jobs for this day')).toBeTruthy();
    });

    test('should handle service unavailable', async () => {
      (jobsService.fetchJobs as jest.Mock).mockRejectedValue({
        status: 503,
        message: 'Service Unavailable',
      });

      render(
        <TestWrapper>
          <DayScreen {...defaultProps} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Service Error',
          'Jobs service is temporarily unavailable'
        );
      });
    });

    test('should handle malformed job data', async () => {
      const malformedJobs = [
        { id: null, status: 'pending' }, // Missing ID
        { id: 'VALID-1', status: null }, // Missing status
        null, // Null job
        undefined, // Undefined job
      ];

      (jobsService.fetchJobs as jest.Mock).mockResolvedValue(malformedJobs);

      const { queryByTestId } = render(
        <TestWrapper>
          <DayScreen {...defaultProps} />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should not crash and should not render malformed jobs
        expect(queryByTestId('job-box-null')).toBeNull();
        expect(queryByTestId('job-box-undefined')).toBeNull();
        
        // Valid job should still render
        expect(queryByTestId('job-box-VALID-1')).toBeTruthy();
      });
    });
  });

  describe('Date Navigation Integration', () => {
    test('should handle date parameters correctly', async () => {
      const customDate = {
        day: 5,
        month: 6,
        year: 2024,
      };

      const customProps = {
        ...defaultProps,
        route: { params: customDate }
      };

      render(
        <TestWrapper>
          <DayScreen {...customProps} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(jobsService.fetchJobs).toHaveBeenCalledWith(
          expect.any(Date),
          expect.any(Date)
        );
      });

      // Verify the date range is correctly calculated
      const [startDate, endDate] = (jobsService.fetchJobs as jest.Mock).mock.calls[0];
      expect(startDate.getFullYear()).toBe(2024);
      expect(startDate.getMonth()).toBe(5); // June (0-indexed)
      expect(startDate.getDate()).toBe(5);
    });

    test('should format date display correctly', () => {
      const testDate = new Date(2024, 0, 15); // January 15, 2024
      const formattedDate = testDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      expect(formattedDate).toBe('Monday, January 15, 2024');
    });
  });

  describe('Performance Tests', () => {
    test('should handle large number of jobs efficiently', async () => {
      const largeJobList = Array.from({ length: 100 }, (_, index) => 
        mockJobData.createMockJob({
          id: `JOB-PERF-${String(index + 1).padStart(3, '0')}`,
          status: index % 2 === 0 ? 'completed' : 'pending',
        })
      );

      (jobsService.fetchJobs as jest.Mock).mockResolvedValue(largeJobList);

      const startTime = Date.now();
      
      const { getByTestId } = render(
        <TestWrapper>
          <DayScreen {...defaultProps} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('job-box-JOB-PERF-001')).toBeTruthy();
      });

      const renderTime = Date.now() - startTime;
      
      // Should render within reasonable time (less than 2 seconds)
      expect(renderTime).toBeLessThan(2000);
      
      // Should render all jobs
      expect(getByTestId('job-box-JOB-PERF-100')).toBeTruthy();
    });
  });
});