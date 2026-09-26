import { Item } from '../types/character';
import { TradeListing, CURRENCIES } from '../types/trade';
import { DemandMetrics } from './demand';
import { logger } from '../utils/logger';

export interface ProfitOpportunity {
  id: string;
  item: Item;
  buyPrice: number; // in chaos orb equivalents
  estimatedSellPrice: number; // in chaos orb equivalents
  profitMargin: number; // absolute profit in chaos
  profitPercentage: number; // percentage profit
  confidence: number; // 0-1 scale
  demandScore: number; // normalized demand metric
  popularityRank?: number;
  usageCount: number;
  reasoning: string;
  listings: TradeListing[];
  createdAt: Date;
  expiresAt: Date;
}

export interface ProfitAnalysisOptions {
  minProfitMargin?: number;
  minProfitPercentage?: number;
  maxBuyPrice?: number;
  minConfidence?: number;
  currencyRates?: CurrencyRates;
}

export interface CurrencyRates {
  chaos: number;
  divine: number;
  exalted: number;
  mirror: number;
}

const DEFAULT_CURRENCY_RATES: CurrencyRates = {
  chaos: 1,
  divine: 200, // 1 divine = ~200 chaos (approximate)
  exalted: 15,  // 1 exalted = ~15 chaos (approximate)
  mirror: 300000 // 1 mirror = ~300k chaos (approximate)
};

const MIN_PROFIT_MARGIN = 5; // chaos orbs
const MIN_PROFIT_PERCENTAGE = 20; // 20%
const MAX_BUY_PRICE = 1000; // chaos orbs
const MIN_CONFIDENCE = 0.3;
const OPPORTUNITY_EXPIRY_HOURS = 24;

/**
 * Calculates profit opportunities by comparing demand vs market prices
 */
export function calculateProfit(
  demandMetrics: Map<string, DemandMetrics>,
  tradeListings: Map<string, TradeListing[]>,
  options: ProfitAnalysisOptions = {}
): ProfitOpportunity[] {
  const {
    minProfitMargin = MIN_PROFIT_MARGIN,
    minProfitPercentage = MIN_PROFIT_PERCENTAGE,
    maxBuyPrice = MAX_BUY_PRICE,
    minConfidence = MIN_CONFIDENCE,
    currencyRates = DEFAULT_CURRENCY_RATES
  } = options;

  logger.info('Starting profit analysis', {
    demandMetricsCount: demandMetrics.size,
    tradeListingsCount: tradeListings.size
  });

  const opportunities: ProfitOpportunity[] = [];

  for (const [itemKey, metrics] of demandMetrics) {
    const listings = tradeListings.get(itemKey) || [];
    if (listings.length === 0) continue;

    // Sort listings by price (ascending)
    const sortedListings = [...listings].sort((a, b) =>
      convertToChaos(a.price.amount, a.price.currency, currencyRates) -
      convertToChaos(b.price.amount, b.price.currency, currencyRates)
    );

    // Get lowest market price
    const lowestListing = sortedListings[0];
    const buyPrice = convertToChaos(lowestListing.price.amount, lowestListing.price.currency, currencyRates);

    if (buyPrice > maxBuyPrice) continue;

    // Estimate sell price based on demand
    const estimatedSellPrice = estimateSellPrice(metrics, buyPrice);
    const profitMargin = estimatedSellPrice - buyPrice;
    const profitPercentage = (profitMargin / buyPrice) * 100;

    // Check if opportunity meets thresholds
    if (profitMargin < minProfitMargin || profitPercentage < minProfitPercentage) {
      continue;
    }

    // Basic confidence calculation (will be refined by confidence module)
    const confidence = calculateBasicConfidence(metrics, listings);
    if (confidence < minConfidence) continue;

    const opportunity: ProfitOpportunity = {
      id: generateOpportunityId(itemKey),
      item: listings[0].item, // Use item from first listing
      buyPrice,
      estimatedSellPrice,
      profitMargin: Math.round(profitMargin * 100) / 100,
      profitPercentage: Math.round(profitPercentage * 100) / 100,
      confidence,
      demandScore: metrics.usagePercentage,
      usageCount: metrics.usageCount,
      reasoning: generateReasoning(metrics, profitMargin, profitPercentage),
      listings: sortedListings.slice(0, 5), // Top 5 cheapest listings
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + OPPORTUNITY_EXPIRY_HOURS * 60 * 60 * 1000)
    };

    opportunities.push(opportunity);
  }

  logger.info(`Generated ${opportunities.length} profit opportunities`);
  return opportunities;
}

/**
 * Estimates sell price based on demand metrics and market data
 */
export function estimateSellPrice(
  metrics: DemandMetrics,
  buyPrice: number
): number {
  // Base multiplier based on usage percentage
  let multiplier = 1.0;

  if (metrics.usagePercentage > 50) {
    multiplier = 2.5; // Very high demand
  } else if (metrics.usagePercentage > 25) {
    multiplier = 2.0; // High demand
  } else if (metrics.usagePercentage > 10) {
    multiplier = 1.7; // Medium demand
  } else if (metrics.usagePercentage > 5) {
    multiplier = 1.4; // Low-medium demand
  } else {
    multiplier = 1.2; // Low demand
  }

  // Adjust based on sample size confidence
  const sampleSizeBonus = Math.min(metrics.sampleSize / 1000, 0.2);
  multiplier += sampleSizeBonus;

  // Adjust based on level distribution (higher level = more valuable)
  const highLevelUsage = (metrics.levelDistribution['81-90'] || 0) + (metrics.levelDistribution['91+'] || 0);
  if (highLevelUsage > metrics.usageCount * 0.5) {
    multiplier += 0.3; // High level content bonus
  }

  return Math.round(buyPrice * multiplier * 100) / 100;
}

/**
 * Ranks opportunities by multiple criteria with weighted scoring
 */
export function rankOpportunities(
  opportunities: ProfitOpportunity[],
  weights: {
    profitMargin?: number;
    profitPercentage?: number;
    demandScore?: number;
    confidence?: number;
  } = {}
): ProfitOpportunity[] {
  const {
    profitMargin = 0.3,
    profitPercentage = 0.25,
    demandScore = 0.25,
    confidence = 0.2
  } = weights;

  // Normalize values for scoring
  const maxProfitMargin = Math.max(...opportunities.map(o => o.profitMargin));
  const maxProfitPercentage = Math.max(...opportunities.map(o => o.profitPercentage));
  const maxDemandScore = Math.max(...opportunities.map(o => o.demandScore));

  const scoredOpportunities = opportunities.map(opp => {
    const normalizedProfitMargin = opp.profitMargin / maxProfitMargin;
    const normalizedProfitPercentage = opp.profitPercentage / maxProfitPercentage;
    const normalizedDemandScore = opp.demandScore / maxDemandScore;

    const weightedScore =
      (normalizedProfitMargin * profitMargin) +
      (normalizedProfitPercentage * profitPercentage) +
      (normalizedDemandScore * demandScore) +
      (opp.confidence * confidence);

    return {
      ...opp,
      score: Math.round(weightedScore * 1000) / 1000
    };
  });

  // Sort by weighted score (descending)
  const ranked = scoredOpportunities.sort((a, b) => (b as any).score - (a as any).score);

  // Add popularity rank
  ranked.forEach((opp, index) => {
    opp.popularityRank = index + 1;
  });

  logger.info(`Ranked ${ranked.length} opportunities by weighted score`);
  return ranked;
}

/**
 * Filters opportunities based on various criteria
 */
export function filterOpportunities(
  opportunities: ProfitOpportunity[],
  filters: {
    minConfidence?: number;
    minDemandScore?: number;
    categories?: string[];
    maxBuyPrice?: number;
    minUsageCount?: number;
  } = {}
): ProfitOpportunity[] {
  const {
    minConfidence = 0,
    minDemandScore = 0,
    categories,
    maxBuyPrice = Infinity,
    minUsageCount = 0
  } = filters;

  return opportunities.filter(opp => {
    if (opp.confidence < minConfidence) return false;
    if (opp.demandScore < minDemandScore) return false;
    if (opp.buyPrice > maxBuyPrice) return false;
    if (opp.usageCount < minUsageCount) return false;
    if (categories && !categories.includes(opp.item.category)) return false;
    return true;
  });
}

/**
 * Converts various currencies to chaos orb equivalents
 */
function convertToChaos(amount: number, currency: string, rates: CurrencyRates): number {
  switch (currency) {
    case CURRENCIES.chaos:
      return amount;
    case CURRENCIES.divine:
      return amount * rates.divine;
    case CURRENCIES.exalted:
      return amount * rates.exalted;
    case CURRENCIES.mirror:
      return amount * rates.mirror;
    default:
      logger.warn(`Unknown currency: ${currency}, treating as chaos`);
      return amount;
  }
}

/**
 * Basic confidence calculation - will be enhanced by confidence module
 */
function calculateBasicConfidence(metrics: DemandMetrics, listings: TradeListing[]): number {
  let confidence = 0.5; // Base confidence

  // Sample size factor
  if (metrics.sampleSize >= 1000) confidence += 0.3;
  else if (metrics.sampleSize >= 500) confidence += 0.2;
  else if (metrics.sampleSize >= 100) confidence += 0.1;

  // Listings availability factor
  if (listings.length >= 10) confidence += 0.2;
  else if (listings.length >= 5) confidence += 0.1;
  else if (listings.length < 2) confidence -= 0.3;

  return Math.max(0, Math.min(1, confidence));
}

function generateReasoning(
  metrics: DemandMetrics,
  profitMargin: number,
  profitPercentage: number
): string {
  const reasons: string[] = [];

  if (metrics.usagePercentage > 25) {
    reasons.push(`High popularity (${metrics.usagePercentage.toFixed(1)}% usage)`);
  } else if (metrics.usagePercentage > 10) {
    reasons.push(`Moderate popularity (${metrics.usagePercentage.toFixed(1)}% usage)`);
  }

  if (profitMargin >= 50) {
    reasons.push(`Excellent profit margin (${profitMargin.toFixed(1)} chaos)`);
  } else if (profitMargin >= 20) {
    reasons.push(`Good profit margin (${profitMargin.toFixed(1)} chaos)`);
  }

  if (profitPercentage >= 50) {
    reasons.push(`High ROI (${profitPercentage.toFixed(1)}%)`);
  }

  if (metrics.usageCount >= 100) {
    reasons.push(`Strong sample size (${metrics.usageCount} characters)`);
  }

  return reasons.join(', ') || 'Basic profit opportunity';
}

function generateOpportunityId(itemKey: string): string {
  const timestamp = Date.now().toString(36);
  const itemHash = itemKey.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8);
  return `${itemHash}_${timestamp}`;
}