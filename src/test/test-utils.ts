import type { Accident, FilterOption } from '@/types/accedents'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

/** Matches FilterForm `initialStartDate` */
export const TEST_DEFAULT_FILTER_START = '2026-01-01'
/** Align with FilterForm `maxDate` (today UTC) so mocked URL range passes validateDateRange */
export const TEST_DEFAULT_FILTER_END = new Date().toISOString().split('T')[0]

/**
 * Mock accident data for testing
 */
export const mockAccidents: Accident[] = [
  {
    id: 1,
    accidentId: 101,
    pdepartment: 'PD1',
    pstation: 'VLASOTINCE',
    dateTime: '2025-01-15T10:00:00',
    longitude: 22.14,
    latitude: 42.965,
    accidentType: 'Sa materijalnom štetom',
    category: 'Jedno vozilo',
    description: 'Test accident 1',
  },
  {
    id: 2,
    accidentId: 102,
    pdepartment: 'PD1',
    pstation: 'VLASOTINCE',
    dateTime: '2025-01-16T11:00:00',
    longitude: 22.15,
    latitude: 42.966,
    accidentType: 'Sa povređenim',
    category: 'Jedno vozilo',
    description: 'Test accident 2',
  },
  {
    id: 3,
    accidentId: 103,
    pdepartment: 'PD1',
    pstation: 'VLASOTINCE',
    dateTime: '2025-01-17T12:00:00',
    longitude: 22.16,
    latitude: 42.967,
    accidentType: 'Sa materijalnom štetom',
    category: 'Pešaci',
    description: 'Test accident 3',
  },
]

/**
 * Mock filter options for categories
 */
export const mockCategories: FilterOption[] = [
  { value: 'jedno-vozilo', label: 'Jedno vozilo' },
  { value: 'pesaci', label: 'Pešaci' },
  { value: 'bez-skretanja', label: 'Najmanje dva vozila – bez skretanja' },
  { value: 'skretanje-prelazak', label: 'Najmanje dva vozila – skretanje ili prelazak' },
  { value: 'parkirana', label: 'Parkirana vozila' },
]

/**
 * Mock filter options for accident types
 */
export const mockAccidentTypes: FilterOption[] = [
  { value: 'materijalna', label: 'Sa materijalnom štetom' },
  { value: 'povredjeni', label: 'Sa povređenim' },
  { value: 'poginuli', label: 'Sa poginulim' },
]

/**
 * Helper function to create custom accident for testing
 */
export const createMockAccident = (overrides?: Partial<Accident>): Accident => ({
  id: 1,
  accidentId: 101,
  pdepartment: 'PD1',
  pstation: 'VLASOTINCE',
  dateTime: '2025-01-15T10:00:00',
  longitude: 22.14,
  latitude: 42.965,
  accidentType: 'Sa materijalnom štetom',
  category: 'Jedno vozilo',
  description: 'Test accident',
  ...overrides,
})

/**
 * Helper function to create QueryClientProvider wrapper for testing
 */
export const createQueryClientWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}
