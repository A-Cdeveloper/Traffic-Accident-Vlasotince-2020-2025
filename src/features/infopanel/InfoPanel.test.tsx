import { QueryClient } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  mockAccidents,
  mockCategories,
  mockAccidentTypes,
  createQueryClientWrapper,
  TEST_DEFAULT_FILTER_START,
  TEST_DEFAULT_FILTER_END,
} from '@/test/test-utils'
import type { AccidentsSuccessResponse, MetadataResponse } from '@/types/accedents'

// Mock nuqs
const mockUseQueryStates = vi.fn()
vi.mock('nuqs', () => ({
  useQueryStates: () => mockUseQueryStates(),
  parseAsString: vi.fn(),
  parseAsArrayOf: vi.fn(),
}))

// Mock hooks
vi.mock('@/features/accidents/hooks/useAccidents')
vi.mock('@/features/filter/hooks/useFilters')

import InfoPanel from './InfoPanel'
import useAccidents from '@/features/accidents/hooks/useAccidents'
import { useFilters } from '@/features/filter/hooks/useFilters'

describe('InfoPanel', () => {
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

    // Setup default nuqs mock
    mockUseQueryStates.mockReturnValue([
      {
        startDate: TEST_DEFAULT_FILTER_START,
        endDate: TEST_DEFAULT_FILTER_END,
        accidentType: null,
        categories: null,
      },
    ])

    // Setup default useAccidents mock
    const mockAccidentsResponse: AccidentsSuccessResponse = {
      pstation: 'VLASOTINCE',
      startDate: TEST_DEFAULT_FILTER_START,
      endDate: TEST_DEFAULT_FILTER_END,
      accidentType: null,
      categories: null,
      total: mockAccidents.length,
      data: mockAccidents,
    }

    vi.mocked(useAccidents).mockReturnValue({
      data: mockAccidentsResponse,
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: true,
      isPending: false,
    } as ReturnType<typeof useAccidents>)

    // Setup default useFilters mock
    const mockFilterData: MetadataResponse = {
      accidentTypes: mockAccidentTypes,
      categories: mockCategories,
    }

    vi.mocked(useFilters).mockReturnValue({
      data: mockFilterData,
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: true,
      isPending: false,
    } as ReturnType<typeof useFilters>)
  })

  // Helper function to render component and return form elements
  const renderInfoPanel = () => {
    render(<InfoPanel />, { wrapper })
    return {
      getTotalCount: () => screen.getByText(/ukupan broj nesreća/i),
      getDateRange: () => screen.queryByText(/period:/i),
    }
  }

  it('should render component successfully', () => {
    const { getTotalCount } = renderInfoPanel()

    expect(getTotalCount()).toBeInTheDocument()
  })

  it('should display total accident count', () => {
    renderInfoPanel()

    expect(screen.getByText(mockAccidents.length.toString())).toBeInTheDocument()
  })

  it('should display date range when dates are available', () => {
    renderInfoPanel()

    expect(screen.getByText(/period:/i)).toBeInTheDocument()
  })

  it('should show loading state when accidents are loading', () => {
    vi.mocked(useAccidents).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      isSuccess: false,
      isPending: true,
    } as ReturnType<typeof useAccidents>)

    render(<InfoPanel />, { wrapper })

    // Loading component should be rendered
    expect(screen.queryByText(/ukupan broj nesreća/i)).not.toBeInTheDocument()
  })

  it('should show loading state when filters are loading', () => {
    vi.mocked(useFilters).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      isSuccess: false,
      isPending: true,
    } as ReturnType<typeof useFilters>)

    render(<InfoPanel />, { wrapper })

    // Loading component should be rendered
    expect(screen.queryByText(/ukupan broj nesreća/i)).not.toBeInTheDocument()
  })

  it('should display statistic section when accidentType filter is set', () => {
    mockUseQueryStates.mockReturnValue([
      {
        startDate: TEST_DEFAULT_FILTER_START,
        endDate: TEST_DEFAULT_FILTER_END,
        accidentType: 'materijalna',
        categories: null,
      },
    ])

    renderInfoPanel()

    expect(screen.getByText(/broj nesreća po tipu/i)).toBeInTheDocument()
  })

  it('should display statistic section when categories filter is set', () => {
    mockUseQueryStates.mockReturnValue([
      {
        startDate: TEST_DEFAULT_FILTER_START,
        endDate: TEST_DEFAULT_FILTER_END,
        accidentType: null,
        categories: ['jedno-vozilo'],
      },
    ])

    renderInfoPanel()

    expect(screen.getByText(/broj nesreća po kategoriji/i)).toBeInTheDocument()
  })

  it('should not display statistic sections when no filters are set', () => {
    mockUseQueryStates.mockReturnValue([
      {
        startDate: TEST_DEFAULT_FILTER_START,
        endDate: TEST_DEFAULT_FILTER_END,
        accidentType: null,
        categories: null,
      },
    ])

    renderInfoPanel()

    expect(screen.queryByText(/broj nesreća po tipu/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/broj nesreća po kategoriji/i)).not.toBeInTheDocument()
  })
})
