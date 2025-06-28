import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import FoodSearch from '../../components/FoodSearch'

// Mock the API
const mockFoods = [
  { id: 1, name: 'Rice', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, category: 'grains' },
  { id: 2, name: 'Dal', calories: 116, protein: 9, carbs: 20, fat: 0.4, category: 'legumes' },
]

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

describe('FoodSearch Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockFoods)
    })
  })

  it('renders search input correctly', () => {
    renderWithProvider(<FoodSearch selectedDate="2025-06-28" />)
    
    expect(screen.getByPlaceholderText(/search for any food/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
  })

  it('shows loading state during search', async () => {
    const user = userEvent.setup()
    renderWithProvider(<FoodSearch selectedDate="2025-06-28" />)
    
    const searchInput = screen.getByPlaceholderText(/search for any food/i)
    await user.type(searchInput, 'rice')
    
    await waitFor(() => {
      expect(screen.getByText(/searching/i)).toBeInTheDocument()
    })
  })

  it('displays search results correctly', async () => {
    const user = userEvent.setup()
    renderWithProvider(<FoodSearch selectedDate="2025-06-28" />)
    
    const searchInput = screen.getByPlaceholderText(/search for any food/i)
    await user.type(searchInput, 'rice')
    
    await waitFor(() => {
      expect(screen.getByText('Rice')).toBeInTheDocument()
      expect(screen.getByText(/130 cal/)).toBeInTheDocument()
    })
  })

  it('handles unit selection and quantity input', async () => {
    const user = userEvent.setup()
    renderWithProvider(<FoodSearch selectedDate="2025-06-28" />)
    
    const searchInput = screen.getByPlaceholderText(/search for any food/i)
    await user.type(searchInput, 'rice')
    
    await waitFor(() => {
      expect(screen.getByText('Rice')).toBeInTheDocument()
    })

    // Click on the food item to select it
    const riceItem = screen.getByText('Rice')
    await user.click(riceItem)
    
    // Check if unit and quantity inputs appear
    await waitFor(() => {
      expect(screen.getByDisplayValue('1')).toBeInTheDocument() // quantity
      expect(screen.getByDisplayValue(/medium portion/i)).toBeInTheDocument() // unit
    })
  })

  it('validates quantity input correctly', async () => {
    const user = userEvent.setup()
    renderWithProvider(<FoodSearch selectedDate="2025-06-28" />)
    
    const searchInput = screen.getByPlaceholderText(/search for any food/i)
    await user.type(searchInput, 'rice')
    
    await waitFor(() => {
      expect(screen.getByText('Rice')).toBeInTheDocument()
    })

    const riceItem = screen.getByText('Rice')
    await user.click(riceItem)
    
    await waitFor(() => {
      const quantityInput = screen.getByDisplayValue('1')
      expect(quantityInput).toBeInTheDocument()
    })
  })

  it('shows add to meal button when food is selected', async () => {
    const user = userEvent.setup()
    renderWithProvider(<FoodSearch selectedDate="2025-06-28" />)
    
    const searchInput = screen.getByPlaceholderText(/search for any food/i)
    await user.type(searchInput, 'rice')
    
    await waitFor(() => {
      expect(screen.getByText('Rice')).toBeInTheDocument()
    })

    const riceItem = screen.getByText('Rice')
    await user.click(riceItem)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add to meal/i })).toBeInTheDocument()
    })
  })

  it('handles empty search results', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    })

    const user = userEvent.setup()
    renderWithProvider(<FoodSearch selectedDate="2025-06-28" />)
    
    const searchInput = screen.getByPlaceholderText(/search for any food/i)
    await user.type(searchInput, 'nonexistent')
    
    await waitFor(() => {
      expect(screen.getByText(/no foods found/i)).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('API Error'))

    const user = userEvent.setup()
    renderWithProvider(<FoodSearch selectedDate="2025-06-28" />)
    
    const searchInput = screen.getByPlaceholderText(/search for any food/i)
    await user.type(searchInput, 'rice')
    
    await waitFor(() => {
      expect(screen.getByText(/error searching foods/i)).toBeInTheDocument()
    })
  })
})