import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '../../../lib/utils/logger';
import { calculateDemandScore, normalizeDemandByCategory } from '../../../lib/analysis/demand';
import { calculateProfit, rankOpportunities, filterOpportunities } from '../../../lib/analysis/profit';
import { calculateConfidence, validateConfidence } from '../../../lib/analysis/confidence';
import { getDB } from '../../../lib/db/queries';
import { Character } from '../../../lib/types/character';
import { TradeListing } from '../../../lib/types/trade';
import fs from 'fs/promises';
import path from 'path';

// Validation schemas
const AnalyzeRequestSchema = z.object({
  league: z.string().optional(),
  categories: z.array(z.string()).optional(),
  minProfitMargin: z.number().min(0).optional(),
  minProfitPercentage: z.number().min(0).optional(),
  minConfidence: z.number().min(0).max(1).optional(),
  maxResults: z.number().min(1).max(100).optional(),
  forceRefresh: z.boolean().optional()
});

const MIN_OPPORTUNITIES_DAILY = 10;
const DEFAULT_MAX_RESULTS = 50;
const CACHE_EXPIRY_MINUTES = 30;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    logger.info('Starting profit analysis', { timestamp: new Date().toISOString() });

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    // Convert string parameters to appropriate types
    const params = {
      ...rawParams,
      minProfitMargin: rawParams.minProfitMargin ? parseFloat(rawParams.minProfitMargin) : undefined,
      minProfitPercentage: rawParams.minProfitPercentage ? parseFloat(rawParams.minProfitPercentage) : undefined,
      minConfidence: rawParams.minConfidence ? parseFloat(rawParams.minConfidence) : undefined,
      maxResults: rawParams.maxResults ? parseInt(rawParams.maxResults) : undefined,
      forceRefresh: rawParams.forceRefresh === 'true',
      categories: rawParams.categories ? rawParams.categories.split(',') : undefined
    };

    const validatedParams = AnalyzeRequestSchema.parse(params);
    logger.info('Analysis parameters validated', validatedParams);

    // Check for cached results (if not forcing refresh)
    if (!validatedParams.forceRefresh) {
      const cachedResult = await getCachedAnalysis();
      if (cachedResult) {
        logger.info('Returning cached analysis results');
        return NextResponse.json(cachedResult);
      }
    }

    // Load character data
    logger.info('Loading character data');
    const characters = await loadCharacterData(validatedParams.league);

    if (characters.length === 0) {
      return NextResponse.json({
        error: 'No character data available for analysis',
        code: 'NO_CHARACTER_DATA'
      }, { status: 400 });
    }

    // Load trade listings data
    logger.info('Loading trade listings data');
    const tradeListings = await loadTradeListingsData();

    // Perform demand analysis
    logger.info('Calculating demand scores');
    const demandMetrics = calculateDemandScore(characters, {
      excludeCategories: ['currency', 'gem'] // Focus on tradeable items
    });

    // Normalize demand scores by category
    const normalizedDemand = normalizeDemandByCategory(demandMetrics);

    // Calculate profit opportunities
    logger.info('Calculating profit opportunities');
    const profitOpportunities = calculateProfit(normalizedDemand, tradeListings, {
      minProfitMargin: validatedParams.minProfitMargin,
      minProfitPercentage: validatedParams.minProfitPercentage,
      minConfidence: validatedParams.minConfidence
    });

    // Enhance opportunities with detailed confidence scoring
    logger.info('Calculating detailed confidence scores');
    const enhancedOpportunities = [];

    for (const opportunity of profitOpportunities) {
      const itemKey = `${opportunity.item.name}|${opportunity.item.baseType}`;
      const metrics = normalizedDemand.get(itemKey);

      if (metrics) {
        const confidenceMetrics = calculateConfidence(metrics, opportunity.listings);
        const validation = validateConfidence(confidenceMetrics);

        if (validation.isValid) {
          enhancedOpportunities.push({
            ...opportunity,
            confidence: confidenceMetrics.overall,
            confidenceBreakdown: confidenceMetrics.breakdown,
            validationReasons: validation.reasons
          });
        }
      }
    }

    // Rank and filter opportunities
    const rankedOpportunities = rankOpportunities(enhancedOpportunities);
    const filteredOpportunities = filterOpportunities(rankedOpportunities, {
      categories: validatedParams.categories,
      minConfidence: validatedParams.minConfidence || 0.3,
      minUsageCount: 5
    });

    // Limit results
    const maxResults = validatedParams.maxResults || DEFAULT_MAX_RESULTS;
    const finalOpportunities = filteredOpportunities.slice(0, maxResults);

    // Validate minimum opportunities requirement
    if (finalOpportunities.length < MIN_OPPORTUNITIES_DAILY) {
      logger.warn(`Only found ${finalOpportunities.length} opportunities, below target of ${MIN_OPPORTUNITIES_DAILY}`);
    }

    // Prepare analysis metadata
    const analysisMetadata = {
      totalCharacters: characters.length,
      totalItems: demandMetrics.size,
      totalOpportunities: profitOpportunities.length,
      filteredOpportunities: finalOpportunities.length,
      analysisTime: Date.now() - startTime,
      parameters: validatedParams,
      dataFreshness: {
        charactersLastUpdated: getDataFreshness('characters'),
        tradeListingsLastUpdated: getDataFreshness('trade')
      }
    };

    const result = {
      success: true,
      opportunities: finalOpportunities,
      metadata: analysisMetadata,
      timestamp: new Date().toISOString()
    };

    // Save opportunities and demand metrics to database
    try {
      const db = getDB();

      // Save demand metrics
      logger.info('Saving demand metrics to database');
      db.saveDemandMetricsBatch(normalizedDemand);

      // Save opportunities
      logger.info('Saving opportunities to database');
      db.saveOpportunities(finalOpportunities);

      // Clean up expired opportunities
      const deletedCount = db.deleteExpiredOpportunities();
      logger.info(`Cleaned up ${deletedCount} expired opportunities`);

    } catch (dbError) {
      logger.error('Database operations failed', {
        error: dbError instanceof Error ? dbError.message : 'Unknown database error'
      });
      // Continue execution - database failure shouldn't prevent API response
    }

    // Cache the result
    await cacheAnalysisResult(result);

    logger.info('Analysis completed successfully', {
      opportunitiesFound: finalOpportunities.length,
      analysisTimeMs: analysisMetadata.analysisTime
    });

    return NextResponse.json(result);

  } catch (error) {
    logger.error('Analysis failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request parameters',
        details: error.errors,
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      code: 'ANALYSIS_ERROR'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const validatedParams = AnalyzeRequestSchema.parse(body);

    logger.info('Manual analysis trigger received', validatedParams);

    // Redirect to GET with parameters
    const searchParams = new URLSearchParams();
    Object.entries(validatedParams).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.set(key, value.toString());
      }
    });

    const getRequest = new NextRequest(
      `${request.nextUrl.origin}/api/analyze?${searchParams.toString()}`,
      { method: 'GET' }
    );

    return await GET(getRequest);

  } catch (error) {
    logger.error('Manual analysis trigger failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request body',
        details: error.errors,
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Manual trigger failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      code: 'TRIGGER_ERROR'
    }, { status: 500 });
  }
}

async function loadCharacterData(league?: string): Promise<Character[]> {
  try {
    const cacheDir = path.resolve('data/cache');
    const files = await fs.readdir(cacheDir);
    const characterFiles = files.filter(file => file.startsWith('characters_') && file.endsWith('.json'));

    const characters: Character[] = [];

    for (const file of characterFiles) {
      try {
        const filePath = path.join(cacheDir, file);
        const data = await fs.readFile(filePath, 'utf-8');
        const fileCharacters = JSON.parse(data) as Character[];

        // Filter by league if specified
        const filteredCharacters = league
          ? fileCharacters.filter(char => char.league === league)
          : fileCharacters;

        characters.push(...filteredCharacters);
      } catch (error) {
        logger.warn(`Failed to load character file ${file}`, {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logger.info(`Loaded ${characters.length} characters from cache`);
    return characters;

  } catch (error) {
    logger.error('Failed to load character data', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return [];
  }
}

async function loadTradeListingsData(): Promise<Map<string, TradeListing[]>> {
  try {
    const cacheDir = path.resolve('data/cache');
    const files = await fs.readdir(cacheDir);
    const tradeFiles = files.filter(file => file.startsWith('trade_') && file.endsWith('.json'));

    const tradeListings = new Map<string, TradeListing[]>();

    for (const file of tradeFiles) {
      try {
        const filePath = path.join(cacheDir, file);
        const data = await fs.readFile(filePath, 'utf-8');
        const listings = JSON.parse(data) as TradeListing[];

        // Group by item key
        for (const listing of listings) {
          const itemKey = `${listing.item.name}|${listing.item.baseType}`;
          if (!tradeListings.has(itemKey)) {
            tradeListings.set(itemKey, []);
          }
          tradeListings.get(itemKey)!.push(listing);
        }
      } catch (error) {
        logger.warn(`Failed to load trade file ${file}`, {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logger.info(`Loaded trade listings for ${tradeListings.size} unique items`);
    return tradeListings;

  } catch (error) {
    logger.error('Failed to load trade listings data', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return new Map();
  }
}

async function getCachedAnalysis(): Promise<any | null> {
  try {
    const cacheFile = path.resolve('data/cache/analysis_result.json');
    const stats = await fs.stat(cacheFile);
    const cacheAge = Date.now() - stats.mtime.getTime();

    if (cacheAge > CACHE_EXPIRY_MINUTES * 60 * 1000) {
      return null; // Cache expired
    }

    const data = await fs.readFile(cacheFile, 'utf-8');
    return JSON.parse(data);

  } catch (error) {
    return null; // No cache or error reading cache
  }
}

async function cacheAnalysisResult(result: any): Promise<void> {
  try {
    const cacheFile = path.resolve('data/cache/analysis_result.json');
    await fs.writeFile(cacheFile, JSON.stringify(result, null, 2));
    logger.info('Analysis result cached successfully');
  } catch (error) {
    logger.warn('Failed to cache analysis result', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function getDataFreshness(): Date | null {
  // TODO: Implement actual data freshness tracking
  // For now, return current timestamp as placeholder
  return new Date();
}