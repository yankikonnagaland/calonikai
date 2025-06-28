import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import FoodCamera from '../../components/FoodCamera'

const mockUsageStats = {
  isPremium: true,
  limits: { photos: 5, meals: 20 },
  remaining: { photos: 3, meals: 20 },
  photos: 2
}

const mockFoodAnalysis = {
  foods: [
    {
      name: 'Apple',
      calories: 95,
      protein: 0.5,
      carbs: 25,
      fat: 0.3,
      confidence: 0.95,
      portion: '1 medium apple'
    }
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

// Mock getUserMedia
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
      getVideoTracks: () => [{ stop: vi.fn() }]
    })
  }
})

describe('FoodCamera Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUsageStats)
    })
  })

  it('renders camera controls correctly', async () => {
    renderWithProvider(<FoodCamera selectedDate="2025-06-28" />)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /open camera/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /upload photo/i })).toBeInTheDocument()
    })
  })

  it('displays usage stats correctly', async () => {
    renderWithProvider(<FoodCamera selectedDate="2025-06-28" />)
    
    await waitFor(() => {
      expect(screen.getByText(/3.*remaining/i)).toBeInTheDocument()
      expect(screen.getByText(/5.*daily limit/i)).toBeInTheDocument()
    })
  })

  it('shows premium badge for premium users', async () => {
    renderWithProvider(<FoodCamera selectedDate="2025-06-28" />)
    
    await waitFor(() => {
      expect(screen.getByText(/premium/i)).toBeInTheDocument()
    })
  })

  it('handles camera initialization correctly', async () => {
    const user = userEvent.setup()
    renderWithProvider(<FoodCamera selectedDate="2025-06-28" />)
    
    const cameraButton = screen.getByRole('button', { name: /open camera/i })
    await user.click(cameraButton)
    
    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: { facingMode: 'environment' }
      })
    })
  })

  it('displays capture button when camera is active', async () => {
    const user = userEvent.setup()
    renderWithProvider(<FoodCamera selectedDate="2025-06-28" />)
    
    const cameraButton = screen.getByRole('button', { name: /open camera/i })
    await user.click(cameraButton)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /capture photo/i })).toBeInTheDocument()
    })
  })

  it('handles file upload correctly', async () => {
    const user = userEvent.setup()
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    
    renderWithProvider(<FoodCamera selectedDate="2025-06-28" />)
    
    const uploadButton = screen.getByRole('button', { name: /upload photo/i })
    await user.click(uploadButton)
    
    const fileInput = screen.getByLabelText(/upload photo/i)
    await user.upload(fileInput, file)
    
    await waitFor(() => {
      expect(screen.getByText(/analyzing/i)).toBeInTheDocument()
    })
  })

  it('processes AI food analysis correctly', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsageStats)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockFoodAnalysis)
      })
    
    const user = userEvent.setup()
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    
    renderWithProvider(<FoodCamera selectedDate="2025-06-28" />)
    
    const uploadButton = screen.getByRole('button', { name: /upload photo/i })
    await user.click(uploadButton)
    
    const fileInput = screen.getByLabelText(/upload photo/i)
    await user.upload(fileInput, file)
    
    await waitFor(() => {
      expect(screen.getByText('Apple')).toBeInTheDocument()
      expect(screen.getByText(/95 calories/i)).toBeInTheDocument()
      expect(screen.getByText(/95% confidence/i)).toBeInTheDocument()
    })
  })

  it('shows add to meal buttons for detected foods', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsageStats)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockFoodAnalysis)
      })
    
    const user = userEvent.setup()
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    
    renderWithProvider(<FoodCamera selectedDate="2025-06-28" />)
    
    const uploadButton = screen.getByRole('button', { name: /upload photo/i })
    await user.click(uploadButton)
    
    const fileInput = screen.getByLabelText(/upload photo/i)
    await user.upload(fileInput, file)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add apple to meal/i })).toBeInTheDocument()
    })
  })

  it('handles usage limit reached for free users', async () => {
    const limitReachedStats = {
      isPremium: false,
      limits: { photos: 2, meals: 1 },
      remaining: { photos: 0, meals: 1 },
      photos: 2
    }
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(limitReachedStats)
    })
    
    renderWithProvider(<FoodCamera selectedDate="2025-06-28" />)
    
    await waitFor(() => {
      expect(screen.getByText(/daily limit reached/i)).toBeInTheDocument()
      expect(screen.getByText(/upgrade to premium/i)).toBeInTheDocument()
    })
  })

  it('displays camera error states correctly', async () => {
    navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(new Error('Camera not available'))
    
    const user = userEvent.setup()
    renderWithProvider(<FoodCamera selectedDate="2025-06-28" />)
    
    const cameraButton = screen.getByRole('button', { name: /open camera/i })
    await user.click(cameraButton)
    
    await waitFor(() => {
      expect(screen.getByText(/camera access denied/i)).toBeInTheDocument()
    })
  })

  it('resets camera state after successful analysis', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsageStats)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockFoodAnalysis)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      })
    
    const user = userEvent.setup()
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    
    renderWithProvider(<FoodCamera selectedDate="2025-06-28" />)
    
    const uploadButton = screen.getByRole('button', { name: /upload photo/i })
    await user.click(uploadButton)
    
    const fileInput = screen.getByLabelText(/upload photo/i)
    await user.upload(fileInput, file)
    
    await waitFor(() => {
      expect(screen.getByText('Apple')).toBeInTheDocument()
    })
    
    const addButton = screen.getByRole('button', { name: /add apple to meal/i })
    await user.click(addButton)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /open camera/i })).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('handles API errors gracefully', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsageStats)
      })
      .mockRejectedValueOnce(new Error('API Error'))
    
    const user = userEvent.setup()
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    
    renderWithProvider(<FoodCamera selectedDate="2025-06-28" />)
    
    const uploadButton = screen.getByRole('button', { name: /upload photo/i })
    await user.click(uploadButton)
    
    const fileInput = screen.getByLabelText(/upload photo/i)
    await user.upload(fileInput, file)
    
    await waitFor(() => {
      expect(screen.getByText(/error analyzing image/i)).toBeInTheDocument()
    })
  })
})