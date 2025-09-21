import fs from 'fs/promises'
import path from 'path'
import { z } from 'zod'
import crypto from 'crypto'
import { ParsedPriceData } from '../api/price-parser'
import { TradeSearchRequest } from '../types/trade'
import { ApiLogger } from '../utils/logger'

const TradeCacheEntrySchema = z.object({
  searchHash: z.string(),
  league: z.string(),
  searchRequest: z.object({
    query: z.record(z.any()),
    sort: z.object({
      price: z.enum(['asc', 'desc']),
    }),
  }),
  priceData: z.object({
    listings: z.array(z.any()), // Full TradeListing validation would be complex
    totalFound: z.number(),
    averagePrice: z.number().optional(),
    medianPrice: z.number().optional(),
    priceRange: z.object({
      min: z.number(),
      max: z.number(),
    }),
    currency: z.literal('chaos'),
    lastUpdated: z.string().transform((str) => new Date(str)),
  }),
  cachedAt: z.string().transform((str) => new Date(str)),
  expiresAt: z.string().transform((str) => new Date(str)),
})

export interface TradeCacheEntry {
  searchHash: string
  league: string
  searchRequest: TradeSearchRequest
  priceData: ParsedPriceData
  cachedAt: Date
  expiresAt: Date
}

export interface TradeCacheOptions {
  cacheExpiryMinutes?: number
  maxCacheEntries?: number
  cacheDir?: string
}

const DEFAULT_OPTIONS: Required<TradeCacheOptions> = {
  cacheExpiryMinutes: 20, // 20 minutes for price data
  maxCacheEntries: 500, // More entries than character cache
  cacheDir: 'data/cache/trade',
}

export class TradeCache {
  private readonly options: Required<TradeCacheOptions>
  private readonly cacheDir: string

  constructor(options: TradeCacheOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
    this.cacheDir = path.resolve(this.options.cacheDir)
  }

  /**
   * Generate cache key based on search criteria
   */
  public generateCacheKey(league: string, searchRequest: TradeSearchRequest): string {
    // Create a deterministic hash of the search parameters
    const searchData = {
      league,
      query: this.normalizeQuery(searchRequest.query),
      sort: searchRequest.sort,
    }

    const searchString = JSON.stringify(searchData, Object.keys(searchData).sort())
    return crypto.createHash('sha256').update(searchString).digest('hex')
  }

  /**
   * Store trade data in cache
   */
  async storePriceData(
    league: string,
    searchRequest: TradeSearchRequest,
    priceData: ParsedPriceData
  ): Promise<void> {
    try {
      await this.ensureCacheDir()

      const searchHash = this.generateCacheKey(league, searchRequest)
      const now = new Date()
      const expiresAt = new Date(now.getTime() + this.options.cacheExpiryMinutes * 60 * 1000)

      const cacheEntry: TradeCacheEntry = {
        searchHash,
        league,
        searchRequest,
        priceData,
        cachedAt: now,
        expiresAt,
      }

      const filename = this.generateFilename(searchHash)
      const filepath = path.join(this.cacheDir, filename)

      await fs.writeFile(filepath, JSON.stringify(cacheEntry, null, 2), 'utf-8')

      ApiLogger.logCacheOperation('write', {
        context: 'trade_price_cache',
        league,
        search_hash: searchHash,
        expires_at: expiresAt.toISOString(),
        listings_count: priceData.listings.length,
      })

      // Clean up old entries after storing new data
      await this.cleanupOldEntries()
    } catch (error) {
      ApiLogger.logError('TradeCache.storePriceData', error as Error, {
        league,
        context: 'cache_write_failed',
      })
      throw error
    }
  }

  /**
   * Retrieve trade data from cache if available and valid
   */
  async getPriceData(
    league: string,
    searchRequest: TradeSearchRequest
  ): Promise<ParsedPriceData | null> {
    try {
      const searchHash = this.generateCacheKey(league, searchRequest)
      const filename = this.generateFilename(searchHash)
      const filepath = path.join(this.cacheDir, filename)

      const fileContent = await fs.readFile(filepath, 'utf-8')
      const rawData = JSON.parse(fileContent)

      // Validate the cached data structure
      const cacheEntry = TradeCacheEntrySchema.parse(rawData)

      // Check if cache entry has expired
      if (this.isCacheExpired(cacheEntry.cachedAt, cacheEntry.expiresAt)) {
        ApiLogger.logCacheOperation('info_request', {
          context: 'trade_cache_expired',
          search_hash: searchHash,
          cached_at: cacheEntry.cachedAt.toISOString(),
          expires_at: cacheEntry.expiresAt.toISOString(),
        })
        return null
      }

      ApiLogger.logCacheOperation('read', {
        context: 'trade_price_cache_hit',
        league,
        search_hash: searchHash,
        cached_at: cacheEntry.cachedAt.toISOString(),
        listings_count: cacheEntry.priceData.listings.length,
      })

      return cacheEntry.priceData
    } catch (error) {
      // File doesn't exist or is invalid - not an error condition
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null
      }

      ApiLogger.logError('TradeCache.getPriceData', error as Error, {
        league,
        context: 'cache_read_failed',
      })
      return null
    }
  }

  /**
   * Check if price data exists in cache for given search
   */
  async hasCachedData(league: string, searchRequest: TradeSearchRequest): Promise<boolean> {
    const data = await this.getPriceData(league, searchRequest)
    return data !== null
  }

  /**
   * Remove expired cache entries and maintain size limits
   */
  async cleanupOldEntries(): Promise<void> {
    try {
      await this.ensureCacheDir()

      const files = await fs.readdir(this.cacheDir)
      const cacheFiles = files.filter((file) => file.endsWith('.json'))

      if (cacheFiles.length === 0) {
        return
      }

      const fileStats = await Promise.all(
        cacheFiles.map(async (file) => {
          const filepath = path.join(this.cacheDir, file)
          try {
            const content = await fs.readFile(filepath, 'utf-8')
            const data = JSON.parse(content)
            const stats = await fs.stat(filepath)

            return {
              file,
              filepath,
              mtime: stats.mtime,
              expiresAt: new Date(data.expiresAt),
              searchHash: data.searchHash,
            }
          } catch {
            // Invalid file - mark for deletion
            return {
              file,
              filepath,
              mtime: new Date(0),
              expiresAt: new Date(0),
              searchHash: 'invalid',
            }
          }
        })
      )

      const now = new Date()
      const expiredFiles = fileStats.filter((stat) => stat.expiresAt <= now)

      // Remove expired files
      if (expiredFiles.length > 0) {
        await Promise.all(expiredFiles.map(({ filepath }) => fs.unlink(filepath)))

        ApiLogger.logCacheOperation('cleanup', {
          context: 'trade_cache_expired_cleanup',
          removed_count: expiredFiles.length,
        })
      }

      // Remove oldest files if we exceed maxCacheEntries
      const remainingFiles = fileStats
        .filter((stat) => stat.expiresAt > now)
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())

      if (remainingFiles.length > this.options.maxCacheEntries) {
        const filesToDelete = remainingFiles.slice(this.options.maxCacheEntries)
        await Promise.all(filesToDelete.map(({ filepath }) => fs.unlink(filepath)))

        ApiLogger.logCacheOperation('cleanup', {
          context: 'trade_cache_size_limit_cleanup',
          removed_count: filesToDelete.length,
          max_entries: this.options.maxCacheEntries,
        })
      }
    } catch (error) {
      ApiLogger.logError('TradeCache.cleanupOldEntries', error as Error, {
        context: 'cache_cleanup_failed',
      })
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheInfo(): Promise<{
    totalEntries: number
    totalSizeBytes: number
    oldestEntry?: Date
    newestEntry?: Date
  }> {
    try {
      await this.ensureCacheDir()

      const files = await fs.readdir(this.cacheDir)
      const cacheFiles = files.filter((file) => file.endsWith('.json'))

      if (cacheFiles.length === 0) {
        return { totalEntries: 0, totalSizeBytes: 0 }
      }

      const fileStats = await Promise.all(
        cacheFiles.map(async (file) => {
          const filepath = path.join(this.cacheDir, file)
          const stats = await fs.stat(filepath)
          return { size: stats.size, mtime: stats.mtime }
        })
      )

      const totalSizeBytes = fileStats.reduce((total, stat) => total + stat.size, 0)
      const mtimes = fileStats.map((stat) => stat.mtime)

      return {
        totalEntries: cacheFiles.length,
        totalSizeBytes,
        oldestEntry:
          mtimes.length > 0 ? new Date(Math.min(...mtimes.map((d) => d.getTime()))) : undefined,
        newestEntry:
          mtimes.length > 0 ? new Date(Math.max(...mtimes.map((d) => d.getTime()))) : undefined,
      }
    } catch {
      return { totalEntries: 0, totalSizeBytes: 0 }
    }
  }

  /**
   * Clear all cache entries
   */
  async clearCache(): Promise<void> {
    try {
      await this.ensureCacheDir()

      const files = await fs.readdir(this.cacheDir)
      const cacheFiles = files.filter((file) => file.endsWith('.json'))

      await Promise.all(cacheFiles.map((file) => fs.unlink(path.join(this.cacheDir, file))))

      ApiLogger.logCacheOperation('cleanup', {
        context: 'trade_cache_cleared',
        removed_count: cacheFiles.length,
      })
    } catch (error) {
      ApiLogger.logError('TradeCache.clearCache', error as Error)
      throw error
    }
  }

  private async ensureCacheDir(): Promise<void> {
    try {
      await fs.access(this.cacheDir)
    } catch {
      await fs.mkdir(this.cacheDir, { recursive: true })
    }
  }

  private generateFilename(searchHash: string): string {
    return `trade_${searchHash.slice(0, 16)}.json`
  }

  private isCacheExpired(cachedAt: Date, expiresAt: Date): boolean {
    const now = new Date()
    return now >= expiresAt
  }

  /**
   * Normalize query object for consistent hashing
   */
  private normalizeQuery(query: any): any {
    if (typeof query !== 'object' || query === null) {
      return query
    }

    if (Array.isArray(query)) {
      return query.map((item) => this.normalizeQuery(item))
    }

    const normalized: any = {}
    for (const key of Object.keys(query).sort()) {
      normalized[key] = this.normalizeQuery(query[key])
    }

    return normalized
  }
}

// Export singleton instance for application use
export const tradeCache = new TradeCache()
