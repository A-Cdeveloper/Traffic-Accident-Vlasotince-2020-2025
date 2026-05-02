import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useQueryStates, parseAsString, parseAsArrayOf } from 'nuqs'
import { useFilters } from './hooks/useFilters'
import { validateDateRange } from '@/utils/dates'
import DateInput from './components/DateInput'
import CategoryMultiSelect from './components/CategoryMultiSelect'
import AccidentTypeSelect from './components/AccidentTypeSelect'

const FilterForm = () => {
  const [filters, setFilters] = useQueryStates({
    startDate: parseAsString,
    endDate: parseAsString,
    accidentType: parseAsString,
    categories: parseAsArrayOf(parseAsString),
  })

  const { data: filterOptions, isLoading: isLoadingOptions } = useFilters()

  // Date constraints
  const minDate = '2020-01-01'
  // Memoize maxDate to prevent recalculation on every render
  const maxDate = useMemo(() => new Date().toISOString().split('T')[0], [])

  // Initial filter: 01.01.2026 to today
  const initialStartDate = '2026-01-01'
  const initialEndDate = maxDate

  // Compute derived state outside effect
  const hasNoFilters = !filters.startDate &&
    !filters.endDate &&
    !filters.accidentType &&
    (!filters.categories || filters.categories.length === 0)

  // Automatically set initial filter if no filters in URL
  useEffect(() => {
    if (hasNoFilters) {
      setFilters({
        startDate: initialStartDate,
        endDate: initialEndDate,
        accidentType: null,
        categories: null,
      })
    }
  }, [hasNoFilters, initialStartDate, initialEndDate, setFilters])


  // Use filters from URL if they exist, otherwise use initial values
  const [localFilters, setLocalFilters] = useState(() => {
    // If filters exist in URL, use them
    if (filters.startDate || filters.endDate || filters.accidentType || (filters.categories && filters.categories.length > 0)) {
      return {
        startDate: filters.startDate || '',
        endDate: filters.endDate || '',
        accidentType: filters.accidentType || 'all',
        categories: filters.categories || [] as string[],
      }
    }
    // Otherwise use initial values
    return {
      startDate: initialStartDate,
      endDate: initialEndDate,
      accidentType: 'all',
      categories: [] as string[],
    }
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validate dates
    const dateValidation = validateDateRange(localFilters.startDate, localFilters.endDate)
    if (!dateValidation.isValid) {
      toast.error(dateValidation.errorMessage)
      return
    }

    // Apply filters only on submit
    setFilters({
      startDate: localFilters.startDate || null,
      endDate: localFilters.endDate || null,
      accidentType: localFilters.accidentType && localFilters.accidentType !== 'all' ? localFilters.accidentType : null,
      categories: localFilters.categories.length > 0 ? localFilters.categories : null,
    })
  }

  const handleReset = () => {
    // Reset URL filters to initial values (2025-01-01 to today)
    setFilters({
      startDate: initialStartDate,
      endDate: initialEndDate,
      accidentType: null,
      categories: null,
    })

    // Reset local state to initial values
    setLocalFilters({
      startDate: initialStartDate,
      endDate: initialEndDate,
      accidentType: 'all',
      categories: [],
    })
  }


  return (
    <form
      data-testid="filter-form"
      onSubmit={handleSubmit}
      onReset={handleReset}
      className="space-y-5 text-[13px] bg-muted p-4 rounded-md"
    >
      {/* Date from and to */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <DateInput
          id="date-from"
          name="startDate"
          label="Datum od"
          value={localFilters.startDate}
          onChange={(value) => setLocalFilters(prev => ({ ...prev, startDate: value }))}
          min={minDate}
          max={maxDate}
          className="pr-0 pl-1"
        />
        <DateInput
          id="date-to"
          name="endDate"
          label="Datum do"
          value={localFilters.endDate}
          onChange={(value) => setLocalFilters(prev => ({ ...prev, endDate: value }))}
          min={minDate}
          max={maxDate}
          className="pr-1 pl-1"
        />
      </div>

      {/* Accident type */}
      <AccidentTypeSelect
        value={localFilters.accidentType}
        onValueChange={(value) => setLocalFilters(prev => ({ ...prev, accidentType: value }))}
        options={filterOptions?.accidentTypes}
        disabled={isLoadingOptions}
      />

      {/* Categories */}
      <CategoryMultiSelect
        options={filterOptions?.categories}
        value={localFilters.categories}
        onValueChange={(update) => {
          setLocalFilters(prev => ({
            ...prev,
            categories: typeof update === 'function' ? update(prev.categories) : update
          }))
        }}
        disabled={isLoadingOptions}
      />

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <Button data-testid="filter-submit" type="submit" className="flex-1 text-[13px]">
          Primeni filtere
        </Button>
        <Button data-testid="filter-reset" type="reset" variant="outline" className="flex-1 text-[13px]">
          Poništi
        </Button>
      </div>
    </form>
  )
}

export default FilterForm