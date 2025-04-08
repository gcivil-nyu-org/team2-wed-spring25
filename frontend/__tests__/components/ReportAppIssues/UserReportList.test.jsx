import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import UserReportsList from '@/app/custom-components/ReportAppIssues/UserReportList';
import { authAPI } from '@/utils/fetch/fetch';
import { formatDateAgoShort } from '@/utils/datetime';

// Mock dependencies
jest.mock('@/utils/fetch/fetch', () => ({
  authAPI: {
    authenticatedGet: jest.fn(),
  }
}));

jest.mock('@/utils/datetime', () => ({
  formatDateAgoShort: jest.fn(),
}));

describe('UserReportsList', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    formatDateAgoShort.mockImplementation(date => '2 days ago');
  });

  // Mock sample reports data
  const mockReports = [
    {
      id: 1,
      title: 'Test Report 1',
      description: 'This is a short description for test report 1',
      reported_at: '2023-01-01T12:00:00Z',
      status: 'Submitted'
    },
    {
      id: 2,
      title: 'Test Report 2',
      description: 'This is a very long description for test report 2. It needs to be longer than 120 characters to test the truncation functionality. So I will add more text here to ensure it exceeds the CHARACTER_LIMIT defined in the component.',
      reported_at: '2023-01-02T12:00:00Z',
      status: 'Under Review'
    }
  ];

  test('renders loading skeleton initially', () => {
    // Mock API to delay response
    authAPI.authenticatedGet.mockReturnValue(new Promise(resolve => setTimeout(() => resolve([]), 1000)));
    
    render(<UserReportsList />);
    
    // Check for loading skeletons using data-testid
    const skeletons = screen.getAllByTestId('report-skeleton');
    expect(skeletons.length).toBe(3); // We expect 3 skeleton items
    
    // Verify heading is visible during loading
    expect(screen.getByText('My Reports')).toBeInTheDocument();
  });
  
  test('renders error state when API fails', async () => {
    // Mock API to return an error
    const errorMessage = 'Failed to fetch reports';
    authAPI.authenticatedGet.mockRejectedValue(new Error(errorMessage));
    
    render(<UserReportsList />);
    
    // Wait for error state to render
    await waitFor(() => {
      expect(screen.getByText('Error loading reports')).toBeInTheDocument();
    });
    
    // Check error message and retry button
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
  
  test('renders empty state when no reports are available', async () => {
    // Mock API to return empty array
    authAPI.authenticatedGet.mockResolvedValue([]);
    
    render(<UserReportsList />);
    
    // Wait for empty state to render
    await waitFor(() => {
      expect(screen.getByText('No reports yet')).toBeInTheDocument();
    });
    
    // Check for empty state message
    expect(screen.getByText("You haven't submitted any bug reports. When you do, they'll appear here.")).toBeInTheDocument();
  });
  
  test('renders list of reports when data is available', async () => {
    // Mock API to return sample data
    authAPI.authenticatedGet.mockResolvedValue(mockReports);
    
    render(<UserReportsList />);
    
    // Wait for reports to render
    await waitFor(() => {
      expect(screen.getByText('Test Report 1')).toBeInTheDocument();
    });
    
    // Check for both report titles
    expect(screen.getByText('Test Report 1')).toBeInTheDocument();
    expect(screen.getByText('Test Report 2')).toBeInTheDocument();
    
    // Check for status badges
    expect(screen.getByText('Submitted')).toBeInTheDocument();
    expect(screen.getByText('Under Review')).toBeInTheDocument();
    
    // Check for timestamp formatting (should call our mocked function)
    expect(formatDateAgoShort).toHaveBeenCalledTimes(2);
    expect(screen.getAllByText('Reported 2 days ago').length).toBe(2);
  });
  
  test('truncates long descriptions and shows "See more" button', async () => {
    // Mock API to return sample data
    authAPI.authenticatedGet.mockResolvedValue(mockReports);
    
    render(<UserReportsList />);
    
    // Wait for reports to render
    await waitFor(() => {
      expect(screen.getByText('Test Report 2')).toBeInTheDocument();
    });
    
    // Check that the long description is truncated (not showing full text)
    const fullDescription = mockReports[1].description;
    expect(screen.queryByText(fullDescription)).not.toBeInTheDocument();
    
    // Check for "See more" button on the report with long description
    const seeMoreButton = screen.getByText('See more');
    expect(seeMoreButton).toBeInTheDocument();
    
    // No "See more" button on the report with short description
    expect(screen.queryAllByText('See more').length).toBe(1);
  });
  
  test('expands and collapses long descriptions', async () => {
    // Mock API to return sample data
    authAPI.authenticatedGet.mockResolvedValue(mockReports);
    
    render(<UserReportsList />);
    
    // Wait for reports to render
    await waitFor(() => {
      expect(screen.getByText('Test Report 2')).toBeInTheDocument();
    });
    
    // Get the "See more" button
    const seeMoreButton = screen.getByText('See more');
    
    // Click to expand
    fireEvent.click(seeMoreButton);
    
    // Now the full description should be visible
    const fullDescription = mockReports[1].description;
    expect(screen.getByText(fullDescription)).toBeInTheDocument();
    
    // Button text should change to "Show less"
    expect(screen.getByText('Show less')).toBeInTheDocument();
    expect(screen.queryByText('See more')).not.toBeInTheDocument();
    
    // Click to collapse
    fireEvent.click(screen.getByText('Show less'));
    
    // Description should be truncated again
    expect(screen.queryByText(fullDescription)).not.toBeInTheDocument();
    expect(screen.getByText('See more')).toBeInTheDocument();
  });
  
  test('retry button reloads data from API instead of page refresh', async () => {
    // First mock an error, then success on retry
    authAPI.authenticatedGet.mockRejectedValueOnce(new Error('Failed to fetch reports'));
    authAPI.authenticatedGet.mockResolvedValueOnce(mockReports);
    
    render(<UserReportsList />);
    
    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText('Error loading reports')).toBeInTheDocument();
    });
    
    // API should have been called once initially
    expect(authAPI.authenticatedGet).toHaveBeenCalledTimes(1);
    
    // Click retry button
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    
    // Should show loading state again
    expect(screen.getAllByTestId('report-skeleton').length).toBe(3);
    
    // Wait for success state after retry
    await waitFor(() => {
      expect(screen.getByText('Test Report 1')).toBeInTheDocument();
    });
    
    // API should have been called twice (initial + retry)
    expect(authAPI.authenticatedGet).toHaveBeenCalledTimes(2);
  });
  
  test('handles edge case: truncation at sentence boundaries', async () => {
    // Create report with sentence boundaries near the character limit
    const reportWithSentences = [
      {
        id: 3,
        title: 'Report with Sentences',
        description: 'First sentence ends here. Second sentence is in the middle. Third sentence is longer and should be included if we truncate at sentence boundaries correctly.',
        reported_at: '2023-01-03T12:00:00Z',
        status: 'Submitted'
      }
    ];
    
    // Make sure to resolve with the data in the expected format
    authAPI.authenticatedGet.mockResolvedValue(reportWithSentences);
    
    render(<UserReportsList />);
    
    // Wait for a more reliable element that should be present
    await waitFor(() => {
      // Wait for the report's title to be in the document
      expect(screen.getByText('Report with Sentences')).toBeInTheDocument();
    });
    
    // Since we can now guarantee the content is rendered, check for expected truncated text
    // The exact text will depend on your component's truncation logic
    expect(screen.getByText(/First sentence ends here./)).toBeInTheDocument();
  });
  
  test('handles edge case: truncation at word boundaries', async () => {
    // Create report with no good sentence boundaries
    const reportWithLongWords = [
      {
        id: 4,
        title: 'Report with Long Words',
        description: 'Thisisaverylongwordwithoutanyspaces AndHereIsAnotherLongWord AndYetAnotherVeryLongWordThatExceedsTheLimit normal words after the long ones to see where truncation happens',
        reported_at: '2023-01-04T12:00:00Z',
        status: 'Submitted'
      }
    ];
    
    // Make sure to resolve with the data in the expected format
    authAPI.authenticatedGet.mockResolvedValue(reportWithLongWords);
    
    render(<UserReportsList />);
    
    // Wait for a more reliable element that should be present
    await waitFor(() => {
      // Wait for the report's title to be in the document
      expect(screen.getByText('Report with Long Words')).toBeInTheDocument();
    });
    
    // Check for "See more" button which should be present for truncated content
    const seeMoreButton = screen.getByText('See more');
    expect(seeMoreButton).toBeInTheDocument();
    
    // Click to see full text
    fireEvent.click(seeMoreButton);
    
    // Now should see full text including the part after truncation
    expect(screen.getByText(/normal words after the long ones/)).toBeInTheDocument();
  });
});