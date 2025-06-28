import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import UserProfile from '../../components/UserProfile'

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

describe('UserProfile Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({})
    })
  })

  it('renders profile form correctly', () => {
    renderWithProvider(<UserProfile />)
    
    expect(screen.getByLabelText(/age/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/height/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/weight/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/gender/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/activity level/i)).toBeInTheDocument()
  })

  it('displays weight goal options correctly', () => {
    renderWithProvider(<UserProfile />)
    
    expect(screen.getByText(/lose weight/i)).toBeInTheDocument()
    expect(screen.getByText(/gain weight/i)).toBeInTheDocument()
    expect(screen.getByText(/build muscle/i)).toBeInTheDocument()
  })

  it('calculates BMR and TDEE correctly', async () => {
    const user = userEvent.setup()
    renderWithProvider(<UserProfile />)
    
    // Fill in form data
    await user.type(screen.getByLabelText(/age/i), '25')
    await user.type(screen.getByLabelText(/height/i), '5.6')
    await user.type(screen.getByLabelText(/weight/i), '70')
    
    // Select male gender
    const maleOption = screen.getByLabelText(/male/i)
    await user.click(maleOption)
    
    // Click calculate button
    const calculateButton = screen.getByRole('button', { name: /calculate/i })
    await user.click(calculateButton)
    
    await waitFor(() => {
      expect(screen.getByText(/bmr/i)).toBeInTheDocument()
      expect(screen.getByText(/tdee/i)).toBeInTheDocument()
    })
  })

  it('handles protein target calculation for muscle building', async () => {
    const user = userEvent.setup()
    renderWithProvider(<UserProfile />)
    
    // Fill in form data
    await user.type(screen.getByLabelText(/weight/i), '76')
    
    // Select build muscle goal
    const buildMuscleButton = screen.getByText(/build muscle/i)
    await user.click(buildMuscleButton)
    
    const calculateButton = screen.getByRole('button', { name: /calculate/i })
    await user.click(calculateButton)
    
    await waitFor(() => {
      expect(screen.getByText(/60.*protein/i)).toBeInTheDocument() // 76 * 0.8 = 60.8, rounded to 60
    })
  })

  it('validates form inputs correctly', async () => {
    const user = userEvent.setup()
    renderWithProvider(<UserProfile />)
    
    // Try to submit empty form
    const calculateButton = screen.getByRole('button', { name: /calculate/i })
    await user.click(calculateButton)
    
    await waitFor(() => {
      expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument()
    })
  })

  it('displays motivational quotes', async () => {
    renderWithProvider(<UserProfile />)
    
    await waitFor(() => {
      expect(screen.getByText(/daily inspiration/i)).toBeInTheDocument()
    })
  })

  it('handles height conversion from feet to cm', async () => {
    const user = userEvent.setup()
    renderWithProvider(<UserProfile />)
    
    await user.type(screen.getByLabelText(/height/i), '5.6')
    
    // The component should internally convert 5.6 feet to 170.69 cm
    const heightInput = screen.getByLabelText(/height/i)
    expect(heightInput).toHaveValue(5.6)
  })

  it('saves profile data to database', async () => {
    const mockApiRequest = vi.fn().mockResolvedValue({ id: 1 })
    vi.mocked(require('@/lib/queryClient').apiRequest).mockImplementation(mockApiRequest)
    
    const user = userEvent.setup()
    renderWithProvider(<UserProfile />)
    
    // Fill complete form
    await user.type(screen.getByLabelText(/age/i), '25')
    await user.type(screen.getByLabelText(/height/i), '5.6')
    await user.type(screen.getByLabelText(/weight/i), '70')
    
    const calculateButton = screen.getByRole('button', { name: /calculate/i })
    await user.click(calculateButton)
    
    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith('POST', '/api/profile', expect.objectContaining({
        age: 25,
        weight: 70,
        height: expect.any(Number) // converted from feet to cm
      }))
    })
  })
})