import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import MealSummary from '../../components/MealSummary'

const mockMealItems = [
  {
    id: 1,
    foodId: 1,
    quantity: 2,
    unit: 'medium portion',
    calories: 260,
    protein: 5.4,
    carbs: 56,
    fat: 0.6,
    food: { id: 1, name: 'Rice', category: 'grains' }
  },
  {
    id: 2,
    foodId: 2,
    quantity: 1,
    unit: 'bowl',
    calories: 116,
    protein: 9,
    carbs: 20,
    fat: 0.4,
    food: { id: 2, name: 'Dal', category: 'legumes' }
  }
]

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

describe('MealSummary Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMealItems)
    })
  })

  it('displays current meal items correctly', async () => {
    renderWithProvider(<MealSummary sessionId="test-session" selectedDate="2025-06-28" />)
    
    await waitFor(() => {
      expect(screen.getByText('Rice')).toBeInTheDocument()
      expect(screen.getByText('Dal')).toBeInTheDocument()
      expect(screen.getByText('2 medium portion')).toBeInTheDocument()
      expect(screen.getByText('1 bowl')).toBeInTheDocument()
    })
  })

  it('calculates total nutrition correctly', async () => {
    renderWithProvider(<MealSummary sessionId="test-session" selectedDate="2025-06-28" />)
    
    await waitFor(() => {
      expect(screen.getByText(/376 calories/i)).toBeInTheDocument() // 260 + 116
      expect(screen.getByText(/14.4.*protein/i)).toBeInTheDocument() // 5.4 + 9
      expect(screen.getByText(/76.*carbs/i)).toBeInTheDocument() // 56 + 20
      expect(screen.getByText(/1.*fat/i)).toBeInTheDocument() // 0.6 + 0.4
    })
  })

  it('shows remove buttons for each meal item', async () => {
    renderWithProvider(<MealSummary sessionId="test-session" selectedDate="2025-06-28" />)
    
    await waitFor(() => {
      const removeButtons = screen.getAllByRole('button', { name: /remove/i })
      expect(removeButtons).toHaveLength(2)
    })
  })

  it('handles meal item removal correctly', async () => {
    const mockApiRequest = vi.fn().mockResolvedValue({})
    vi.mocked(require('@/lib/queryClient').apiRequest).mockImplementation(mockApiRequest)
    
    const user = userEvent.setup()
    renderWithProvider(<MealSummary sessionId="test-session" selectedDate="2025-06-28" />)
    
    await waitFor(() => {
      expect(screen.getByText('Rice')).toBeInTheDocument()
    })
    
    const removeButtons = screen.getAllByRole('button', { name: /remove/i })
    await user.click(removeButtons[0])
    
    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith('DELETE', '/api/meal/1')
    })
  })

  it('displays submit meal button when items exist', async () => {
    renderWithProvider(<MealSummary sessionId="test-session" selectedDate="2025-06-28" />)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /submit meal/i })).toBeInTheDocument()
    })
  })

  it('shows clear all button when items exist', async () => {
    renderWithProvider(<MealSummary sessionId="test-session" selectedDate="2025-06-28" />)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument()
    })
  })

  it('handles clear all functionality', async () => {
    const mockApiRequest = vi.fn().mockResolvedValue({})
    vi.mocked(require('@/lib/queryClient').apiRequest).mockImplementation(mockApiRequest)
    
    const user = userEvent.setup()
    renderWithProvider(<MealSummary sessionId="test-session" selectedDate="2025-06-28" />)
    
    await waitFor(() => {
      expect(screen.getByText('Rice')).toBeInTheDocument()
    })
    
    const clearButton = screen.getByRole('button', { name: /clear all/i })
    await user.click(clearButton)
    
    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith('DELETE', '/api/meal/clear/test-session/2025-06-28')
    })
  })

  it('submits meal to daily summary correctly', async () => {
    const mockApiRequest = vi.fn().mockResolvedValue({})
    vi.mocked(require('@/lib/queryClient').apiRequest).mockImplementation(mockApiRequest)
    
    const user = userEvent.setup()
    renderWithProvider(<MealSummary sessionId="test-session" selectedDate="2025-06-28" />)
    
    await waitFor(() => {
      expect(screen.getByText('Rice')).toBeInTheDocument()
    })
    
    const submitButton = screen.getByRole('button', { name: /submit meal/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith('POST', '/api/daily-summary', expect.objectContaining({
        sessionId: 'test-session',
        date: '2025-06-28',
        totalCalories: 376,
        totalProtein: 14.4,
        totalCarbs: 76,
        totalFat: 1
      }))
    })
  })

  it('shows empty state when no meal items', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    })
    
    renderWithProvider(<MealSummary sessionId="test-session" selectedDate="2025-06-28" />)
    
    await waitFor(() => {
      expect(screen.getByText(/no foods added yet/i)).toBeInTheDocument()
    })
  })

  it('displays loading state correctly', () => {
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {})) // Never resolves
    
    renderWithProvider(<MealSummary sessionId="test-session" selectedDate="2025-06-28" />)
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('handles API errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('API Error'))
    
    renderWithProvider(<MealSummary sessionId="test-session" selectedDate="2025-06-28" />)
    
    await waitFor(() => {
      expect(screen.getByText(/error loading meals/i)).toBeInTheDocument()
    })
  })

  it('formats nutrition values correctly', async () => {
    renderWithProvider(<MealSummary sessionId="test-session" selectedDate="2025-06-28" />)
    
    await waitFor(() => {
      // Check decimal formatting
      expect(screen.getByText(/14\.4g protein/i)).toBeInTheDocument()
      expect(screen.getByText(/1\.0g fat/i)).toBeInTheDocument()
    })
  })
})