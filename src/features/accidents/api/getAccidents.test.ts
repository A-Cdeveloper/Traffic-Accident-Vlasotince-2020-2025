import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getAccidents } from './getAccidents'
import type { AccidentsSuccessResponse, AccidentsErrorResponse } from '@/types/accedents'
import { mockAccidents } from '@/test/test-utils'

describe('getAccidents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch accidents successfully with all parameters', async () => {
    const mockResponse: AccidentsSuccessResponse = {
      pstation: 'VLASOTINCE',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      accidentType: 'materijalna',
      categories: ['jedno-vozilo'],
      total: 2,
      data: mockAccidents,
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response)

    const result = await getAccidents({
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      accidentType: 'materijalna',
      categories: ['jedno-vozilo'],
    })

    expect(result).toEqual(mockResponse)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/accidents?pstation=VLASOTINCE&startDate=2026-01-01&endDate=2026-01-31&accidentType=materijalna&categories=jedno-vozilo')
    )
  })

  it('should fetch accidents successfully without optional parameters', async () => {
    const mockResponse: AccidentsSuccessResponse = {
      pstation: 'VLASOTINCE',
      startDate: null,
      endDate: null,
      accidentType: null,
      categories: null,
      total: 3,
      data: mockAccidents,
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response)

    const result = await getAccidents({})

    expect(result).toEqual(mockResponse)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/accidents?pstation=VLASOTINCE')
    )
  })

  it('should not include empty categories array in query params', async () => {
    const mockResponse: AccidentsSuccessResponse = {
      pstation: 'VLASOTINCE',
      startDate: null,
      endDate: null,
      accidentType: null,
      categories: null,
      total: 0,
      data: [],
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response)

    await getAccidents({ categories: [] })

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/accidents?pstation=VLASOTINCE')
    )
  })

  it('should throw error with message from error response', async () => {
    const mockError: AccidentsErrorResponse = {
      error: 'Validation failed',
      details: [
        {
          code: 'INVALID_DATE',
          path: ['startDate'],
          message: 'Invalid date format',
        },
      ],
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => mockError,
    } as Response)

    await expect(
      getAccidents({
        startDate: 'invalid-date',
        endDate: '2026-01-31',
      })
    ).rejects.toThrow('Invalid date format')
  })

  it('should throw error with fallback message when error response has no details', async () => {
    const mockError: AccidentsErrorResponse = {
      error: 'Server error',
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => mockError,
    } as Response)

    await expect(getAccidents({})).rejects.toThrow('Server error')
  })

  it('should throw error with default message when error response is malformed', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response)

    await expect(getAccidents({})).rejects.toThrow('Failed to fetch accidents')
  })
})
