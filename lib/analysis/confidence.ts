import { DemandMetrics } from './demand';
import { TradeListing } from '../types/trade';
import { logger } from '../utils/logger';

export interface ConfidenceMetrics {
  overall: number; // 0-1 scale
  dataQuality: number;
  sampleSize: number;
  marketDepth: number;
  dataFreshness: number;
  priceConsistency: number;
  breakdown: {
    sampleSizeScore: number;
    marketDepthScore: number;
    freshnessScore: number;
    consistencyScore: number;
    qualityAdjustment: number;
  };
}

export interface ConfidenceOptions {
  minSampleSize?: number;
  minMarketDepth?: number;
  maxDataAgeHours?: number;
  priceVariationThreshold?: number;
}

const DEFAULT_OPTIONS: Required<ConfidenceOptions> = {
  minSampleSize: 50,
  minMarketDepth: 5,
  maxDataAgeHours: 24,
  priceVariationThreshold: 0.3 // 30% price variation threshold
};

/**
 * Calculates comprehensive confidence score for profit opportunities
 */
export function calculateConfidence(
  demandMetrics: DemandMetrics,
  listings: TradeListing[],
  options: ConfidenceOptions = {}
): ConfidenceMetrics {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  logger.debug(`Calculating confidence for ${demandMetrics.itemName}`, {
    sampleSize: demandMetrics.sampleSize,
    listingsCount: listings.length
  });

  // Calculate individual confidence components
  const sampleSizeScore = calculateSampleSizeConfidence(demandMetrics.sampleSize, opts.minSampleSize);
  const marketDepthScore = calculateMarketDepthConfidence(listings.length, opts.minMarketDepth);
  const freshnessScore = calculateDataFreshnessConfidence(listings, opts.maxDataAgeHours);
  const consistencyScore = calculatePriceConsistencyConfidence(listings, opts.priceVariationThreshold);
  const qualityAdjustment = calculateDataQualityAdjustment(demandMetrics, listings);

  // Weighted overall confidence score
  const weights = {
    sampleSize: 0.25,
    marketDepth: 0.20,
    freshness: 0.20,
    consistency: 0.25,
    quality: 0.10
  };

  const overall = Math.min(1.0, Math.max(0.0,
    (sampleSizeScore * weights.sampleSize) +
    (marketDepthScore * weights.marketDepth) +
    (freshnessScore * weights.freshness) +
    (consistencyScore * weights.consistency) +
    (qualityAdjustment * weights.quality)
  ));

  const confidence: ConfidenceMetrics = {
    overall: Math.round(overall * 1000) / 1000,
    dataQuality: Math.round(qualityAdjustment * 1000) / 1000,
    sampleSize: Math.round(sampleSizeScore * 1000) / 1000,
    marketDepth: Math.round(marketDepthScore * 1000) / 1000,
    dataFreshness: Math.round(freshnessScore * 1000) / 1000,
    priceConsistency: Math.round(consistencyScore * 1000) / 1000,
    breakdown: {
      sampleSizeScore,
      marketDepthScore,
      freshnessScore,
      consistencyScore,
      qualityAdjustment
    }
  };

  logger.debug(`Confidence calculated for ${demandMetrics.itemName}`, {
    overall: confidence.overall,
    components: confidence.breakdown
  });

  return confidence;
}

/**
 * Validates if opportunity meets minimum confidence thresholds
 */
export function validateConfidence(
  confidence: ConfidenceMetrics,
  thresholds: {
    minOverall?: number;
    minSampleSize?: number;
    minMarketDepth?: number;
    minFreshness?: number;
    minConsistency?: number;
  } = {}
): { isValid: boolean; reasons: string[] } {
  const {
    minOverall = 0.4,
    minSampleSize = 0.3,
    minMarketDepth = 0.3,
    minFreshness = 0.5,
    minConsistency = 0.4
  } = thresholds;

  const reasons: string[] = [];
  let isValid = true;

  if (confidence.overall < minOverall) {
    isValid = false;
    reasons.push(`Overall confidence too low (${confidence.overall.toFixed(2)} < ${minOverall})`);
  }

  if (confidence.sampleSize < minSampleSize) {
    isValid = false;
    reasons.push(`Sample size confidence too low (${confidence.sampleSize.toFixed(2)} < ${minSampleSize})`);
  }

  if (confidence.marketDepth < minMarketDepth) {
    isValid = false;
    reasons.push(`Market depth confidence too low (${confidence.marketDepth.toFixed(2)} < ${minMarketDepth})`);
  }

  if (confidence.dataFreshness < minFreshness) {
    isValid = false;
    reasons.push(`Data freshness confidence too low (${confidence.dataFreshness.toFixed(2)} < ${minFreshness})`);
  }

  if (confidence.priceConsistency < minConsistency) {
    isValid = false;
    reasons.push(`Price consistency confidence too low (${confidence.priceConsistency.toFixed(2)} < ${minConsistency})`);
  }

  return { isValid, reasons };
}

/**
 * Calculates confidence based on sample size of character data
 */
function calculateSampleSizeConfidence(sampleSize: number, minSampleSize: number): number {
  if (sampleSize < minSampleSize) {
    return Math.max(0.1, sampleSize / minSampleSize * 0.5);
  }

  // Diminishing returns after minimum threshold
  const excess = sampleSize - minSampleSize;
  const scaleFactor = 1000; // Scale for diminishing returns
  const confidenceBonus = excess / (excess + scaleFactor) * 0.5;

  return Math.min(1.0, 0.5 + confidenceBonus);
}

/**
 * Calculates confidence based on market depth (number of listings)
 */
function calculateMarketDepthConfidence(listingCount: number, minMarketDepth: number): number {
  if (listingCount === 0) return 0;
  if (listingCount < 2) return 0.2; // Very low confidence with <2 listings

  if (listingCount < minMarketDepth) {
    return 0.3 + (listingCount / minMarketDepth * 0.4);
  }

  // Diminishing returns after minimum threshold
  const excess = listingCount - minMarketDepth;
  const scaleFactor = 20; // Scale for diminishing returns
  const confidenceBonus = excess / (excess + scaleFactor) * 0.3;

  return Math.min(1.0, 0.7 + confidenceBonus);
}

/**
 * Calculates confidence based on data freshness
 */
function calculateDataFreshnessConfidence(listings: TradeListing[], maxDataAgeHours: number): number {
  if (listings.length === 0) return 0;

  const now = new Date();
  const maxAgeMs = maxDataAgeHours * 60 * 60 * 1000;

  let totalFreshnessScore = 0;
  let validListings = 0;

  for (const listing of listings) {
    const ageMs = now.getTime() - new Date(listing.indexed).getTime();

    if (ageMs < 0) {
      // Future timestamp - data error
      continue;
    }

    const ageFactor = Math.max(0, 1 - (ageMs / maxAgeMs));
    totalFreshnessScore += ageFactor;
    validListings++;
  }

  if (validListings === 0) return 0.1; // Very low confidence for invalid data

  const averageFreshness = totalFreshnessScore / validListings;
  return Math.max(0.1, averageFreshness);
}

/**
 * Calculates confidence based on price consistency across listings
 */
function calculatePriceConsistencyConfidence(
  listings: TradeListing[],
  variationThreshold: number
): number {
  if (listings.length < 2) return 0.5; // Neutral confidence with insufficient data

  // Convert all prices to chaos for comparison
  const chaosRates = { chaos: 1, divine: 200, exalted: 15, mirror: 300000 };
  const prices = listings.map(listing => {
    const rate = chaosRates[listing.price.currency as keyof typeof chaosRates] || 1;
    return listing.price.amount * rate;
  }).filter(price => price > 0);

  if (prices.length < 2) return 0.3;

  // Calculate coefficient of variation
  const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
  const standardDeviation = Math.sqrt(variance);
  const coefficientOfVariation = mean > 0 ? standardDeviation / mean : 1;

  // Convert to confidence score (lower variation = higher confidence)
  if (coefficientOfVariation <= variationThreshold) {
    const normalizedVariation = coefficientOfVariation / variationThreshold;
    return 1.0 - (normalizedVariation * 0.5); // High confidence for low variation
  } else {
    const excessVariation = coefficientOfVariation - variationThreshold;
    const penaltyFactor = Math.min(1.0, excessVariation / variationThreshold);
    return Math.max(0.1, 0.5 - (penaltyFactor * 0.4)); // Low confidence for high variation
  }
}

/**
 * Calculates data quality adjustment based on various factors
 */
function calculateDataQualityAdjustment(
  demandMetrics: DemandMetrics,
  listings: TradeListing[]
): number {
  let adjustment = 0.5; // Base quality score

  // Character level distribution quality
  const levelDistribution = demandMetrics.levelDistribution;
  const highLevelUsage = (levelDistribution['81-90'] || 0) + (levelDistribution['91+'] || 0);
  const totalUsage = Object.values(levelDistribution).reduce((sum, count) => sum + count, 0);

  if (totalUsage > 0 && highLevelUsage / totalUsage > 0.3) {
    adjustment += 0.2; // Bonus for high-level character data
  }

  // Class distribution diversity
  const classDistribution = demandMetrics.classDistribution;
  const uniqueClasses = Object.keys(classDistribution).length;
  if (uniqueClasses >= 5) {
    adjustment += 0.1; // Bonus for class diversity
  } else if (uniqueClasses <= 2) {
    adjustment -= 0.1; // Penalty for limited class diversity
  }

  // Usage count vs sample size ratio
  const usageRatio = demandMetrics.usageCount / demandMetrics.sampleSize;
  if (usageRatio > 0.1) {
    adjustment += 0.1; // Bonus for high usage ratio
  } else if (usageRatio < 0.01) {
    adjustment -= 0.1; // Penalty for very low usage ratio
  }

  // Listing data quality
  const validListings = listings.filter(listing =>
    listing.price.amount > 0 &&
    listing.item &&
    listing.seller &&
    !isNaN(new Date(listing.indexed).getTime())
  ).length;

  const listingQuality = listings.length > 0 ? validListings / listings.length : 0;
  adjustment += (listingQuality - 0.5) * 0.2; // Adjust based on listing data quality

  return Math.max(0, Math.min(1, adjustment));
}

/**
 * Provides confidence level description for UI display
 */
export function getConfidenceLevel(confidence: number): {
  level: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
  description: string;
  color: 'red' | 'orange' | 'yellow' | 'green' | 'blue';
} {
  if (confidence >= 0.8) {
    return {
      level: 'Very High',
      description: 'Excellent data quality and market conditions',
      color: 'blue'
    };
  } else if (confidence >= 0.6) {
    return {
      level: 'High',
      description: 'Good data quality with reliable market indicators',
      color: 'green'
    };
  } else if (confidence >= 0.4) {
    return {
      level: 'Medium',
      description: 'Moderate confidence with some data limitations',
      color: 'yellow'
    };
  } else if (confidence >= 0.2) {
    return {
      level: 'Low',
      description: 'Limited data quality or market depth',
      color: 'orange'
    };
  } else {
    return {
      level: 'Very Low',
      description: 'Poor data quality or insufficient market data',
      color: 'red'
    };
  }
}