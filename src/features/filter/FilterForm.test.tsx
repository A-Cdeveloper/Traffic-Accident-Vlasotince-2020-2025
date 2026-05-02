import { QueryClient } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockCategories, mockAccidentTypes, createQueryClientWrapper } from '@/test/test-utils'

// Initial date values
const INITIAL_START_DATE = '2026-01-01'
const INITIAL_END_DATE = '2025-12-31' // Mock end date for tests

// Mock nuqs - mora biti pre importa FilterForm
const mockSetFilters = vi.fn()
vi.mock('nuqs', () => ({
  useQueryStates: vi.fn(() => [
    { startDate: INITIAL_START_DATE, endDate: INITIAL_END_DATE, accidentType: null, categories: null },
    mockSetFilters,
  ]),
  parseAsString: vi.fn(),
  parseAsArrayOf: vi.fn(),
}))

// Mock useFilters
vi.mock('./hooks/useFilters', () => ({
  useFilters: () => ({
    data: { accidentTypes: mockAccidentTypes, categories: mockCategories },
    isLoading: false,
    isError: false,
    error: null,
  }),
}))

// Mock sonner
vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}))

import FilterForm from './FilterForm'

describe('FilterForm', () => {
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

  // Helper function to render component and return form elements
  const renderFilterForm = async (openMultiselect = true) => {
    render(<FilterForm />, { wrapper })
    const user = userEvent.setup()
    
    const multiselectButton = screen.getByTestId('category-multiselect')
    
    if (openMultiselect) {
      // Open multiselect popover
      await user.click(multiselectButton)
      // Wait for popover to open by finding first checkbox
      await screen.findByLabelText(mockCategories[0].label)
    }
    
    return {
      startDateInput: screen.getByLabelText(/datum od/i),
      endDateInput: screen.getByLabelText(/datum do/i),
      submitButton: screen.getByRole('button', { name: /primeni filtere/i }),
      resetButton: screen.getByRole('button', { name: /poništi/i }),
      multiselectButton,
      getCategoryCheckbox: (label: string | RegExp) => screen.getByLabelText(label),
    }
  }

  it('should render component successfully', async () => {
    const { startDateInput, endDateInput, getCategoryCheckbox } = await renderFilterForm()

    expect(startDateInput).toBeInTheDocument()
    expect(endDateInput).toBeInTheDocument()
    expect(getCategoryCheckbox(/Jedno vozilo/i)).toBeInTheDocument()
    expect(getCategoryCheckbox(/Pešaci/i)).toBeInTheDocument()
    expect(getCategoryCheckbox(/Najmanje dva vozila – bez skretanja/i)).toBeInTheDocument()
    expect(getCategoryCheckbox(/Najmanje dva vozila – skretanje ili prelazak/i)).toBeInTheDocument()
    expect(getCategoryCheckbox(/Parkirana vozila/i)).toBeInTheDocument()
  })

  it('should render all category checkboxes', async () => {
    const { getCategoryCheckbox } = await renderFilterForm()

    mockCategories.forEach((category) => {
      expect(getCategoryCheckbox(category.label)).toBeInTheDocument()
    })
  })

  it('should update start date when user types', async () => {
    const user = userEvent.setup()
    const { startDateInput } = await renderFilterForm(false)
    await user.clear(startDateInput)
    await user.type(startDateInput, '2025-01-15')

    expect(startDateInput).toHaveValue('2025-01-15')
  })

  it('should update end date when user types', async () => {
    const user = userEvent.setup()
    const { endDateInput } = await renderFilterForm(false)
    await user.clear(endDateInput)
    await user.type(endDateInput, '2025-01-31')

    expect(endDateInput).toHaveValue('2025-01-31')
  })

  it('should toggle category checkbox when clicked', async () => {
    const user = userEvent.setup()
    const { getCategoryCheckbox } = await renderFilterForm()

    const checkbox = getCategoryCheckbox(mockCategories[0].label)
    expect(checkbox).not.toBeChecked()

    await user.click(checkbox)
    expect(checkbox).toBeChecked()

    await user.click(checkbox)
    expect(checkbox).not.toBeChecked()
  })

  it('should call setFilters with correct values on submit', async () => {
    const user = userEvent.setup()
    const { startDateInput, endDateInput, submitButton } = await renderFilterForm(false)

    await user.clear(startDateInput)
    await user.type(startDateInput, '2025-01-15')
    await user.clear(endDateInput)
    await user.type(endDateInput, '2025-01-31')

    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSetFilters).toHaveBeenCalledWith({
        startDate: '2025-01-15',
        endDate: '2025-01-31',
        accidentType: null,
        categories: null,
      })
    })
  })

  it('should reset form to initial values when reset button is clicked', async () => {
    const user = userEvent.setup()
    const { startDateInput, endDateInput, resetButton } = await renderFilterForm(false)

    // Change values
    await user.clear(startDateInput)
    await user.type(startDateInput, '2025-02-15')
    await user.clear(endDateInput)
    await user.type(endDateInput, '2025-02-28')

    // Reset
    await user.click(resetButton)

    await waitFor(() => {
      expect(mockSetFilters).toHaveBeenCalledWith({
        startDate: INITIAL_START_DATE,
        endDate: expect.any(String), // maxDate (today)
        accidentType: null,
        categories: null,
      })
    })
  })
})
