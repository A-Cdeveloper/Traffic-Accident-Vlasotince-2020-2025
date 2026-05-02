import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import useAccidents from './useAccidents'
import { getAccidents } from '../api/getAccidents'
import type { AccidentsSuccessResponse } from '@/types/accedents'
import { mockAccidents, createQueryClientWrapper } from '@/test/test-utils'

// Mock nuqs
const mockUseQueryStates = vi.fn()
const mockSetFilters = vi.fn()
vi.mock('nuqs', () => ({
  useQueryStates: () => mockUseQueryStates(),
  parseAsString: vi.fn(),
  parseAsArrayOf: vi.fn(),
}))

// Mock the API function
vi.mock('../api/getAccidents')

describe('useAccidents hook', () => {
  let queryClient: QueryClient
  let wrapper: ReturnType<typeof createQueryClientWrapper>

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    wrapper = createQueryClientWrapper(queryClient)
    vi.clearAllMocks()
  })

  it('should fetch accidents successfully with filters from URL', async () => {
    const mockFilters = {
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      accidentType: 'materijalna',
      categories: ['jedno-vozilo'],
    }

    const mockResponse: AccidentsSuccessResponse = {
      pstation: 'VLASOTINCE',
      startDate: mockFilters.startDate,
      endDate: mockFilters.endDate,
      accidentType: mockFilters.accidentType,
      categories: mockFilters.categories,
      total: 2,
      data: mockAccidents,
    }

    mockUseQueryStates.mockReturnValue([mockFilters, mockSetFilters])
    vi.mocked(getAccidents).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useAccidents(), { wrapper })

    // Initially loading
    expect(result.current.isLoading).toBe(true)

    // Wait for data
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockResponse)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('should call getAccidents with filters from URL', async () => {
    const mockFilters = {
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      accidentType: null,
      categories: null,
    }

    const mockResponse: AccidentsSuccessResponse = {
      pstation: 'VLASOTINCE',
      startDate: mockFilters.startDate,
      endDate: mockFilters.endDate,
      accidentType: null,
      categories: null,
      total: 3,
      data: mockAccidents,
    }

    mockUseQueryStates.mockReturnValue([mockFilters, mockSetFilters])
    vi.mocked(getAccidents).mockResolvedValue(mockResponse)

    renderHook(() => useAccidents(), { wrapper })

    await waitFor(() => {
      expect(getAccidents).toHaveBeenCalledWith(mockFilters)
    })
  })

  it('should handle error when fetch fails', async () => {
    const mockFilters = {
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      accidentType: null,
      categories: null,
    }

    const mockError = new Error('Failed to fetch accidents')
    mockUseQueryStates.mockReturnValue([mockFilters, mockSetFilters])
    vi.mocked(getAccidents).mockRejectedValue(mockError)

    const { result } = renderHook(() => useAccidents(), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toEqual(mockError)
    expect(result.current.data).toBeUndefined()
    expect(result.current.isLoading).toBe(false)
  })

  it('should update queryKey when filters change', async () => {
    const mockFilters1 = {
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      accidentType: null,
      categories: null,
    }

    const mockResponse: AccidentsSuccessResponse = {
      pstation: 'VLASOTINCE',
      startDate: mockFilters1.startDate,
      endDate: mockFilters1.endDate,
      accidentType: null,
      categories: null,
      total: 3,
      data: mockAccidents,
    }

    mockUseQueryStates.mockReturnValue([mockFilters1])
    vi.mocked(getAccidents).mockResolvedValue(mockResponse)

    const { result, rerender } = renderHook(() => useAccidents(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Change filters
    const mockFilters2 = {
      startDate: '2026-02-01',
      endDate: '2026-02-28',
      accidentType: 'materijalna',
      categories: ['jedno-vozilo'],
    }

    mockUseQueryStates.mockReturnValue([mockFilters2])
    rerender()

    await waitFor(() => {
      expect(
        queryClient.getQueryCache().find({
          queryKey: [
            'accidents',
            mockFilters2.startDate,
            mockFilters2.endDate,
            mockFilters2.accidentType,
            mockFilters2.categories,
          ],
        })
      ).toBeDefined()
    })
  })
})
