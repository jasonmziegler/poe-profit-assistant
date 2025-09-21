import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs/promises'
import path from 'path'
import { TradeCache } from '@/lib/cache/trade-cache'
import { ParsedPriceData } from '@/lib/api/price-parser'
import { TradeSearchRequest } from '@/lib/types/trade'

// Mock fs module
vi.mock('fs/promises')

describe('TradeCache', () => {
  let tradeCache: TradeCache
  const mockCacheDir = '/test/cache/trade'

  beforeEach(() => {
    tradeCache = new TradeCache({
      cacheDir: mockCacheDir,
      cacheExpiryMinutes: 20,
      maxCacheEntries: 100,
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('generateCacheKey', () => {
    it('should generate consistent hash for same search request', () => {
      const league = 'Standard'
      const searchRequest: TradeSearchRequest = {
        query: { name: 'Test Item' },
        sort: { price: 'asc' },
      }

      const key1 = tradeCache.generateCacheKey(league, searchRequest)
      const key2 = tradeCache.generateCacheKey(league, searchRequest)

      expect(key1).toBe(key2)
      expect(key1).toHaveLength(64) // SHA-256 hex string
    })

    it('should generate different hashes for different search requests', () => {
      const league = 'Standard'
      const searchRequest1: TradeSearchRequest = {
        query: { name: 'Item 1' },
        sort: { price: 'asc' },
      }
      const searchRequest2: TradeSearchRequest = {
        query: { name: 'Item 2' },
        sort: { price: 'asc' },
      }

      const key1 = tradeCache.generateCacheKey(league, searchRequest1)
      const key2 = tradeCache.generateCacheKey(league, searchRequest2)

      expect(key1).not.toBe(key2)
    })

    it('should generate different hashes for different leagues', () => {
      const searchRequest: TradeSearchRequest = {
        query: { name: 'Test Item' },
        sort: { price: 'asc' },
      }

      const key1 = tradeCache.generateCacheKey('Standard', searchRequest)
      const key2 = tradeCache.generateCacheKey('Hardcore', searchRequest)

      expect(key1).not.toBe(key2)
    })
  })

  describe('storePriceData', () => {
    const mockLeague = 'Standard'
    const mockSearchRequest: TradeSearchRequest = {
      query: { name: 'Test Item' },
      sort: { price: 'asc' },
    }
    const mockPriceData: ParsedPriceData = {
      listings: [],
      totalFound: 5,
      averagePrice: 10,
      medianPrice: 12,
      priceRange: { min: 5, max: 20 },
      currency: 'chaos',
      lastUpdated: new Date('2024-01-01T00:00:00Z'),
    }

    beforeEach(() => {
      vi.mocked(fs.access).mockResolvedValue()
      vi.mocked(fs.writeFile).mockResolvedValue()
      vi.mocked(fs.readdir).mockResolvedValue([])
    })

    it('should store price data successfully', async () => {
      await tradeCache.storePriceData(mockLeague, mockSearchRequest, mockPriceData)

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/\/test\/cache\/trade\/trade_[a-f0-9]{16}\.json$/),
        expect.stringContaining('"league":"Standard"'),
        'utf-8'
      )
    })

    it('should create cache directory if it does not exist', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('Directory does not exist'))
      vi.mocked(fs.mkdir).mockResolvedValue(undefined)

      await tradeCache.storePriceData(mockLeague, mockSearchRequest, mockPriceData)

      expect(fs.mkdir).toHaveBeenCalledWith(mockCacheDir, { recursive: true })
      expect(fs.writeFile).toHaveBeenCalled()
    })

    it('should handle storage errors gracefully', async () => {
      vi.mocked(fs.access).mockResolvedValue()
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Write failed'))

      await expect(
        tradeCache.storePriceData(mockLeague, mockSearchRequest, mockPriceData)
      ).rejects.toThrow('Write failed')
    })
  })

  describe('getPriceData', () => {
    const mockLeague = 'Standard'
    const mockSearchRequest: TradeSearchRequest = {
      query: { name: 'Test Item' },
      sort: { price: 'asc' },
    }

    it('should return cached data when valid', async () => {
      const now = new Date()
      const futureExpiry = new Date(now.getTime() + 30 * 60 * 1000) // 30 minutes from now

      const cachedEntry = {
        searchHash: 'test_hash',
        league: mockLeague,
        searchRequest: mockSearchRequest,
        priceData: {
          listings: [],
          totalFound: 3,
          priceRange: { min: 5, max: 15 },
          currency: 'chaos',
          lastUpdated: now.toISOString(),
        },
        cachedAt: now.toISOString(),
        expiresAt: futureExpiry.toISOString(),
      }

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(cachedEntry))

      const result = await tradeCache.getPriceData(mockLeague, mockSearchRequest)

      expect(result).toBeDefined()
      expect(result?.totalFound).toBe(3)
    })

    it('should return null for expired cache entries', async () => {
      const now = new Date()
      const pastExpiry = new Date(now.getTime() - 30 * 60 * 1000) // 30 minutes ago

      const expiredEntry = {
        searchHash: 'test_hash',
        league: mockLeague,
        searchRequest: mockSearchRequest,
        priceData: {
          listings: [],
          totalFound: 3,
          priceRange: { min: 5, max: 15 },
          currency: 'chaos',
          lastUpdated: now.toISOString(),
        },
        cachedAt: now.toISOString(),
        expiresAt: pastExpiry.toISOString(),
      }

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(expiredEntry))

      const result = await tradeCache.getPriceData(mockLeague, mockSearchRequest)

      expect(result).toBeNull()
    })

    it('should return null when file does not exist', async () => {
      const notFoundError = new Error('File not found')
      ;(notFoundError as NodeJS.ErrnoException).code = 'ENOENT'
      vi.mocked(fs.readFile).mockRejectedValue(notFoundError)

      const result = await tradeCache.getPriceData(mockLeague, mockSearchRequest)

      expect(result).toBeNull()
    })

    it('should return null for invalid cached data', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('invalid json')

      const result = await tradeCache.getPriceData(mockLeague, mockSearchRequest)

      expect(result).toBeNull()
    })
  })

  describe('hasCachedData', () => {
    const mockLeague = 'Standard'
    const mockSearchRequest: TradeSearchRequest = {
      query: { name: 'Test Item' },
      sort: { price: 'asc' },
    }

    it('should return true when valid cached data exists', async () => {
      const now = new Date()
      const futureExpiry = new Date(now.getTime() + 30 * 60 * 1000)

      const cachedEntry = {
        searchHash: 'test_hash',
        league: mockLeague,
        searchRequest: mockSearchRequest,
        priceData: {
          listings: [],
          totalFound: 3,
          priceRange: { min: 5, max: 15 },
          currency: 'chaos',
          lastUpdated: now.toISOString(),
        },
        cachedAt: now.toISOString(),
        expiresAt: futureExpiry.toISOString(),
      }

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(cachedEntry))

      const result = await tradeCache.hasCachedData(mockLeague, mockSearchRequest)

      expect(result).toBe(true)
    })

    it('should return false when no cached data exists', async () => {
      const notFoundError = new Error('File not found')
      ;(notFoundError as NodeJS.ErrnoException).code = 'ENOENT'
      vi.mocked(fs.readFile).mockRejectedValue(notFoundError)

      const result = await tradeCache.hasCachedData(mockLeague, mockSearchRequest)

      expect(result).toBe(false)
    })
  })

  describe('cleanupOldEntries', () => {
    beforeEach(() => {
      vi.mocked(fs.access).mockResolvedValue()
    })

    it('should remove expired entries', async () => {
      const now = new Date()
      const pastExpiry = new Date(now.getTime() - 60 * 60 * 1000) // 1 hour ago

      vi.mocked(fs.readdir).mockResolvedValue(['expired.json', 'valid.json'] as any)
      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(
          JSON.stringify({
            expiresAt: pastExpiry.toISOString(),
            searchHash: 'expired',
          })
        )
        .mockResolvedValueOnce(
          JSON.stringify({
            expiresAt: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
            searchHash: 'valid',
          })
        )

      vi.mocked(fs.stat).mockResolvedValue({
        mtime: now,
      } as any)

      vi.mocked(fs.unlink).mockResolvedValue()

      await tradeCache.cleanupOldEntries()

      expect(fs.unlink).toHaveBeenCalledWith(path.join(mockCacheDir, 'expired.json'))
      expect(fs.unlink).toHaveBeenCalledTimes(1)
    })

    it('should remove oldest entries when exceeding max cache entries', async () => {
      const cache = new TradeCache({
        maxCacheEntries: 2,
        cacheDir: mockCacheDir,
      })

      const now = new Date()
      const futureExpiry = new Date(now.getTime() + 60 * 60 * 1000)

      vi.mocked(fs.readdir).mockResolvedValue(['old.json', 'newer.json', 'newest.json'] as any)

      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify({
          expiresAt: futureExpiry.toISOString(),
          searchHash: 'valid',
        })
      )

      // Mock different modification times
      vi.mocked(fs.stat)
        .mockResolvedValueOnce({ mtime: new Date(now.getTime() - 3000) } as any)
        .mockResolvedValueOnce({ mtime: new Date(now.getTime() - 2000) } as any)
        .mockResolvedValueOnce({ mtime: new Date(now.getTime() - 1000) } as any)

      vi.mocked(fs.unlink).mockResolvedValue()

      await cache.cleanupOldEntries()

      // Should remove the oldest file
      expect(fs.unlink).toHaveBeenCalledWith(path.join(mockCacheDir, 'old.json'))
      expect(fs.unlink).toHaveBeenCalledTimes(1)
    })

    it('should handle cleanup errors gracefully', async () => {
      vi.mocked(fs.readdir).mockRejectedValue(new Error('Read directory failed'))

      // Should not throw
      await expect(tradeCache.cleanupOldEntries()).resolves.not.toThrow()
    })
  })

  describe('getCacheInfo', () => {
    it('should return cache statistics', async () => {
      const now = new Date()

      vi.mocked(fs.access).mockResolvedValue()
      vi.mocked(fs.readdir).mockResolvedValue(['file1.json', 'file2.json'] as any)
      vi.mocked(fs.stat)
        .mockResolvedValueOnce({ size: 1000, mtime: new Date(now.getTime() - 2000) } as any)
        .mockResolvedValueOnce({ size: 1500, mtime: new Date(now.getTime() - 1000) } as any)

      const result = await tradeCache.getCacheInfo()

      expect(result).toEqual({
        totalEntries: 2,
        totalSizeBytes: 2500,
        oldestEntry: new Date(now.getTime() - 2000),
        newestEntry: new Date(now.getTime() - 1000),
      })
    })

    it('should handle empty cache directory', async () => {
      vi.mocked(fs.access).mockResolvedValue()
      vi.mocked(fs.readdir).mockResolvedValue([] as any)

      const result = await tradeCache.getCacheInfo()

      expect(result).toEqual({
        totalEntries: 0,
        totalSizeBytes: 0,
      })
    })

    it('should handle cache access errors', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('Access denied'))

      const result = await tradeCache.getCacheInfo()

      expect(result).toEqual({
        totalEntries: 0,
        totalSizeBytes: 0,
      })
    })
  })

  describe('clearCache', () => {
    it('should remove all cache files', async () => {
      vi.mocked(fs.access).mockResolvedValue()
      vi.mocked(fs.readdir).mockResolvedValue([
        'file1.json',
        'file2.json',
        'not_json.txt', // Should be ignored
      ] as any)
      vi.mocked(fs.unlink).mockResolvedValue()

      await tradeCache.clearCache()

      expect(fs.unlink).toHaveBeenCalledTimes(2)
      expect(fs.unlink).toHaveBeenCalledWith(path.join(mockCacheDir, 'file1.json'))
      expect(fs.unlink).toHaveBeenCalledWith(path.join(mockCacheDir, 'file2.json'))
    })

    it('should handle clear cache errors', async () => {
      vi.mocked(fs.access).mockResolvedValue()
      vi.mocked(fs.readdir).mockRejectedValue(new Error('Read failed'))

      await expect(tradeCache.clearCache()).rejects.toThrow('Read failed')
    })
  })
})
