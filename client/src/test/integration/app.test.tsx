import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from '../../App'

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const renderApp = () => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  )
}

describe('App Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful API responses
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({})
    })
  })

  it('renders main navigation correctly', async () => {
    renderApp()
    
    await waitFor(() => {
      expect(screen.getByText(/tracker/i)).toBeInTheDocument()
      expect(screen.getByText(/profile/i)).toBeInTheDocument()
      expect(screen.getByText(/exercise/i)).toBeInTheDocument()
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
    })
  })

  it('displays Calonik.ai branding', async () => {
    renderApp()
    
    await waitFor(() => {
      expect(screen.getByText(/calonik\.ai/i)).toBeInTheDocument()
    })
  })

  it('handles navigation between tabs correctly', async () => {
    const user = userEvent.setup()
    renderApp()
    
    // Navigate to Profile tab
    const profileTab = screen.getByText(/profile/i)
    await user.click(profileTab)
    
    await waitFor(() => {
      expect(screen.getByLabelText(/age/i)).toBeInTheDocument()
    })
    
    // Navigate to Exercise tab
    const exerciseTab = screen.getByText(/exercise/i)
    await user.click(exerciseTab)
    
    await waitFor(() => {
      expect(screen.getByText(/running/i)).toBeInTheDocument()
    })
  })

  it('displays authentication state correctly', async () => {
    // Mock authenticated user
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        id: 'test-user',
        email: 'test@example.com',
        name: 'Test User'
      })
    })
    
    renderApp()
    
    await waitFor(() => {
      expect(screen.getByText(/welcome/i)).toBeInTheDocument()
    })
  })

  it('shows premium features for premium users', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        isPremium: true,
        limits: { photos: 5, meals: 20 },
        remaining: { photos: 5, meals: 20 }
      })
    })
    
    renderApp()
    
    await waitFor(() => {
      expect(screen.getByText(/premium/i)).toBeInTheDocument()
    })
  })
})

describe('Workflow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('completes full meal tracking workflow', async () => {
    // Mock successful responses for the workflow
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { id: 1, name: 'Rice', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 }
        ])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 })
      })
    
    const user = userEvent.setup()
    renderApp()
    
    // Search for food
    const searchInput = screen.getByPlaceholderText(/search for any food/i)
    await user.type(searchInput, 'rice')
    
    await waitFor(() => {
      expect(screen.getByText('Rice')).toBeInTheDocument()
    })
    
    // Select food and add to meal
    const riceItem = screen.getByText('Rice')
    await user.click(riceItem)
    
    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: /add to meal/i })
      expect(addButton).toBeInTheDocument()
      return user.click(addButton)
    })
    
    await waitFor(() => {
      expect(screen.getByText(/current meal/i)).toBeInTheDocument()
    })
  })

  it('completes profile setup and calculation workflow', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        id: 1,
        bmr: 1680,
        tdee: 2352,
        targetCalories: 1852
      })
    })
    
    const user = userEvent.setup()
    renderApp()
    
    // Navigate to profile
    const profileTab = screen.getByText(/profile/i)
    await user.click(profileTab)
    
    // Fill profile form
    await user.type(screen.getByLabelText(/age/i), '25')
    await user.type(screen.getByLabelText(/height/i), '5.6')
    await user.type(screen.getByLabelText(/weight/i), '70')
    
    // Calculate profile
    const calculateButton = screen.getByRole('button', { name: /calculate/i })
    await user.click(calculateButton)
    
    await waitFor(() => {
      expect(screen.getByText(/bmr/i)).toBeInTheDocument()
      expect(screen.getByText(/tdee/i)).toBeInTheDocument()
    })
  })

  it('completes exercise tracking workflow', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1 })
    })
    
    const user = userEvent.setup()
    renderApp()
    
    // Navigate to exercise
    const exerciseTab = screen.getByText(/exercise/i)
    await user.click(exerciseTab)
    
    // Select exercise type
    const runningButton = screen.getByText(/running/i)
    await user.click(runningButton)
    
    // Set duration
    const manualTimeInput = screen.getByLabelText(/manual time/i)
    await user.type(manualTimeInput, '30')
    
    // Log exercise
    const logButton = screen.getByRole('button', { name: /log exercise/i })
    await user.click(logButton)
    
    await waitFor(() => {
      expect(screen.getByText(/exercise logged/i)).toBeInTheDocument()
    })
  })
})

describe('Error Handling Integration Tests', () => {
  it('handles API failures gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
    
    renderApp()
    
    await waitFor(() => {
      // App should still render basic structure
      expect(screen.getByText(/calonik\.ai/i)).toBeInTheDocument()
    })
  })

  it('shows proper error states for failed operations', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Server error' })
    })
    
    const user = userEvent.setup()
    renderApp()
    
    const searchInput = screen.getByPlaceholderText(/search for any food/i)
    await user.type(searchInput, 'test')
    
    await waitFor(() => {
      expect(screen.getByText(/error searching foods/i)).toBeInTheDocument()
    })
  })

  it('handles authentication errors correctly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Unauthorized' })
    })
    
    renderApp()
    
    await waitFor(() => {
      expect(screen.getByText(/get started/i)).toBeInTheDocument()
    })
  })
})

describe('Responsive Design Tests', () => {
  it('adapts to mobile viewport', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })
    
    renderApp()
    
    // Check that navigation is still accessible
    expect(screen.getByText(/tracker/i)).toBeInTheDocument()
  })

  it('handles tablet viewport correctly', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    })
    
    renderApp()
    
    expect(screen.getByText(/calonik\.ai/i)).toBeInTheDocument()
  })
})

describe('Performance Tests', () => {
  it('renders initial page quickly', async () => {
    const startTime = performance.now()
    
    renderApp()
    
    await waitFor(() => {
      expect(screen.getByText(/calonik\.ai/i)).toBeInTheDocument()
    })
    
    const endTime = performance.now()
    const renderTime = endTime - startTime
    
    // Should render within reasonable time (adjust threshold as needed)
    expect(renderTime).toBeLessThan(1000) // 1 second
  })

  it('handles large data sets efficiently', async () => {
    // Mock large food database response
    const largeFoodList = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Food ${i}`,
      calories: 100 + i,
      protein: 5,
      carbs: 20,
      fat: 2
    }))
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(largeFoodList)
    })
    
    const user = userEvent.setup()
    renderApp()
    
    const searchInput = screen.getByPlaceholderText(/search for any food/i)
    await user.type(searchInput, 'food')
    
    await waitFor(() => {
      // Should handle large response without crashing
      expect(screen.getByText(/food 1/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})