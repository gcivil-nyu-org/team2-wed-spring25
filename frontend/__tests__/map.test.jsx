import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Dashboard from '@/app/users/map/page'
import { useAuth } from '@/app/custom-components/AuthHook'
import { useNotification } from '@/app/custom-components/ToastComponent/NotificationContext'

// Mock the hooks and dynamic imports
jest.mock('@/app/custom-components/AuthHook')
jest.mock('@/app/custom-components/ToastComponent/NotificationContext')
jest.mock('next/dynamic', () => () => {
  const DynamicComponent = () => <div data-testid="mock-map">Map Component</div>
  return DynamicComponent
})

// Mock environment variable
process.env.NEXT_PUBLIC_MAPBOX_API_KEY = 'test-token'

describe('Dashboard Map Component', () => {
  // Setup common mocks
  const mockShowError = jest.fn()
  const mockShowWarning = jest.fn()
  const mockShowSuccess = jest.fn()
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()
    
    // Mock auth hook
    useAuth.mockReturnValue({
      user: { email: 'test@example.com' },
      logout: jest.fn()
    })
    
    // Mock notification hook
    useNotification.mockReturnValue({
      showError: mockShowError,
      showWarning: mockShowWarning,
      showSuccess: mockShowSuccess
    })
  })

  test('renders dashboard with user information', () => {
    render(<Dashboard />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Logged in as: test@example.com')).toBeInTheDocument()
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  test('renders route planner section', () => {
    render(<Dashboard />)
    
    expect(screen.getByText('Route Planner')).toBeInTheDocument()
    expect(screen.getByText('How to Use This Map')).toBeInTheDocument()
  })

  test('displays map component when mapbox token is available', () => {
    render(<Dashboard />)
    
    expect(screen.getByTestId('mock-map')).toBeInTheDocument()
  })

  test('shows error when mapbox token is missing', () => {
    // Temporarily remove the token
    const originalToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY
    delete process.env.NEXT_PUBLIC_MAPBOX_API_KEY
    
    render(<Dashboard />)
    
    expect(mockShowError).toHaveBeenCalledWith(
      'Configuration error',
      'Missing Mapbox API key. Please set NEXT_PUBLIC_MAPBOX_API_KEY in your .env.local file.',
      'api_key_missing'
    )

    // Restore the token
    process.env.NEXT_PUBLIC_MAPBOX_API_KEY = originalToken
  })

  test('handles search form submission with missing departure location', async () => {
    render(<Dashboard />)
    
    // Simulate form submission with missing departure
    const handleSearch = screen.getByRole('button', { name: /get directions/i })
    fireEvent.click(handleSearch)
    
    expect(mockShowWarning).toHaveBeenCalledWith(
      'Departure location required',
      'Please select a departure location from the suggestions',
      'location_validation_error'
    )
  })

  test('handles successful route planning', async () => {
    render(<Dashboard />)
    
    // Mock successful search submission
    const searchData = {
      departure: 'Start Location',
      departureCoordinates: [0, 0],
      destination: 'End Location',
      destinationCoordinates: [1, 1],
      useCurrentLocation: false
    }
    
    // Find and trigger the search form submission
    const form = screen.getByTestId('location-search-form')
    fireEvent.submit(form, { searchData })
    
    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith(
        'Route planning started',
        'Planning route from Start Location to End Location',
        'route_planning'
      )
    })
  })

  test('handles use current location option', async () => {
    render(<Dashboard />)
    
    const searchData = {
      destination: 'End Location',
      destinationCoordinates: [1, 1],
      useCurrentLocation: true
    }
    
    const form = screen.getByTestId('location-search-form')
    fireEvent.submit(form, { searchData })
    
    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith(
        'Route planning started',
        expect.stringContaining('your current location'),
        'route_planning'
      )
    })
  })
}) 