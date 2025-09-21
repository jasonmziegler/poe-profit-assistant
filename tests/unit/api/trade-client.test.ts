import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TradeApiClient, TradeApiError } from '@/lib/api/trade-client'
import { TradeSearchRequest, TradeSearchResponse, TradeFetchResponse } from '@/lib/types/trade'
import { sessionManager } from '@/lib/utils/session'

// Mock the session manager
vi.mock('@/lib/utils/session', () => ({
  sessionManager: {
    hasValidSession: vi.fn(),
    getSession: vi.fn(),
  },
}))

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('TradeApiClient', () => {
  let tradeClient: TradeApiClient
  const mockLeague = 'Standard'

  beforeEach(() => {
    tradeClient = new TradeApiClient({ league: mockLeague })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('should initialize with league and default options', () => {
      expect(tradeClient).toBeInstanceOf(TradeApiClient)
    })

    it('should initialize with custom options', () => {
      const customClient = new TradeApiClient({
        league: 'Hardcore',
        retryAttempts: 5,
        retryDelay: 2000,
        timeout: 15000,
      })
      expect(customClient).toBeInstanceOf(TradeApiClient)
    })
  })

  describe('validateSession', () => {
    it('should not throw when session is valid', () => {
      vi.mocked(sessionManager.hasValidSession).mockReturnValue(true)

      expect(() => tradeClient.validateSession()).not.toThrow()
    })

    it('should throw TradeApiError when session is invalid', () => {
      vi.mocked(sessionManager.hasValidSession).mockReturnValue(false)

      expect(() => tradeClient.validateSession()).toThrow(TradeApiError)
      expect(() => tradeClient.validateSession()).toThrow('No valid POESESSID found')
    })
  })

  describe('searchItems', () => {
    const mockSearchRequest: TradeSearchRequest = {
      query: {
        name: 'Tabula Rasa',
      },
      sort: {
        price: 'asc',
      },
    }

    const mockSearchResponse: TradeSearchResponse = {
      id: 'search123',
      result: ['item1', 'item2', 'item3'],
      total: 3,
    }

    beforeEach(() => {
      vi.mocked(sessionManager.hasValidSession).mockReturnValue(true)
      vi.mocked(sessionManager.getSession).mockReturnValue('valid_session_token')
    })

    it('should successfully search for items', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSearchResponse),
        headers: new Headers(),
      })

      const result = await tradeClient.searchItems(mockSearchRequest)

      expect(result).toEqual(mockSearchResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        `https://www.pathofexile.com/api/trade/search/${mockLeague}`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Cookie: 'POESESSID=valid_session_token',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(mockSearchRequest),
        })
      )
    })

    it('should throw TradeApiError on HTTP error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers(),
      })

      await expect(tradeClient.searchItems(mockSearchRequest)).rejects.toThrow(TradeApiError)
    })

    it('should throw authentication error on 401', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers(),
      })

      await expect(tradeClient.searchItems(mockSearchRequest)).rejects.toThrow(
        'Authentication failed'
      )
    })

    it('should handle network errors with retries', async () => {
      const networkError = new Error('Network error')
      mockFetch
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockSearchResponse),
          headers: new Headers(),
        })

      const result = await tradeClient.searchItems(mockSearchRequest)
      expect(result).toEqual(mockSearchResponse)
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })
  })

  describe('fetchListings', () => {
    const mockSearchId = 'search123'
    const mockListingIds = ['item1', 'item2', 'item3']

    const mockFetchResponse: TradeFetchResponse = {
      result: [
        {
          id: 'item1',
          listing: {
            method: 'psapi',
            indexed: '2024-01-01T00:00:00Z',
            whisper: '@seller Hi, I would like to buy your Item',
            account: {
              name: 'TestSeller',
            },
            price: {
              type: 'fixed',
              amount: 10,
              currency: 'chaos',
            },
          },
          item: {
            verified: true,
            w: 2,
            h: 3,
            league: mockLeague,
            id: 'item1',
            name: 'Test Item',
            typeLine: 'Test Base',
            identified: true,
            ilvl: 75,
            frameType: 3,
            properties: [],
            requirements: [],
            implicitMods: [],
            explicitMods: [],
            sockets: [],
          },
        },
      ],
    }

    beforeEach(() => {
      vi.mocked(sessionManager.hasValidSession).mockReturnValue(true)
      vi.mocked(sessionManager.getSession).mockReturnValue('valid_session_token')
    })

    it('should successfully fetch listings', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockFetchResponse),
        headers: new Headers(),
      })

      const result = await tradeClient.fetchListings(mockSearchId, mockListingIds)

      expect(result).toEqual(mockFetchResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        `https://www.pathofexile.com/api/trade/fetch/${mockListingIds.join(',')}?query=${mockSearchId}`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Cookie: 'POESESSID=valid_session_token',
          }),
        })
      )
    })

    it('should limit listing IDs to 10 maximum', async () => {
      const manyIds = Array.from({ length: 15 }, (_, i) => `item${i}`)
      const expectedIds = manyIds.slice(0, 10)

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockFetchResponse),
        headers: new Headers(),
      })

      await tradeClient.fetchListings(mockSearchId, manyIds)

      expect(mockFetch).toHaveBeenCalledWith(
        `https://www.pathofexile.com/api/trade/fetch/${expectedIds.join(',')}?query=${mockSearchId}`,
        expect.anything()
      )
    })

    it('should handle rate limiting with retry', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          headers: new Headers({ 'Retry-After': '1' }),
        })
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockFetchResponse),
          headers: new Headers(),
        })

      const result = await tradeClient.fetchListings(mockSearchId, mockListingIds)
      expect(result).toEqual(mockFetchResponse)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('searchAndFetchItems', () => {
    const mockSearchRequest: TradeSearchRequest = {
      query: { name: 'Test Item' },
      sort: { price: 'asc' },
    }

    const mockSearchResponse: TradeSearchResponse = {
      id: 'search123',
      result: ['item1', 'item2'],
      total: 2,
    }

    const mockFetchResponse: TradeFetchResponse = {
      result: [],
    }

    beforeEach(() => {
      vi.mocked(sessionManager.hasValidSession).mockReturnValue(true)
      vi.mocked(sessionManager.getSession).mockReturnValue('valid_session_token')
    })

    it('should perform search and fetch in sequence', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockSearchResponse),
          headers: new Headers(),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockFetchResponse),
          headers: new Headers(),
        })

      const result = await tradeClient.searchAndFetchItems(mockSearchRequest, 10)

      expect(result).toEqual(mockFetchResponse)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should return empty result when no search results', async () => {
      const emptySearchResponse = { ...mockSearchResponse, result: [] }

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(emptySearchResponse),
        headers: new Headers(),
      })

      const result = await tradeClient.searchAndFetchItems(mockSearchRequest)

      expect(result).toEqual({ result: [] })
      expect(mockFetch).toHaveBeenCalledTimes(1) // Only search call
    })

    it('should limit results by maxResults parameter', async () => {
      const manyResultsResponse = {
        ...mockSearchResponse,
        result: Array.from({ length: 50 }, (_, i) => `item${i}`),
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(manyResultsResponse),
          headers: new Headers(),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockFetchResponse),
          headers: new Headers(),
        })

      await tradeClient.searchAndFetchItems(mockSearchRequest, 5)

      // Check that fetch was called with only first 5 items
      const fetchCall = mockFetch.mock.calls[1]
      expect(fetchCall[0]).toContain('item0,item1,item2,item3,item4')
    })
  })
})
