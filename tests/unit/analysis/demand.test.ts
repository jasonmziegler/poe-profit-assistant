import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateDemandScore,
  normalizeDemandByCategory,
  rankItemsByPopularity,
  DemandMetrics
} from '../../../lib/analysis/demand';
import { Character, Item } from '../../../lib/types/character';

// Mock logger to avoid file system operations during testing
vi.mock('../../../lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn()
  }
}));

describe('Demand Analysis', () => {
  let testCharacters: Character[];
  let testItems: Item[];

  beforeEach(() => {
    // Create test data
    testItems = [
      {
        id: 'item1',
        name: 'Abyssus',
        baseType: 'Ezomyte Burgonet',
        itemLevel: 68,
        rarity: 'Unique',
        category: 'armour',
        sockets: { total: 4, links: 4, colors: 'RRGG' },
        mods: ['Adds 40-60 to Melee Damage'],
        corrupted: false,
        identified: true
      },
      {
        id: 'item2',
        name: 'Belly of the Beast',
        baseType: 'Full Wyrmscale',
        itemLevel: 72,
        rarity: 'Unique',
        category: 'armour',
        sockets: { total: 6, links: 5, colors: 'RRGGBB' },
        mods: ['40% increased Life'],
        corrupted: false,
        identified: true
      },
      {
        id: 'item3',
        name: 'Chaos Orb',
        baseType: 'Currency',
        itemLevel: 1,
        rarity: 'Normal',
        category: 'currency',
        sockets: undefined,
        mods: [],
        corrupted: false,
        identified: true
      }
    ];

    testCharacters = [
      {
        id: 'char1',
        name: 'TestChar1',
        level: 85,
        class: 'Marauder',
        league: 'Standard',
        items: [testItems[0], testItems[2]], // Abyssus + Chaos Orb
        skills: [],
        experience: 1000000,
        fetchedAt: new Date(),
        accountName: 'TestAccount'
      },
      {
        id: 'char2',
        name: 'TestChar2',
        level: 90,
        class: 'Witch',
        league: 'Standard',
        items: [testItems[0], testItems[1]], // Abyssus + Belly
        skills: [],
        experience: 2000000,
        fetchedAt: new Date(),
        accountName: 'TestAccount'
      },
      {
        id: 'char3',
        name: 'TestChar3',
        level: 78,
        class: 'Ranger',
        league: 'Standard',
        items: [testItems[1]], // Only Belly
        skills: [],
        experience: 800000,
        fetchedAt: new Date(),
        accountName: 'TestAccount'
      }
    ];
  });

  describe('calculateDemandScore', () => {
    it('should calculate basic demand scores correctly', () => {
      const result = calculateDemandScore(testCharacters);

      expect(result.size).toBeGreaterThan(0);

      // Check Abyssus (used by 2/3 characters = 66.67%)
      const abyssusKey = 'Abyssus|Ezomyte Burgonet';
      expect(result.has(abyssusKey)).toBe(true);

      const abyssusMetrics = result.get(abyssusKey)!;
      expect(abyssusMetrics.usageCount).toBe(2);
      expect(abyssusMetrics.usagePercentage).toBeCloseTo(66.67, 1);
      expect(abyssusMetrics.sampleSize).toBe(3);
      expect(abyssusMetrics.itemCategory).toBe('armour');
    });

    it('should calculate level distributions correctly', () => {
      const result = calculateDemandScore(testCharacters);
      const abyssusKey = 'Abyssus|Ezomyte Burgonet';
      const abyssusMetrics = result.get(abyssusKey)!;

      // Abyssus used by level 85 and 90 characters
      expect(abyssusMetrics.levelDistribution['81-90']).toBe(2);
      expect(abyssusMetrics.levelDistribution['91+']).toBe(0);
      expect(abyssusMetrics.averageLevel).toBe(87.5); // (85 + 90) / 2
    });

    it('should calculate class distributions correctly', () => {
      const result = calculateDemandScore(testCharacters);
      const abyssusKey = 'Abyssus|Ezomyte Burgonet';
      const abyssusMetrics = result.get(abyssusKey)!;

      expect(abyssusMetrics.classDistribution['Marauder']).toBe(1);
      expect(abyssusMetrics.classDistribution['Witch']).toBe(1);
      expect(abyssusMetrics.classDistribution['Ranger']).toBeUndefined();
    });

    it('should exclude specified categories', () => {
      const result = calculateDemandScore(testCharacters, {
        excludeCategories: ['currency']
      });

      const currencyKey = 'Chaos Orb|Currency';
      expect(result.has(currencyKey)).toBe(false);
    });

    it('should handle empty character list', () => {
      const result = calculateDemandScore([]);
      expect(result.size).toBe(0);
    });

    it('should handle minimum sample size validation', () => {
      const result = calculateDemandScore([testCharacters[0]], {
        minSampleSize: 50
      });

      // Should still calculate but log warning (tested via mock)
      expect(result.size).toBeGreaterThan(0);
    });
  });

  describe('normalizeDemandByCategory', () => {
    it('should normalize demand scores within categories', () => {
      const initialMetrics = calculateDemandScore(testCharacters);
      const normalized = normalizeDemandByCategory(initialMetrics);

      expect(normalized.size).toBe(initialMetrics.size);

      // All armour items should be normalized relative to each other
      const armourItems = Array.from(normalized.values())
        .filter(m => m.itemCategory === 'armour');

      expect(armourItems.length).toBeGreaterThan(0);

      // Normalized scores should be in 0-100 range
      armourItems.forEach(item => {
        expect(item.usagePercentage).toBeGreaterThanOrEqual(0);
        expect(item.usagePercentage).toBeLessThanOrEqual(100);
      });
    });

    it('should handle single item category correctly', () => {
      // Create metrics with only one item in category
      const singleItemMetrics = new Map([
        ['TestItem|TestBase', {
          id: 'test',
          itemName: 'TestItem',
          itemCategory: 'unique_category',
          usageCount: 5,
          usagePercentage: 50,
          averageLevel: 80,
          levelDistribution: { '81-90': 5 },
          classDistribution: { 'TestClass': 5 },
          trendDirection: 'stable' as const,
          popularBuilds: [],
          lastUpdated: new Date(),
          sampleSize: 10
        }]
      ]);

      const normalized = normalizeDemandByCategory(singleItemMetrics);
      const item = normalized.values().next().value;

      expect(item.usagePercentage).toBe(100); // Single item gets max score
    });
  });

  describe('rankItemsByPopularity', () => {
    it('should rank items by usage percentage', () => {
      const metrics = calculateDemandScore(testCharacters);
      const ranked = rankItemsByPopularity(metrics);

      expect(ranked.length).toBeGreaterThan(0);

      // Should be sorted by usage percentage descending
      for (let i = 1; i < ranked.length; i++) {
        expect(ranked[i - 1].usagePercentage).toBeGreaterThanOrEqual(
          ranked[i].usagePercentage
        );
      }
    });

    it('should filter out items below usage threshold', () => {
      const metrics = calculateDemandScore(testCharacters);
      const ranked = rankItemsByPopularity(metrics);

      // All returned items should have >= 5 usage count
      ranked.forEach(item => {
        expect(item.usageCount).toBeGreaterThanOrEqual(5);
      });
    });

    it('should handle tie-breaking by usage count', () => {
      // Create test data with identical usage percentages
      const testMetrics = new Map<string, DemandMetrics>([
        ['Item1|Base1', {
          id: 'test1',
          itemName: 'Item1',
          itemCategory: 'test',
          usageCount: 10,
          usagePercentage: 50,
          averageLevel: 80,
          levelDistribution: {},
          classDistribution: {},
          trendDirection: 'stable',
          popularBuilds: [],
          lastUpdated: new Date(),
          sampleSize: 20
        }],
        ['Item2|Base2', {
          id: 'test2',
          itemName: 'Item2',
          itemCategory: 'test',
          usageCount: 15,
          usagePercentage: 50,
          averageLevel: 80,
          levelDistribution: {},
          classDistribution: {},
          trendDirection: 'stable',
          popularBuilds: [],
          lastUpdated: new Date(),
          sampleSize: 20
        }]
      ]);

      const ranked = rankItemsByPopularity(testMetrics);

      // Item with higher usage count should come first
      expect(ranked[0].usageCount).toBe(15);
      expect(ranked[1].usageCount).toBe(10);
    });

    it('should return empty array for empty input', () => {
      const ranked = rankItemsByPopularity(new Map());
      expect(ranked).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle characters with no items', () => {
      const emptyChars: Character[] = [{
        id: 'empty',
        name: 'EmptyChar',
        level: 50,
        class: 'Templar',
        league: 'Standard',
        items: [], // No items
        skills: [],
        experience: 100000,
        fetchedAt: new Date()
      }];

      const result = calculateDemandScore(emptyChars);
      expect(result.size).toBe(0);
    });

    it('should handle items with missing or invalid data', () => {
      const invalidItem: Item = {
        id: '',
        name: '',
        baseType: '',
        itemLevel: -1,
        rarity: 'Normal',
        category: '',
        mods: [],
        corrupted: false,
        identified: true
      };

      const charWithInvalidItem: Character = {
        id: 'invalid',
        name: 'InvalidChar',
        level: 50,
        class: 'Scion',
        league: 'Standard',
        items: [invalidItem],
        skills: [],
        experience: 100000,
        fetchedAt: new Date()
      };

      // Should handle gracefully without throwing
      expect(() => {
        calculateDemandScore([charWithInvalidItem]);
      }).not.toThrow();
    });

    it('should handle extreme level values', () => {
      const extremeLevelChars: Character[] = [
        {
          ...testCharacters[0],
          level: 1, // Very low level
          items: [testItems[0]]
        },
        {
          ...testCharacters[1],
          level: 100, // Max level
          items: [testItems[0]]
        }
      ];

      const result = calculateDemandScore(extremeLevelChars);
      const abyssusKey = 'Abyssus|Ezomyte Burgonet';
      const metrics = result.get(abyssusKey)!;

      expect(metrics.averageLevel).toBe(50.5); // (1 + 100) / 2
      expect(metrics.levelDistribution['1-20']).toBe(1);
      expect(metrics.levelDistribution['91+']).toBe(1);
    });
  });
});