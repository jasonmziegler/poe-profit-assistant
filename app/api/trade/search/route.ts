import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { TradeApiClient, TradeApiError } from '@/lib/api/trade-client'
import { PriceParser, ParsedPriceData } from '@/lib/api/price-parser'
import { tradeCache } from '@/lib/cache/trade-cache'
import { TradeSearchRequest } from '@/lib/types/trade'
import { ApiLogger } from '@/lib/utils/logger'
import { sessionManager } from '@/lib/utils/session'

// Request validation schema
const TradeSearchRequestSchema = z.object({
  league: z.string().min(1, 'League is required'),
  itemName: z.string().optional(),
  itemType: z.string().optional(),
  maxResults: z.number().min(1).max(100).default(20),
  maxPrice: z.number().positive().optional(),
  minPrice: z.number().positive().optional(),
  currency: z.enum(['chaos', 'divine', 'exalted', 'mirror']).default('chaos'),
  stats: z
    .array(
      z.object({
        id: z.string(),
        min: z.number().optional(),
        max: z.number().optional(),
      })
    )
    .optional(),
  useCache: z.boolean().default(true),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = performance.now()

  try {
    // Validate request body
    const body = await request.json()
    const validatedRequest = TradeSearchRequestSchema.parse(body)

    const {
      league,
      itemName,
      itemType,
      maxResults,
      maxPrice,
      minPrice,
      currency,
      stats,
      useCache,
    } = validatedRequest

    // Check if user has valid session
    if (!sessionManager.hasValidSession()) {
      ApiLogger.logApiFailure('/api/trade/search', 401, 'No valid POESESSID found')
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          details: 'Valid POESESSID required for trade API access. Please configure your session.',
        },
        { status: 401 }
      )
    }

    // Build trade search request
    const searchRequest: TradeSearchRequest = {
      query: {
        ...(itemName && { name: itemName }),
        ...(itemType && { type: itemType }),
        ...(stats &&
          stats.length > 0 && {
            stats: stats.map((stat) => ({
              id: stat.id,
              value: {
                ...(stat.min !== undefined && { min: stat.min }),
                ...(stat.max !== undefined && { max: stat.max }),
              },
            })),
          }),
        ...((maxPrice || minPrice) && {
          filters: {
            trade_filters: {
              filters: {
                price: {
                  ...(minPrice && { min: minPrice }),
                  ...(maxPrice && { max: maxPrice }),
                },
              },
            },
          },
        }),
      },
      sort: {
        price: 'asc', // Always sort by price ascending for best deals first
      },
    }

    let priceData: ParsedPriceData

    // Check cache first if enabled
    if (useCache) {
      const cachedData = await tradeCache.getPriceData(league, searchRequest)
      if (cachedData) {
        priceData = cachedData

        const duration = performance.now() - startTime
        ApiLogger.logApiCall({
          endpoint: '/api/trade/search',
          method: 'POST',
          duration: Math.round(duration),
          statusCode: 200,
        })

        return NextResponse.json({
          success: true,
          message: `Retrieved ${priceData.totalFound} trade listings from cache for ${league} league`,
          data: {
            priceData,
            meta: {
              league,
              searchParams: {
                itemName,
                itemType,
                maxResults,
                maxPrice,
                minPrice,
                currency,
              },
              fromCache: true,
              cacheExpiry: 20, // minutes
            },
          },
        })
      }
    }

    // Fetch fresh data from trade API
    const tradeClient = new TradeApiClient({ league })

    try {
      const tradeResponse = await tradeClient.searchAndFetchItems(searchRequest, maxResults)
      priceData = PriceParser.parseTradeResponse(tradeResponse, league)

      // Store in cache for future requests
      if (useCache && priceData.listings.length > 0) {
        await tradeCache.storePriceData(league, searchRequest, priceData)
      }

      const duration = performance.now() - startTime
      ApiLogger.logApiCall({
        endpoint: '/api/trade/search',
        method: 'POST',
        duration: Math.round(duration),
        statusCode: 200,
      })

      return NextResponse.json({
        success: true,
        message: `Found ${priceData.totalFound} trade listings for ${league} league`,
        data: {
          priceData,
          meta: {
            league,
            searchParams: {
              itemName,
              itemType,
              maxResults,
              maxPrice,
              minPrice,
              currency,
            },
            fromCache: false,
            cacheExpiry: 20, // minutes
          },
        },
      })
    } catch (error) {
      if (error instanceof TradeApiError) {
        if (error.isAuthError) {
          ApiLogger.logApiFailure('/api/trade/search', error.statusCode, error.message)
          return NextResponse.json(
            {
              success: false,
              error: 'Authentication failed',
              details: 'Invalid or expired POESESSID. Please update your session token.',
            },
            { status: 401 }
          )
        }

        if (error.statusCode === 429) {
          ApiLogger.logRateLimit('/api/trade/search', 0)
          return NextResponse.json(
            {
              success: false,
              error: 'Rate limited',
              details: 'Trade API rate limit exceeded. Please try again later.',
            },
            { status: 429 }
          )
        }

        ApiLogger.logApiFailure('/api/trade/search', error.statusCode, error.message)
        return NextResponse.json(
          {
            success: false,
            error: 'Trade API error',
            details: error.message,
          },
          { status: error.statusCode >= 500 ? 500 : 400 }
        )
      }

      throw error // Re-throw unexpected errors
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      ApiLogger.logValidationFailure('/api/trade/search', 'Request validation failed', error.errors)
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request parameters',
          details: error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join('; '),
        },
        { status: 400 }
      )
    }

    ApiLogger.logError('trade_search_failure', error as Error, {
      endpoint: '/api/trade/search',
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: 'Failed to process trade search request',
      },
      { status: 500 }
    )
  }
}

// Manual testing endpoint - GET method for simple item lookups
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = performance.now()

  try {
    const { searchParams } = new URL(request.url)

    const league = searchParams.get('league') || 'Standard'
    const itemName = searchParams.get('itemName')
    const itemType = searchParams.get('itemType')
    const maxResults = Math.min(parseInt(searchParams.get('maxResults') || '10', 10), 100)

    if (!itemName && !itemType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing parameters',
          details: 'Either itemName or itemType parameter is required',
          example: '/api/trade/search?league=Standard&itemName=Tabula Rasa&maxResults=5',
        },
        { status: 400 }
      )
    }

    // Check if user has valid session
    if (!sessionManager.hasValidSession()) {
      ApiLogger.logApiFailure('/api/trade/search', 401, 'No valid POESESSID found')
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          details: 'Valid POESESSID required for trade API access. Please configure your session.',
        },
        { status: 401 }
      )
    }

    // Build trade search request from GET parameters
    const searchRequest: TradeSearchRequest = {
      query: {
        ...(itemName && { name: itemName }),
        ...(itemType && { type: itemType }),
      },
      sort: {
        price: 'asc',
      },
    }

    // Check cache first
    const cachedData = await tradeCache.getPriceData(league, searchRequest)
    if (cachedData) {
      const duration = performance.now() - startTime
      ApiLogger.logApiCall({
        endpoint: '/api/trade/search',
        method: 'GET',
        duration: Math.round(duration),
        statusCode: 200,
      })

      return NextResponse.json({
        success: true,
        message: `Retrieved ${cachedData.totalFound} trade listings from cache for ${league} league`,
        data: {
          priceData: cachedData,
          meta: {
            league,
            searchParams: { itemName, itemType, maxResults },
            fromCache: true,
            cacheExpiry: 20,
          },
        },
      })
    }

    // Fetch fresh data from trade API
    const tradeClient = new TradeApiClient({ league })
    const tradeResponse = await tradeClient.searchAndFetchItems(searchRequest, maxResults)
    const priceData = PriceParser.parseTradeResponse(tradeResponse, league)

    // Store in cache
    await tradeCache.storePriceData(league, searchRequest, priceData)

    const duration = performance.now() - startTime
    ApiLogger.logApiCall({
      endpoint: '/api/trade/search',
      method: 'GET',
      duration: Math.round(duration),
      statusCode: 200,
    })

    return NextResponse.json({
      success: true,
      message: `Found ${priceData.totalFound} trade listings for ${league} league`,
      data: {
        priceData,
        meta: {
          league,
          searchParams: { itemName, itemType, maxResults },
          fromCache: false,
          cacheExpiry: 20,
        },
      },
    })
  } catch (error) {
    if (error instanceof TradeApiError) {
      if (error.isAuthError) {
        ApiLogger.logApiFailure('/api/trade/search', error.statusCode, error.message)
        return NextResponse.json(
          {
            success: false,
            error: 'Authentication failed',
            details: 'Invalid or expired POESESSID. Please update your session token.',
          },
          { status: 401 }
        )
      }

      if (error.statusCode === 429) {
        ApiLogger.logRateLimit('/api/trade/search', 0)
        return NextResponse.json(
          {
            success: false,
            error: 'Rate limited',
            details: 'Trade API rate limit exceeded. Please try again later.',
          },
          { status: 429 }
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Trade API error',
          details: error.message,
        },
        { status: error.statusCode >= 500 ? 500 : 400 }
      )
    }

    ApiLogger.logError('trade_search_get_failure', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process GET request',
        details: (error as Error).message,
      },
      { status: 500 }
    )
  }
}
