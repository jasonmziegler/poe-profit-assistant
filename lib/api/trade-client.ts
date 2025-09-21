import {
  TradeSearchRequest,
  TradeSearchResponse,
  TradeFetchResponse,
  TRADE_API_BASE_URL,
} from '../types/trade'
import { sessionManager } from '../utils/session'
import { ApiLogger, ApiCallMetrics } from '../utils/logger'

export class TradeApiError extends Error {
  public statusCode: number
  public endpoint: string
  public isAuthError: boolean

  constructor(message: string, statusCode: number, endpoint: string, isAuthError: boolean = false) {
    super(message)
    this.name = 'TradeApiError'
    this.statusCode = statusCode
    this.endpoint = endpoint
    this.isAuthError = isAuthError
  }
}

export interface TradeClientOptions {
  league: string
  retryAttempts?: number
  retryDelay?: number
  timeout?: number
}

const DEFAULT_OPTIONS: Required<Omit<TradeClientOptions, 'league'>> = {
  retryAttempts: 3,
  retryDelay: 1000,
  timeout: 10000,
}

export class TradeApiClient {
  private readonly league: string
  private readonly options: Required<TradeClientOptions>

  constructor(options: TradeClientOptions) {
    this.league = options.league
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  /**
   * Search for items matching the given criteria
   */
  async searchItems(searchRequest: TradeSearchRequest): Promise<TradeSearchResponse> {
    const endpoint = `${TRADE_API_BASE_URL}/search/${this.league}`

    const response = await this.makeApiCall(endpoint, 'POST', JSON.stringify(searchRequest), {
      'Content-Type': 'application/json',
    })

    if (!response.ok) {
      throw new TradeApiError(
        `Search request failed: ${response.statusText}`,
        response.status,
        endpoint,
        response.status === 401 || response.status === 403
      )
    }

    const data: TradeSearchResponse = await response.json()
    return data
  }

  /**
   * Fetch detailed information for specific trade listings
   */
  async fetchListings(searchId: string, listingIds: string[]): Promise<TradeFetchResponse> {
    // Limit to 10 listings per request (trade API limit)
    const limitedIds = listingIds.slice(0, 10)
    const idsParam = limitedIds.join(',')
    const endpoint = `${TRADE_API_BASE_URL}/fetch/${idsParam}?query=${searchId}`

    const response = await this.makeApiCall(endpoint, 'GET')

    if (!response.ok) {
      throw new TradeApiError(
        `Fetch listings failed: ${response.statusText}`,
        response.status,
        endpoint,
        response.status === 401 || response.status === 403
      )
    }

    const data: TradeFetchResponse = await response.json()
    return data
  }

  /**
   * Search and fetch items in a single operation with automatic pagination
   */
  async searchAndFetchItems(
    searchRequest: TradeSearchRequest,
    maxResults: number = 20
  ): Promise<TradeFetchResponse> {
    const startTime = performance.now()

    try {
      // Step 1: Search for items
      const searchResponse = await this.searchItems(searchRequest)

      if (searchResponse.result.length === 0) {
        return { result: [] }
      }

      // Step 2: Fetch listings (limited by maxResults)
      const listingIds = searchResponse.result.slice(0, maxResults)
      const fetchResponse = await this.fetchListings(searchResponse.id, listingIds)

      const duration = performance.now() - startTime
      ApiLogger.logApiCall({
        endpoint: 'trade/search+fetch',
        method: 'POST+GET',
        duration: Math.round(duration),
        statusCode: 200,
        retryCount: 0,
      })

      return fetchResponse
    } catch (error) {
      const duration = performance.now() - startTime

      if (error instanceof TradeApiError) {
        ApiLogger.logApiFailure(error.endpoint, error.statusCode, error.message)
      } else {
        ApiLogger.logError('TradeApiClient.searchAndFetchItems', error as Error, {
          league: this.league,
          maxResults,
          duration: Math.round(duration),
        })
      }

      throw error
    }
  }

  /**
   * Validate that we have a valid session for trade API access
   */
  public validateSession(): void {
    if (!sessionManager.hasValidSession()) {
      throw new TradeApiError(
        'No valid POESESSID found. Please provide a valid session token.',
        401,
        'session_validation',
        true
      )
    }
  }

  /**
   * Make authenticated API call with retry logic and error handling
   */
  private async makeApiCall(
    url: string,
    method: 'GET' | 'POST',
    body?: string,
    additionalHeaders: Record<string, string> = {}
  ): Promise<Response> {
    this.validateSession()

    const session = sessionManager.getSession()
    if (!session) {
      throw new TradeApiError(
        'Session validation passed but session retrieval failed',
        401,
        url,
        true
      )
    }

    const headers: Record<string, string> = {
      Cookie: `POESESSID=${session}`,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ...additionalHeaders,
    }

    let lastError: Error | null = null
    const startTime = performance.now()

    for (let attempt = 0; attempt < this.options.retryAttempts; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.options.timeout)

        const response = await fetch(url, {
          method,
          headers,
          body,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        const duration = performance.now() - startTime
        const metrics: ApiCallMetrics = {
          endpoint: url,
          method,
          duration: Math.round(duration),
          statusCode: response.status,
          retryCount: attempt,
        }

        // Extract rate limit info if available
        const rateLimitHeader = response.headers.get('X-Rate-Limit-Remaining')
        if (rateLimitHeader) {
          metrics.rateLimitRemaining = parseInt(rateLimitHeader, 10)
        }

        ApiLogger.logApiCall(metrics)

        // Don't retry on authentication errors
        if (response.status === 401 || response.status === 403) {
          throw new TradeApiError(
            'Authentication failed. Please check your POESESSID.',
            response.status,
            url,
            true
          )
        }

        // Don't retry on client errors (except rate limiting)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          return response
        }

        // Return successful responses
        if (response.ok) {
          return response
        }

        // Rate limiting - wait and retry
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After')
          const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : this.options.retryDelay

          ApiLogger.logRateLimit(url, metrics.rateLimitRemaining || 0, waitTime)

          if (attempt < this.options.retryAttempts - 1) {
            await this.sleep(waitTime)
            continue
          }
        }

        // Server errors - retry with exponential backoff
        if (response.status >= 500 && attempt < this.options.retryAttempts - 1) {
          const backoffDelay = this.options.retryDelay * Math.pow(2, attempt)
          await this.sleep(backoffDelay)
          continue
        }

        return response
      } catch (error) {
        lastError = error as Error

        // Don't retry on network timeouts for the last attempt
        if (attempt === this.options.retryAttempts - 1) {
          break
        }

        // Exponential backoff for retries
        const backoffDelay = this.options.retryDelay * Math.pow(2, attempt)
        await this.sleep(backoffDelay)
      }
    }

    // If we get here, all retries failed
    ApiLogger.logApiFailure(url, 0, lastError?.message || 'All retry attempts failed')

    throw new TradeApiError(
      `Trade API request failed after ${this.options.retryAttempts} attempts: ${lastError?.message}`,
      0,
      url
    )
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
