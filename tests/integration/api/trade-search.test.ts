import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST, GET } from '@/app/api/trade/search/route'
import { sessionManager } from '@/lib/utils/session'

// Mock trade API client and related components
const mockTradeApiClient = {
  searchAndFetchItems: vi.fn(),
}

const mockPriceParser = {
  parseTradeResponse: vi.fn(),
}

const mockTradeCache = {
  getPriceData: vi.fn(),
  storePriceData: vi.fn(),
}

// Mock dependencies
vi.mock('@/lib/utils/session', () => ({
  sessionManager: {
    hasValidSession: vi.fn(),
  },
}))

vi.mock('@/lib/api/trade-client', () => ({
  TradeApiClient: vi.fn(() => mockTradeApiClient),
  TradeApiError: class extends Error {
    public statusCode: number
    public endpoint: string
    public isAuthError: boolean

    constructor(message: string, statusCode: number, endpoint: string, isAuthError = false) {
      super(message)
      this.statusCode = statusCode
      this.endpoint = endpoint
      this.isAuthError = isAuthError
    }
  },
}))

vi.mock('@/lib/api/price-parser', () => ({
  PriceParser: mockPriceParser,
}))

vi.mock('@/lib/cache/trade-cache', () => ({
  tradeCache: mockTradeCache,
}))

describe('/api/trade/search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('POST', () => {
    it('should return 401 when no valid session', async () => {
      vi.mocked(sessionManager.hasValidSession).mockReturnValue(false)

      const request = new NextRequest('http://localhost/api/trade/search', {
        method: 'POST',
        body: JSON.stringify({
          league: 'Standard',
          itemName: 'Test Item',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication required')
    })

    it('should return cached data when available', async () => {
      vi.mocked(sessionManager.hasValidSession).mockReturnValue(true)

      const cachedPriceData = {
        listings: [],
        totalFound: 5,
        averagePrice: 10,
        medianPrice: 10,
        priceRange: { min: 5, max: 15 },
        currency: 'chaos' as const,
        lastUpdated: new Date(),
      }

      mockTradeCache.getPriceData.mockResolvedValue(cachedPriceData)

      const request = new NextRequest('http://localhost/api/trade/search', {
        method: 'POST',
        body: JSON.stringify({
          league: 'Standard',
          itemName: 'Cached Item',
          useCache: true,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.priceData).toEqual(cachedPriceData)
      expect(data.data.meta.fromCache).toBe(true)
      expect(mockTradeApiClient.searchAndFetchItems).not.toHaveBeenCalled()
    })

    it('should fetch fresh data when not cached', async () => {
      vi.mocked(sessionManager.hasValidSession).mockReturnValue(true)
      mockTradeCache.getPriceData.mockResolvedValue(null)

      const mockTradeResponse = {
        result: [
          {
            id: 'item1',
            listing: {
              method: 'psapi',
              indexed: '2024-01-01T00:00:00Z',
              whisper: '@seller Hi',
              account: { name: 'TestSeller' },
              price: { type: 'fixed', amount: 10, currency: 'chaos' },
            },
            item: {
              league: 'Standard',
              id: 'item1',
              name: 'Fresh Item',
              typeLine: 'Test Base',
              identified: true,
              ilvl: 75,
              frameType: 2,
              properties: [],
              requirements: [],
              implicitMods: [],
              explicitMods: [],
              sockets: [],
            },
          },
        ],
      }

      const mockParsedData = {
        listings: [],
        totalFound: 1,
        averagePrice: 10,
        medianPrice: 10,
        priceRange: { min: 10, max: 10 },
        currency: 'chaos' as const,
        lastUpdated: new Date(),
      }

      mockTradeApiClient.searchAndFetchItems.mockResolvedValue(mockTradeResponse)
      mockPriceParser.parseTradeResponse.mockReturnValue(mockParsedData)
      mockTradeCache.storePriceData.mockResolvedValue()

      const request = new NextRequest('http://localhost/api/trade/search', {
        method: 'POST',
        body: JSON.stringify({
          league: 'Standard',
          itemName: 'Fresh Item',
          maxResults: 10,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.priceData).toEqual(mockParsedData)
      expect(data.data.meta.fromCache).toBe(false)

      expect(mockTradeApiClient.searchAndFetchItems).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            name: 'Fresh Item',
          }),
          sort: { price: 'asc' },
        }),
        10
      )
      expect(mockTradeCache.storePriceData).toHaveBeenCalled()
    })

    it('should validate request parameters', async () => {
      const request = new NextRequest('http://localhost/api/trade/search', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required league
          itemName: 'Test Item',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid request parameters')
    })

    it('should handle trade API errors', async () => {
      vi.mocked(sessionManager.hasValidSession).mockReturnValue(true)
      mockTradeCache.getPriceData.mockResolvedValue(null)

      const { TradeApiError } = await import('@/lib/api/trade-client')
      const tradeError = new TradeApiError('Rate limited', 429, '/api/trade')

      mockTradeApiClient.searchAndFetchItems.mockRejectedValue(tradeError)

      const request = new NextRequest('http://localhost/api/trade/search', {
        method: 'POST',
        body: JSON.stringify({
          league: 'Standard',
          itemName: 'Rate Limited Item',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Rate limited')
    })

    it('should handle authentication errors from trade API', async () => {
      vi.mocked(sessionManager.hasValidSession).mockReturnValue(true)
      mockTradeCache.getPriceData.mockResolvedValue(null)

      const { TradeApiError } = await import('@/lib/api/trade-client')
      const authError = new TradeApiError('Invalid session', 401, '/api/trade', true)

      mockTradeApiClient.searchAndFetchItems.mockRejectedValue(authError)

      const request = new NextRequest('http://localhost/api/trade/search', {
        method: 'POST',
        body: JSON.stringify({
          league: 'Standard',
          itemName: 'Auth Failed Item',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication failed')
    })

    it('should handle search requests with stats filters', async () => {
      vi.mocked(sessionManager.hasValidSession).mockReturnValue(true)
      mockTradeCache.getPriceData.mockResolvedValue(null)

      mockTradeApiClient.searchAndFetchItems.mockResolvedValue({ result: [] })
      mockPriceParser.parseTradeResponse.mockReturnValue({
        listings: [],
        totalFound: 0,
        priceRange: { min: 0, max: 0 },
        currency: 'chaos' as const,
        lastUpdated: new Date(),
      })

      const request = new NextRequest('http://localhost/api/trade/search', {
        method: 'POST',
        body: JSON.stringify({
          league: 'Standard',
          itemType: 'Body Armour',
          stats: [
            { id: 'explicit.stat_3299347043', min: 70 }, // Life
            { id: 'explicit.stat_4220027924', max: 150 }, // Energy Shield
          ],
          maxPrice: 100,
          currency: 'chaos',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockTradeApiClient.searchAndFetchItems).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            type: 'Body Armour',
            stats: expect.arrayContaining([
              expect.objectContaining({
                id: 'explicit.stat_3299347043',
                value: { min: 70 },
              }),
              expect.objectContaining({
                id: 'explicit.stat_4220027924',
                value: { max: 150 },
              }),
            ]),
            filters: expect.objectContaining({
              trade_filters: expect.objectContaining({
                filters: expect.objectContaining({
                  price: { max: 100 },
                }),
              }),
            }),
          }),
        }),
        20 // default maxResults
      )
    })
  })

  describe('GET', () => {
    it('should handle simple GET requests', async () => {
      vi.mocked(sessionManager.hasValidSession).mockReturnValue(true)
      mockTradeCache.getPriceData.mockResolvedValue(null)

      mockTradeApiClient.searchAndFetchItems.mockResolvedValue({ result: [] })
      mockPriceParser.parseTradeResponse.mockReturnValue({
        listings: [],
        totalFound: 0,
        priceRange: { min: 0, max: 0 },
        currency: 'chaos' as const,
        lastUpdated: new Date(),
      })

      const request = new NextRequest(
        'http://localhost/api/trade/search?league=Standard&itemName=Tabula Rasa&maxResults=5'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return error when missing required parameters', async () => {
      const request = new NextRequest('http://localhost/api/trade/search?league=Standard')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Missing parameters')
      expect(data.example).toBeDefined()
    })

    it('should handle GET request errors gracefully', async () => {
      vi.mocked(sessionManager.hasValidSession).mockReturnValue(true)
      mockTradeCache.getPriceData.mockResolvedValue(null)

      mockTradeApiClient.searchAndFetchItems.mockRejectedValue(new Error('Unexpected error'))

      const request = new NextRequest(
        'http://localhost/api/trade/search?league=Standard&itemName=Error Item'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })

  describe('request validation', () => {
    beforeEach(() => {
      vi.mocked(sessionManager.hasValidSession).mockReturnValue(true)
    })

    it('should apply default values for optional parameters', async () => {
      mockTradeCache.getPriceData.mockResolvedValue(null)
      mockTradeApiClient.searchAndFetchItems.mockResolvedValue({ result: [] })
      mockPriceParser.parseTradeResponse.mockReturnValue({
        listings: [],
        totalFound: 0,
        priceRange: { min: 0, max: 0 },
        currency: 'chaos' as const,
        lastUpdated: new Date(),
      })

      const request = new NextRequest('http://localhost/api/trade/search', {
        method: 'POST',
        body: JSON.stringify({
          league: 'Standard',
          itemName: 'Basic Item',
          // No optional parameters
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockTradeApiClient.searchAndFetchItems).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            name: 'Basic Item',
          }),
          sort: { price: 'asc' },
        }),
        20 // default maxResults
      )
    })

    it('should enforce maxResults limits', async () => {
      mockTradeCache.getPriceData.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/trade/search', {
        method: 'POST',
        body: JSON.stringify({
          league: 'Standard',
          itemName: 'Limited Item',
          maxResults: 150, // Exceeds limit of 100
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid request parameters')
    })

    it('should validate positive numbers for price filters', async () => {
      const request = new NextRequest('http://localhost/api/trade/search', {
        method: 'POST',
        body: JSON.stringify({
          league: 'Standard',
          itemName: 'Price Item',
          minPrice: -10, // Invalid negative price
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid request parameters')
    })
  })
})
