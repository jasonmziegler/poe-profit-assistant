import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateConfidence,
  validateConfidence,
  getConfidenceLevel,
  ConfidenceMetrics
} from '../../../lib/analysis/confidence';
import { DemandMetrics } from '../../../lib/analysis/demand';
import { TradeListing } from '../../../lib/types/trade';
import { Item } from '../../../lib/types/character';

// Mock logger
vi.mock('../../../lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn()
  }
}));

describe('Confidence Analysis', () => {
  let testItem: Item;
  let testDemandMetrics: DemandMetrics;
  let testListings: TradeListing[];

  beforeEach(() => {
    testItem = {
      id: 'item1',
      name: 'Test Item',
      baseType: 'Test Base',
      itemLevel: 75,
      rarity: 'Unique',
      category: 'armour',
      sockets: { total: 6, links: 6, colors: 'RRGGBB' },
      mods: ['Test mod'],
      corrupted: false,
      identified: true
    };

    testDemandMetrics = {
      id: 'test_metrics',
      itemName: 'Test Item',
      itemCategory: 'armour',
      usageCount: 200,
      usagePercentage: 40,
      averageLevel: 85,
      levelDistribution: {
        '81-90': 120,
        '91+': 80
      },
      classDistribution: {
        'Marauder': 80,
        'Duelist': 60,
        'Witch': 60
      },
      trendDirection: 'stable',
      popularBuilds: ['Build1', 'Build2'],
      lastUpdated: new Date(),
      sampleSize: 500
    };

    testListings = [
      {
        id: 'listing1',
        item: testItem,
        price: { amount: 100, currency: 'chaos' },
        seller: 'Seller1',
        listed: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
        whisper: 'test',
        indexed: new Date(Date.now() - 1000 * 60 * 25), // 25 min ago
        league: 'Standard'
      },
      {
        id: 'listing2',
        item: testItem,
        price: { amount: 105, currency: 'chaos' },
        seller: 'Seller2',
        listed: new Date(Date.now() - 1000 * 60 * 45),
        whisper: 'test',
        indexed: new Date(Date.now() - 1000 * 60 * 40),
        league: 'Standard'
      },
      {
        id: 'listing3',
        item: testItem,
        price: { amount: 95, currency: 'chaos' },
        seller: 'Seller3',
        listed: new Date(Date.now() - 1000 * 60 * 60),
        whisper: 'test',
        indexed: new Date(Date.now() - 1000 * 60 * 55),
        league: 'Standard'
      }
    ];
  });

  describe('calculateConfidence', () => {
    it('should calculate overall confidence correctly', () => {
      const confidence = calculateConfidence(testDemandMetrics, testListings);

      expect(confidence.overall).toBeGreaterThan(0);
      expect(confidence.overall).toBeLessThanOrEqual(1);
      expect(typeof confidence.overall).toBe('number');
    });

    it('should calculate individual confidence components', () => {
      const confidence = calculateConfidence(testDemandMetrics, testListings);

      expect(confidence.sampleSize).toBeGreaterThan(0);
      expect(confidence.sampleSize).toBeLessThanOrEqual(1);

      expect(confidence.marketDepth).toBeGreaterThan(0);
      expect(confidence.marketDepth).toBeLessThanOrEqual(1);

      expect(confidence.dataFreshness).toBeGreaterThan(0);
      expect(confidence.dataFreshness).toBeLessThanOrEqual(1);

      expect(confidence.priceConsistency).toBeGreaterThan(0);
      expect(confidence.priceConsistency).toBeLessThanOrEqual(1);

      expect(confidence.dataQuality).toBeGreaterThan(0);
      expect(confidence.dataQuality).toBeLessThanOrEqual(1);
    });

    it('should include detailed breakdown', () => {
      const confidence = calculateConfidence(testDemandMetrics, testListings);

      expect(confidence.breakdown).toBeDefined();
      expect(confidence.breakdown.sampleSizeScore).toBeDefined();
      expect(confidence.breakdown.marketDepthScore).toBeDefined();
      expect(confidence.breakdown.freshnessScore).toBeDefined();
      expect(confidence.breakdown.consistencyScore).toBeDefined();
      expect(confidence.breakdown.qualityAdjustment).toBeDefined();
    });

    it('should handle large sample sizes correctly', () => {
      const largeMetrics = {
        ...testDemandMetrics,
        sampleSize: 2000
      };

      const confidence = calculateConfidence(largeMetrics, testListings);
      expect(confidence.sampleSize).toBeGreaterThan(0.7); // Should be high for large sample
    });

    it('should handle small sample sizes correctly', () => {
      const smallMetrics = {
        ...testDemandMetrics,
        sampleSize: 25 // Below minimum threshold
      };

      const confidence = calculateConfidence(smallMetrics, testListings);
      expect(confidence.sampleSize).toBeLessThan(0.5); // Should be low for small sample
    });

    it('should handle many trade listings correctly', () => {
      const manyListings = Array.from({ length: 20 }, (_, i) => ({
        ...testListings[0],
        id: `listing_${i}`,
        price: { amount: 100 + i, currency: 'chaos' as const }
      }));

      const confidence = calculateConfidence(testDemandMetrics, manyListings);
      expect(confidence.marketDepth).toBeGreaterThan(0.7); // Should be high for many listings
    });

    it('should handle few trade listings correctly', () => {
      const fewListings = testListings.slice(0, 1); // Only 1 listing

      const confidence = calculateConfidence(testDemandMetrics, fewListings);
      expect(confidence.marketDepth).toBeLessThan(0.5); // Should be low for few listings
    });

    it('should handle fresh data correctly', () => {
      const freshListings = testListings.map(listing => ({
        ...listing,
        indexed: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
      }));

      const confidence = calculateConfidence(testDemandMetrics, freshListings);
      expect(confidence.dataFreshness).toBeGreaterThan(0.8); // Should be high for fresh data
    });

    it('should handle stale data correctly', () => {
      const staleListings = testListings.map(listing => ({
        ...listing,
        indexed: new Date(Date.now() - 1000 * 60 * 60 * 25) // 25 hours ago
      }));

      const confidence = calculateConfidence(testDemandMetrics, staleListings);
      expect(confidence.dataFreshness).toBeLessThan(0.3); // Should be low for stale data
    });

    it('should handle consistent pricing correctly', () => {
      const consistentListings = testListings.map((listing, i) => ({
        ...listing,
        price: { amount: 100, currency: 'chaos' as const } // All same price
      }));

      const confidence = calculateConfidence(testDemandMetrics, consistentListings);
      expect(confidence.priceConsistency).toBeGreaterThan(0.8); // Should be high for consistent prices
    });

    it('should handle inconsistent pricing correctly', () => {
      const inconsistentListings = [
        { ...testListings[0], price: { amount: 50, currency: 'chaos' as const } },
        { ...testListings[1], price: { amount: 200, currency: 'chaos' as const } },
        { ...testListings[2], price: { amount: 300, currency: 'chaos' as const } }
      ];

      const confidence = calculateConfidence(testDemandMetrics, inconsistentListings);
      expect(confidence.priceConsistency).toBeLessThan(0.5); // Should be low for inconsistent prices
    });

    it('should apply custom options correctly', () => {
      const customOptions = {
        minSampleSize: 1000,
        minMarketDepth: 10,
        maxDataAgeHours: 12,
        priceVariationThreshold: 0.1
      };

      const confidence = calculateConfidence(testDemandMetrics, testListings, customOptions);

      // Should still return valid confidence metrics
      expect(confidence.overall).toBeGreaterThan(0);
      expect(confidence.overall).toBeLessThanOrEqual(1);
    });
  });

  describe('validateConfidence', () => {
    let testConfidence: ConfidenceMetrics;

    beforeEach(() => {
      testConfidence = {
        overall: 0.7,
        dataQuality: 0.6,
        sampleSize: 0.8,
        marketDepth: 0.7,
        dataFreshness: 0.9,
        priceConsistency: 0.5,
        breakdown: {
          sampleSizeScore: 0.8,
          marketDepthScore: 0.7,
          freshnessScore: 0.9,
          consistencyScore: 0.5,
          qualityAdjustment: 0.6
        }
      };
    });

    it('should validate passing confidence correctly', () => {
      const result = validateConfidence(testConfidence);

      expect(result.isValid).toBe(true);
      expect(result.reasons).toHaveLength(0);
    });

    it('should validate failing overall confidence', () => {
      const lowConfidence = {
        ...testConfidence,
        overall: 0.2 // Below default threshold of 0.4
      };

      const result = validateConfidence(lowConfidence);

      expect(result.isValid).toBe(false);
      expect(result.reasons).toContain(expect.stringContaining('Overall confidence too low'));
    });

    it('should validate failing sample size confidence', () => {
      const lowSampleSize = {
        ...testConfidence,
        sampleSize: 0.1 // Below default threshold of 0.3
      };

      const result = validateConfidence(lowSampleSize);

      expect(result.isValid).toBe(false);
      expect(result.reasons).toContain(expect.stringContaining('Sample size confidence too low'));
    });

    it('should validate failing market depth confidence', () => {
      const lowMarketDepth = {
        ...testConfidence,
        marketDepth: 0.2 // Below default threshold of 0.3
      };

      const result = validateConfidence(lowMarketDepth);

      expect(result.isValid).toBe(false);
      expect(result.reasons).toContain(expect.stringContaining('Market depth confidence too low'));
    });

    it('should validate failing data freshness', () => {
      const staleData = {
        ...testConfidence,
        dataFreshness: 0.3 // Below default threshold of 0.5
      };

      const result = validateConfidence(staleData);

      expect(result.isValid).toBe(false);
      expect(result.reasons).toContain(expect.stringContaining('Data freshness confidence too low'));
    });

    it('should validate failing price consistency', () => {
      const inconsistentPrices = {
        ...testConfidence,
        priceConsistency: 0.2 // Below default threshold of 0.4
      };

      const result = validateConfidence(inconsistentPrices);

      expect(result.isValid).toBe(false);
      expect(result.reasons).toContain(expect.stringContaining('Price consistency confidence too low'));
    });

    it('should apply custom thresholds correctly', () => {
      const customThresholds = {
        minOverall: 0.8,
        minSampleSize: 0.9,
        minMarketDepth: 0.8,
        minFreshness: 0.95,
        minConsistency: 0.6
      };

      const result = validateConfidence(testConfidence, customThresholds);

      // Should fail multiple thresholds with high requirements
      expect(result.isValid).toBe(false);
      expect(result.reasons.length).toBeGreaterThan(1);
    });

    it('should collect multiple validation failures', () => {
      const poorConfidence = {
        ...testConfidence,
        overall: 0.1,
        sampleSize: 0.1,
        marketDepth: 0.1,
        dataFreshness: 0.1,
        priceConsistency: 0.1
      };

      const result = validateConfidence(poorConfidence);

      expect(result.isValid).toBe(false);
      expect(result.reasons.length).toBe(5); // All thresholds should fail
    });
  });

  describe('getConfidenceLevel', () => {
    it('should return Very High for excellent confidence', () => {
      const level = getConfidenceLevel(0.9);

      expect(level.level).toBe('Very High');
      expect(level.color).toBe('blue');
      expect(level.description).toContain('Excellent');
    });

    it('should return High for good confidence', () => {
      const level = getConfidenceLevel(0.7);

      expect(level.level).toBe('High');
      expect(level.color).toBe('green');
      expect(level.description).toContain('Good');
    });

    it('should return Medium for moderate confidence', () => {
      const level = getConfidenceLevel(0.5);

      expect(level.level).toBe('Medium');
      expect(level.color).toBe('yellow');
      expect(level.description).toContain('Moderate');
    });

    it('should return Low for limited confidence', () => {
      const level = getConfidenceLevel(0.3);

      expect(level.level).toBe('Low');
      expect(level.color).toBe('orange');
      expect(level.description).toContain('Limited');
    });

    it('should return Very Low for poor confidence', () => {
      const level = getConfidenceLevel(0.1);

      expect(level.level).toBe('Very Low');
      expect(level.color).toBe('red');
      expect(level.description).toContain('Poor');
    });

    it('should handle boundary values correctly', () => {
      expect(getConfidenceLevel(0.8).level).toBe('Very High');
      expect(getConfidenceLevel(0.799).level).toBe('High');
      expect(getConfidenceLevel(0.6).level).toBe('High');
      expect(getConfidenceLevel(0.599).level).toBe('Medium');
      expect(getConfidenceLevel(0.4).level).toBe('Medium');
      expect(getConfidenceLevel(0.399).level).toBe('Low');
      expect(getConfidenceLevel(0.2).level).toBe('Low');
      expect(getConfidenceLevel(0.199).level).toBe('Very Low');
    });

    it('should handle edge values correctly', () => {
      expect(getConfidenceLevel(0).level).toBe('Very Low');
      expect(getConfidenceLevel(1).level).toBe('Very High');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty listings gracefully', () => {
      const confidence = calculateConfidence(testDemandMetrics, []);

      expect(confidence.overall).toBeGreaterThan(0);
      expect(confidence.marketDepth).toBe(0); // Should be 0 for no listings
      expect(confidence.dataFreshness).toBe(0); // Should be 0 for no data
      expect(confidence.priceConsistency).toBe(0.5); // Neutral for no data
    });

    it('should handle single listing correctly', () => {
      const singleListing = [testListings[0]];
      const confidence = calculateConfidence(testDemandMetrics, singleListing);

      expect(confidence.overall).toBeGreaterThan(0);
      expect(confidence.marketDepth).toBeLessThan(0.5); // Should be low for single listing
      expect(confidence.priceConsistency).toBe(0.5); // Neutral for single price
    });

    it('should handle invalid listing data gracefully', () => {
      const invalidListings = [
        {
          ...testListings[0],
          indexed: new Date('invalid date')
        },
        {
          ...testListings[1],
          price: { amount: -10, currency: 'chaos' as const }
        }
      ];

      expect(() => {
        calculateConfidence(testDemandMetrics, invalidListings);
      }).not.toThrow();
    });

    it('should handle extreme demand metrics', () => {
      const extremeMetrics = {
        ...testDemandMetrics,
        sampleSize: 0,
        usageCount: 0,
        levelDistribution: {},
        classDistribution: {}
      };

      const confidence = calculateConfidence(extremeMetrics, testListings);

      expect(confidence.overall).toBeGreaterThanOrEqual(0);
      expect(confidence.overall).toBeLessThanOrEqual(1);
    });

    it('should handle future timestamps in listings', () => {
      const futureListings = testListings.map(listing => ({
        ...listing,
        indexed: new Date(Date.now() + 1000 * 60 * 60) // 1 hour in future
      }));

      const confidence = calculateConfidence(testDemandMetrics, futureListings);

      // Should handle gracefully and give low freshness score
      expect(confidence.dataFreshness).toBeLessThan(0.5);
    });

    it('should handle mixed currency listings in price consistency', () => {
      const mixedCurrencyListings = [
        { ...testListings[0], price: { amount: 100, currency: 'chaos' as const } },
        { ...testListings[1], price: { amount: 0.5, currency: 'divine' as const } },
        { ...testListings[2], price: { amount: 7, currency: 'exalted' as const } }
      ];

      const confidence = calculateConfidence(testDemandMetrics, mixedCurrencyListings);

      // Should convert currencies and calculate consistency
      expect(confidence.priceConsistency).toBeGreaterThan(0);
      expect(confidence.priceConsistency).toBeLessThanOrEqual(1);
    });
  });
});