import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Dashboard from '../../components/Dashboard'

const mockDashboardData = {
  dailySummary: {
    totalCalories: 1800,
    totalProtein: 80,
    totalCarbs: 200,
    totalFat: 60,
    caloriesFromExercise: 300,
    netCalories: 1500
  },
  userProfile: {
    targetCalories: 2000,
    dailyProteinTarget: 100,
    weightGoal: 'lose'
  },
  dailyWeight: {
    weight: 75.5,
    date: '2025-06-28'
  },
  exercises: [
    { id: 1, type: 'running', duration: 30, caloriesBurned: 300, exerciseName: 'Running' }
  ]
}

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const renderWithProvider = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockDashboardData)
    })
  })

  it('renders calorie goal progress correctly', async () => {
    renderWithProvider(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/calorie goal progress/i)).toBeInTheDocument()
      expect(screen.getByText(/1800.*2000/)).toBeInTheDocument() // calories consumed vs target
    })
  })

  it('displays nutrition summary cards correctly', async () => {
    renderWithProvider(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/calories in/i)).toBeInTheDocument()
      expect(screen.getByText(/calories out/i)).toBeInTheDocument()
      expect(screen.getByText(/net calories/i)).toBeInTheDocument()
      expect(screen.getByText(/today's weight/i)).toBeInTheDocument()
    })
  })

  it('shows protein progress for muscle building users', async () => {
    const muscleProfile = {
      ...mockDashboardData.userProfile,
      weightGoal: 'build muscle',
      dailyProteinTarget: 120
    }
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        ...mockDashboardData,
        userProfile: muscleProfile
      })
    })
    
    renderWithProvider(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/protein progress/i)).toBeInTheDocument()
      expect(screen.getByText(/80.*120/)).toBeInTheDocument() // protein consumed vs target
    })
  })

  it('displays weight goal status correctly', async () => {
    renderWithProvider(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/weight goal/i)).toBeInTheDocument()
      expect(screen.getByText(/lose weight/i)).toBeInTheDocument()
    })
  })

  it('shows calorie vs weight correlation chart', async () => {
    renderWithProvider(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/daily calories vs weight/i)).toBeInTheDocument()
    })
  })

  it('displays completed exercises section', async () => {
    renderWithProvider(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/today's exercises/i)).toBeInTheDocument()
      expect(screen.getByText(/running.*30 min/i)).toBeInTheDocument()
    })
  })

  it('handles missing profile data gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        ...mockDashboardData,
        userProfile: null
      })
    })
    
    renderWithProvider(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/complete your profile/i)).toBeInTheDocument()
    })
  })

  it('calculates net calories correctly', async () => {
    renderWithProvider(<Dashboard />)
    
    await waitFor(() => {
      // Net calories = calories in (1800) - calories out (300) = 1500
      expect(screen.getByText(/1500/)).toBeInTheDocument()
    })
  })

  it('shows calendar date selection', async () => {
    renderWithProvider(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /calendar/i })).toBeInTheDocument()
    })
  })

  it('displays motivational AI insights', async () => {
    renderWithProvider(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/ai insights/i)).toBeInTheDocument()
    })
  })

  it('handles calorie deficit/surplus indicators', async () => {
    renderWithProvider(<Dashboard />)
    
    await waitFor(() => {
      // Should show deficit indicator since net calories (1500) < target (2000)
      expect(screen.getByText(/calorie deficit/i)).toBeInTheDocument()
    })
  })

  it('displays today vs selected date labels correctly', async () => {
    renderWithProvider(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/today's/i)).toBeInTheDocument()
    })
  })
})