import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateProfit,
  estimateSellPrice,
  rankOpportunities,
  filterOpportunities,
  ProfitOpportunity,
  CurrencyRates
} from '../../../lib/analysis/profit';
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

describe('Profit Analysis', () => {
  let testItem: Item;
  let testDemandMetrics: Map<string, DemandMetrics>;
  let testTradeListings: Map<string, TradeListing[]>;
  let testCurrencyRates: CurrencyRates;

  beforeEach(() => {
    testItem = {
      id: 'item1',
      name: 'Belly of the Beast',
      baseType: 'Full Wyrmscale',
      itemLevel: 72,
      rarity: 'Unique',
      category: 'armour',
      sockets: { total: 6, links: 5, colors: 'RRGGBB' },
      mods: ['40% increased Life'],
      corrupted: false,
      identified: true
    };

    const demandMetrics: DemandMetrics = {
      id: 'belly_metrics',
      itemName: 'Belly of the Beast',
      itemCategory: 'armour',
      usageCount: 150,
      usagePercentage: 75, // High demand
      averageLevel: 85,
      levelDistribution: {
        '81-90': 100,
        '91+': 50
      },
      classDistribution: {
        'Marauder': 60,
        'Duelist': 40,
        'Templar': 50
      },
      trendDirection: 'stable',
      popularBuilds: ['Tank Build', 'Life Build'],
      lastUpdated: new Date(),
      sampleSize: 200
    };

    testDemandMetrics = new Map([
      ['Belly of the Beast|Full Wyrmscale', demandMetrics]
    ]);

    const tradeListings: TradeListing[] = [
      {
        id: 'listing1',
        item: testItem,
        price: { amount: 50, currency: 'chaos' },
        seller: 'TestSeller1',
        listed: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
        whisper: 'Hi, I would like to buy your item',
        indexed: new Date(Date.now() - 1000 * 60 * 25), // 25 min ago
        league: 'Standard'
      },
      {
        id: 'listing2',
        item: testItem,
        price: { amount: 55, currency: 'chaos' },
        seller: 'TestSeller2',
        listed: new Date(Date.now() - 1000 * 60 * 45),
        whisper: 'Hi, I would like to buy your item',
        indexed: new Date(Date.now() - 1000 * 60 * 40),
        league: 'Standard'
      },
      {
        id: 'listing3',
        item: testItem,
        price: { amount: 1, currency: 'divine' }, // 200 chaos equivalent
        seller: 'TestSeller3',
        listed: new Date(Date.now() - 1000 * 60 * 60),
        whisper: 'Hi, I would like to buy your item',
        indexed: new Date(Date.now() - 1000 * 60 * 55),
        league: 'Standard'
      }
    ];

    testTradeListings = new Map([
      ['Belly of the Beast|Full Wyrmscale', tradeListings]
    ]);

    testCurrencyRates = {
      chaos: 1,
      divine: 200,
      exalted: 15,
      mirror: 300000
    };
  });

  describe('calculateProfit', () => {
    it('should calculate basic profit opportunities correctly', () => {
      const opportunities = calculateProfit(testDemandMetrics, testTradeListings, {
        currencyRates: testCurrencyRates
      });

      expect(opportunities.length).toBeGreaterThan(0);

      const opportunity = opportunities[0];
      expect(opportunity.item.name).toBe('Belly of the Beast');
      expect(opportunity.buyPrice).toBe(50); // Cheapest listing
      expect(opportunity.estimatedSellPrice).toBeGreaterThan(50);
      expect(opportunity.profitMargin).toBeGreaterThan(0);
      expect(opportunity.profitPercentage).toBeGreaterThan(0);
      expect(opportunity.confidence).toBeGreaterThan(0);
      expect(opportunity.demandScore).toBe(75);
    });

    it('should filter opportunities by minimum thresholds', () => {
      const opportunities = calculateProfit(testDemandMetrics, testTradeListings, {
        minProfitMargin: 100, // Very high threshold
        minProfitPercentage: 200, // Very high threshold
        currencyRates: testCurrencyRates
      });

      // Should return no opportunities due to high thresholds
      expect(opportunities.length).toBe(0);
    });

    it('should filter opportunities by maximum buy price', () => {
      const opportunities = calculateProfit(testDemandMetrics, testTradeListings, {
        maxBuyPrice: 30, // Lower than cheapest listing (50 chaos)
        currencyRates: testCurrencyRates
      });

      expect(opportunities.length).toBe(0);
    });

    it('should filter opportunities by minimum confidence', () => {
      const opportunities = calculateProfit(testDemandMetrics, testTradeListings, {
        minConfidence: 0.95, // Very high confidence requirement
        currencyRates: testCurrencyRates
      });

      // Should return fewer or no opportunities due to high confidence requirement
      expect(opportunities.length).toBeLessThanOrEqual(1);
    });

    it('should handle items with no trade listings', () => {
      const emptyTradeListings = new Map<string, TradeListing[]>();
      const opportunities = calculateProfit(testDemandMetrics, emptyTradeListings);

      expect(opportunities.length).toBe(0);
    });

    it('should sort listings by price correctly', () => {
      const opportunities = calculateProfit(testDemandMetrics, testTradeListings, {
        currencyRates: testCurrencyRates
      });

      expect(opportunities.length).toBeGreaterThan(0);

      const opportunity = opportunities[0];
      expect(opportunity.buyPrice).toBe(50); // Should use cheapest listing
      expect(opportunity.listings[0].price.amount).toBe(50);
      expect(opportunity.listings[0].price.currency).toBe('chaos');
    });
  });

  describe('estimateSellPrice', () => {
    it('should calculate higher sell price for high demand items', () => {
      const highDemandMetrics: DemandMetrics = {
        ...testDemandMetrics.values().next().value,
        usagePercentage: 80 // Very high demand
      };

      const sellPrice = estimateSellPrice(highDemandMetrics, 50);
      expect(sellPrice).toBeGreaterThan(50);
      expect(sellPrice).toBeGreaterThan(100); // Should be significantly higher
    });

    it('should calculate lower sell price for low demand items', () => {
      const lowDemandMetrics: DemandMetrics = {
        ...testDemandMetrics.values().next().value,
        usagePercentage: 5 // Low demand
      };

      const sellPrice = estimateSellPrice(lowDemandMetrics, 50);
      expect(sellPrice).toBeGreaterThan(50);
      expect(sellPrice).toBeLessThan(80); // Should be moderate increase
    });

    it('should apply sample size bonus correctly', () => {
      const smallSampleMetrics: DemandMetrics = {
        ...testDemandMetrics.values().next().value,
        sampleSize: 100
      };

      const largeSampleMetrics: DemandMetrics = {
        ...testDemandMetrics.values().next().value,
        sampleSize: 2000
      };

      const smallSamplePrice = estimateSellPrice(smallSampleMetrics, 50);
      const largeSamplePrice = estimateSellPrice(largeSampleMetrics, 50);

      expect(largeSamplePrice).toBeGreaterThan(smallSamplePrice);
    });

    it('should apply high-level content bonus', () => {
      const highLevelMetrics: DemandMetrics = {
        ...testDemandMetrics.values().next().value,
        levelDistribution: {
          '91+': 80,
          '81-90': 20
        },
        usageCount: 100
      };

      const lowLevelMetrics: DemandMetrics = {
        ...testDemandMetrics.values().next().value,
        levelDistribution: {
          '1-20': 50,
          '21-40': 50
        },
        usageCount: 100
      };

      const highLevelPrice = estimateSellPrice(highLevelMetrics, 50);
      const lowLevelPrice = estimateSellPrice(lowLevelMetrics, 50);

      expect(highLevelPrice).toBeGreaterThan(lowLevelPrice);
    });
  });

  describe('rankOpportunities', () => {
    let testOpportunities: ProfitOpportunity[];

    beforeEach(() => {
      testOpportunities = [
        {
          id: 'opp1',
          item: testItem,
          buyPrice: 50,
          estimatedSellPrice: 100,
          profitMargin: 50,
          profitPercentage: 100,
          confidence: 0.8,
          demandScore: 75,
          usageCount: 150,
          reasoning: 'High demand',
          listings: [],
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        },
        {
          id: 'opp2',
          item: { ...testItem, name: 'Lesser Item' },
          buyPrice: 20,
          estimatedSellPrice: 35,
          profitMargin: 15,
          profitPercentage: 75,
          confidence: 0.6,
          demandScore: 40,
          usageCount: 80,
          reasoning: 'Moderate demand',
          listings: [],
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      ];
    });

    it('should rank opportunities by weighted score', () => {
      const ranked = rankOpportunities(testOpportunities);

      expect(ranked.length).toBe(2);
      expect(ranked[0].popularityRank).toBe(1);
      expect(ranked[1].popularityRank).toBe(2);

      // Higher scoring opportunity should be first
      expect(ranked[0].profitMargin).toBeGreaterThanOrEqual(ranked[1].profitMargin);
    });

    it('should apply custom weights correctly', () => {
      const confidenceWeighted = rankOpportunities(testOpportunities, {
        confidence: 0.8,
        profitMargin: 0.1,
        profitPercentage: 0.05,
        demandScore: 0.05
      });

      // With heavy confidence weighting, higher confidence item should rank first
      expect(confidenceWeighted[0].confidence).toBeGreaterThanOrEqual(
        confidenceWeighted[1].confidence
      );
    });

    it('should handle empty opportunities array', () => {
      const ranked = rankOpportunities([]);
      expect(ranked).toEqual([]);
    });

    it('should handle single opportunity correctly', () => {
      const ranked = rankOpportunities([testOpportunities[0]]);
      expect(ranked.length).toBe(1);
      expect(ranked[0].popularityRank).toBe(1);
    });
  });

  describe('filterOpportunities', () => {
    let testOpportunities: ProfitOpportunity[];

    beforeEach(() => {
      testOpportunities = [
        {
          id: 'opp1',
          item: { ...testItem, category: 'armour' },
          buyPrice: 50,
          estimatedSellPrice: 100,
          profitMargin: 50,
          profitPercentage: 100,
          confidence: 0.8,
          demandScore: 75,
          usageCount: 150,
          reasoning: 'High demand',
          listings: [],
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        },
        {
          id: 'opp2',
          item: { ...testItem, category: 'weapon', name: 'Test Weapon' },
          buyPrice: 200,
          estimatedSellPrice: 250,
          profitMargin: 50,
          profitPercentage: 25,
          confidence: 0.4,
          demandScore: 30,
          usageCount: 50,
          reasoning: 'Low confidence',
          listings: [],
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      ];
    });

    it('should filter by minimum confidence', () => {
      const filtered = filterOpportunities(testOpportunities, {
        minConfidence: 0.7
      });

      expect(filtered.length).toBe(1);
      expect(filtered[0].confidence).toBeGreaterThanOrEqual(0.7);
    });

    it('should filter by minimum demand score', () => {
      const filtered = filterOpportunities(testOpportunities, {
        minDemandScore: 60
      });

      expect(filtered.length).toBe(1);
      expect(filtered[0].demandScore).toBeGreaterThanOrEqual(60);
    });

    it('should filter by item categories', () => {
      const filtered = filterOpportunities(testOpportunities, {
        categories: ['armour']
      });

      expect(filtered.length).toBe(1);
      expect(filtered[0].item.category).toBe('armour');
    });

    it('should filter by maximum buy price', () => {
      const filtered = filterOpportunities(testOpportunities, {
        maxBuyPrice: 100
      });

      expect(filtered.length).toBe(1);
      expect(filtered[0].buyPrice).toBeLessThanOrEqual(100);
    });

    it('should filter by minimum usage count', () => {
      const filtered = filterOpportunities(testOpportunities, {
        minUsageCount: 100
      });

      expect(filtered.length).toBe(1);
      expect(filtered[0].usageCount).toBeGreaterThanOrEqual(100);
    });

    it('should apply multiple filters simultaneously', () => {
      const filtered = filterOpportunities(testOpportunities, {
        minConfidence: 0.5,
        categories: ['armour'],
        maxBuyPrice: 100,
        minUsageCount: 100
      });

      expect(filtered.length).toBe(1);
      const opp = filtered[0];
      expect(opp.confidence).toBeGreaterThanOrEqual(0.5);
      expect(opp.item.category).toBe('armour');
      expect(opp.buyPrice).toBeLessThanOrEqual(100);
      expect(opp.usageCount).toBeGreaterThanOrEqual(100);
    });

    it('should return empty array when no opportunities match filters', () => {
      const filtered = filterOpportunities(testOpportunities, {
        categories: ['nonexistent_category']
      });

      expect(filtered).toEqual([]);
    });
  });

  describe('Currency Conversion', () => {
    it('should handle different currency types in listings', () => {
      const mixedCurrencyListings: TradeListing[] = [
        {
          id: 'chaos_listing',
          item: testItem,
          price: { amount: 50, currency: 'chaos' },
          seller: 'Seller1',
          listed: new Date(),
          whisper: 'test',
          indexed: new Date(),
          league: 'Standard'
        },
        {
          id: 'divine_listing',
          item: testItem,
          price: { amount: 0.5, currency: 'divine' }, // 0.5 divine = 100 chaos
          seller: 'Seller2',
          listed: new Date(),
          whisper: 'test',
          indexed: new Date(),
          league: 'Standard'
        }
      ];

      const mixedListings = new Map([
        ['Belly of the Beast|Full Wyrmscale', mixedCurrencyListings]
      ]);

      const opportunities = calculateProfit(testDemandMetrics, mixedListings, {
        currencyRates: testCurrencyRates
      });

      expect(opportunities.length).toBeGreaterThan(0);
      // Should use cheapest option (50 chaos, not 100 chaos equivalent)
      expect(opportunities[0].buyPrice).toBe(50);
    });
  });

  describe('Edge Cases', () => {
    it('should handle opportunities with zero profit margin', () => {
      // Create metrics that would result in no profit
      const lowDemandMetrics = new Map([
        ['Low Item|Base', {
          id: 'low',
          itemName: 'Low Item',
          itemCategory: 'test',
          usageCount: 1,
          usagePercentage: 1, // Very low demand
          averageLevel: 50,
          levelDistribution: {},
          classDistribution: {},
          trendDirection: 'stable' as const,
          popularBuilds: [],
          lastUpdated: new Date(),
          sampleSize: 100
        }]
      ]);

      const expensiveListings = new Map([
        ['Low Item|Base', [{
          id: 'expensive',
          item: testItem,
          price: { amount: 1000, currency: 'chaos' }, // Very expensive
          seller: 'Seller',
          listed: new Date(),
          whisper: 'test',
          indexed: new Date(),
          league: 'Standard'
        }]]
      ]);

      const opportunities = calculateProfit(lowDemandMetrics, expensiveListings);
      expect(opportunities.length).toBe(0);
    });

    it('should handle invalid or missing currency rates', () => {
      const invalidRates: CurrencyRates = {
        chaos: 1,
        divine: 0, // Invalid rate
        exalted: -5, // Invalid rate
        mirror: NaN // Invalid rate
      };

      // Should not throw error, but handle gracefully
      expect(() => {
        calculateProfit(testDemandMetrics, testTradeListings, {
          currencyRates: invalidRates
        });
      }).not.toThrow();
    });
  });
});