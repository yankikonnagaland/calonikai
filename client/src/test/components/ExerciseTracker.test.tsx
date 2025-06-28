import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ExerciseTracker from '../../components/ExerciseTracker'

const mockExercises = [
  { id: 1, type: 'running', exerciseName: 'Running', duration: 30, caloriesBurned: 300, date: '2025-06-28' },
  { id: 2, type: 'cycling', exerciseName: 'Cycling', duration: 45, caloriesBurned: 450, date: '2025-06-28' },
]

const testProps = {
  selectedDate: "2025-06-28",
  sessionId: "test-session"
}

vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn()
}))

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

describe('ExerciseTracker Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockExercises)
    })
  })

  it('renders exercise selection grid correctly', () => {
    renderWithProvider(<ExerciseTracker {...testProps} />)
    
    expect(screen.getByText('Running')).toBeInTheDocument()
    expect(screen.getByText('Cycling')).toBeInTheDocument()
    expect(screen.getByText('Swimming')).toBeInTheDocument()
    expect(screen.getByText('Walking')).toBeInTheDocument()
    expect(screen.getByText('Strength Training')).toBeInTheDocument()
  })

  it('shows time tracking options when exercise is selected', async () => {
    const user = userEvent.setup()
    renderWithProvider(<ExerciseTracker selectedDate="2025-06-28" />)
    
    const runningButton = screen.getByText('Running')
    await user.click(runningButton)
    
    await waitFor(() => {
      expect(screen.getByText('Time Tracking')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/manual time/i)).toBeInTheDocument()
    })
  })

  it('displays enhanced tracker toggle for cardio exercises', async () => {
    const user = userEvent.setup()
    renderWithProvider(<ExerciseTracker selectedDate="2025-06-28" />)
    
    const runningButton = screen.getByText('Running')
    await user.click(runningButton)
    
    await waitFor(() => {
      expect(screen.getByText(/enhanced running tracker/i)).toBeInTheDocument()
      expect(screen.getByRole('switch')).toBeInTheDocument()
    })
  })

  it('shows enhanced fields when toggle is enabled', async () => {
    const user = userEvent.setup()
    renderWithProvider(<ExerciseTracker selectedDate="2025-06-28" />)
    
    const runningButton = screen.getByText('Running')
    await user.click(runningButton)
    
    const toggle = screen.getByRole('switch')
    await user.click(toggle)
    
    await waitFor(() => {
      expect(screen.getByLabelText(/distance \(km\)/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/intensity level/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/heart rate/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/terrain/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/smartwatch/i)).toBeInTheDocument()
    })
  })

  it('calculates calories correctly based on duration and intensity', async () => {
    const user = userEvent.setup()
    renderWithProvider(<ExerciseTracker selectedDate="2025-06-28" />)
    
    const runningButton = screen.getByText('Running')
    await user.click(runningButton)
    
    const manualTimeInput = screen.getByLabelText(/manual time/i)
    await user.clear(manualTimeInput)
    await user.type(manualTimeInput, '30')
    
    await waitFor(() => {
      expect(screen.getByText(/300 calories/i)).toBeInTheDocument()
    })
  })

  it('handles intensity level changes correctly', async () => {
    const user = userEvent.setup()
    renderWithProvider(<ExerciseTracker selectedDate="2025-06-28" />)
    
    const runningButton = screen.getByText('Running')
    await user.click(runningButton)
    
    const highIntensityButton = screen.getByText(/high/i)
    await user.click(highIntensityButton)
    
    const manualTimeInput = screen.getByLabelText(/manual time/i)
    await user.clear(manualTimeInput)
    await user.type(manualTimeInput, '30')
    
    await waitFor(() => {
      expect(screen.getByText(/390 calories/i)).toBeInTheDocument() // 300 * 1.3
    })
  })

  it('starts and stops timer correctly', async () => {
    const user = userEvent.setup()
    renderWithProvider(<ExerciseTracker selectedDate="2025-06-28" />)
    
    const runningButton = screen.getByText('Running')
    await user.click(runningButton)
    
    const startButton = screen.getByRole('button', { name: /start/i })
    await user.click(startButton)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument()
      expect(screen.getByText(/00:00/)).toBeInTheDocument()
    })
  })

  it('submits exercise data correctly', async () => {
    const mockApiRequest = vi.fn().mockResolvedValue({ id: 1 })
    vi.mocked(require('@/lib/queryClient').apiRequest).mockImplementation(mockApiRequest)
    
    const user = userEvent.setup()
    renderWithProvider(<ExerciseTracker selectedDate="2025-06-28" />)
    
    const runningButton = screen.getByText('Running')
    await user.click(runningButton)
    
    const manualTimeInput = screen.getByLabelText(/manual time/i)
    await user.type(manualTimeInput, '30')
    
    const submitButton = screen.getByRole('button', { name: /log exercise/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith('POST', '/api/exercise', expect.objectContaining({
        type: 'running',
        exerciseName: 'Running',
        duration: 30,
        caloriesBurned: 300
      }))
    })
  })

  it('displays completed exercises list', async () => {
    renderWithProvider(<ExerciseTracker selectedDate="2025-06-28" />)
    
    await waitFor(() => {
      expect(screen.getByText(/today's completed exercises/i)).toBeInTheDocument()
      expect(screen.getByText('Running - 30 min')).toBeInTheDocument()
      expect(screen.getByText('Cycling - 45 min')).toBeInTheDocument()
    })
  })

  it('validates enhanced tracker fields correctly', async () => {
    const user = userEvent.setup()
    renderWithProvider(<ExerciseTracker selectedDate="2025-06-28" />)
    
    const runningButton = screen.getByText('Running')
    await user.click(runningButton)
    
    const toggle = screen.getByRole('switch')
    await user.click(toggle)
    
    const distanceInput = screen.getByLabelText(/distance \(km\)/i)
    await user.type(distanceInput, '5.5')
    
    const heartRateInput = screen.getByLabelText(/heart rate/i)
    await user.type(heartRateInput, '150')
    
    await waitFor(() => {
      expect(distanceInput).toHaveValue(5.5)
      expect(heartRateInput).toHaveValue(150)
    })
  })

  it('handles exercise removal correctly', async () => {
    const mockApiRequest = vi.fn().mockResolvedValue({})
    vi.mocked(require('@/lib/queryClient').apiRequest).mockImplementation(mockApiRequest)
    
    const user = userEvent.setup()
    renderWithProvider(<ExerciseTracker selectedDate="2025-06-28" />)
    
    await waitFor(() => {
      expect(screen.getByText('Running - 30 min')).toBeInTheDocument()
    })
    
    const removeButton = screen.getAllByRole('button', { name: /remove/i })[0]
    await user.click(removeButton)
    
    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith('DELETE', '/api/exercise/1')
    })
  })
})