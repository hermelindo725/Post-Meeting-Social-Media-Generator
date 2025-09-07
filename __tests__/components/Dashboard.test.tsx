import { render, screen, waitFor } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import Dashboard from '@/components/Dashboard'

// Mock NextAuth
const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    image: 'https://example.com/avatar.jpg',
  },
  expires: '2024-12-31T23:59:59.999Z',
}

// Mock useSession hook
jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: mockSession, status: 'authenticated' }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock child components
jest.mock('@/components/UpcomingMeetings', () => {
  return function MockUpcomingMeetings() {
    return <div data-testid="upcoming-meetings">Upcoming Meetings</div>
  }
})

jest.mock('@/components/PastMeetings', () => {
  return function MockPastMeetings() {
    return <div data-testid="past-meetings">Past Meetings</div>
  }
})

jest.mock('@/components/SettingsPage', () => {
  return function MockSettingsPage() {
    return <div data-testid="settings-page">Settings</div>
  }
})

describe('Dashboard Component', () => {
  it('renders dashboard with user information', () => {
    render(
      <SessionProvider session={mockSession}>
        <Dashboard />
      </SessionProvider>
    )

    expect(screen.getByText('Post-Meeting Social Media Generator')).toBeInTheDocument()
    expect(screen.getByText('Welcome back, Test User')).toBeInTheDocument()
    expect(screen.getByAltText('Test User')).toBeInTheDocument()
  })

  it('renders navigation tabs', () => {
    render(
      <SessionProvider session={mockSession}>
        <Dashboard />
      </SessionProvider>
    )

    expect(screen.getByText('Upcoming Meetings')).toBeInTheDocument()
    expect(screen.getByText('Past Meetings')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('shows upcoming meetings by default', () => {
    render(
      <SessionProvider session={mockSession}>
        <Dashboard />
      </SessionProvider>
    )

    expect(screen.getByTestId('upcoming-meetings')).toBeInTheDocument()
  })

  it('switches between tabs when clicked', async () => {
    render(
      <SessionProvider session={mockSession}>
        <Dashboard />
      </SessionProvider>
    )

    // Click on Past Meetings tab
    const pastMeetingsTab = screen.getByText('Past Meetings')
    pastMeetingsTab.click()

    await waitFor(() => {
      expect(screen.getByTestId('past-meetings')).toBeInTheDocument()
    })

    // Click on Settings tab
    const settingsTab = screen.getByText('Settings')
    settingsTab.click()

    await waitFor(() => {
      expect(screen.getByTestId('settings-page')).toBeInTheDocument()
    })
  })

  it('handles missing user image gracefully', () => {
    const sessionWithoutImage = {
      ...mockSession,
      user: {
        ...mockSession.user,
        image: null,
      },
    }

    render(
      <SessionProvider session={sessionWithoutImage}>
        <Dashboard />
      </SessionProvider>
    )

    // Should still render the dashboard without crashing
    expect(screen.getByText('Post-Meeting Social Media Generator')).toBeInTheDocument()
  })

  it('handles missing user name gracefully', () => {
    const sessionWithoutName = {
      ...mockSession,
      user: {
        ...mockSession.user,
        name: null,
      },
    }

    render(
      <SessionProvider session={sessionWithoutName}>
        <Dashboard />
      </SessionProvider>
    )

    // Should still render the dashboard without crashing
    expect(screen.getByText('Post-Meeting Social Media Generator')).toBeInTheDocument()
  })
})
