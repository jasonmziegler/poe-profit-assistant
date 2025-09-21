import { describe, it, expect } from 'vitest';
import { ItemNormalizer } from '@/lib/api/item-normalizer';

describe('ItemNormalizer', () => {
  const mockRawItem = {
    verified: true,
    w: 2,
    h: 4,
    icon: 'test-icon.png',
    league: 'Standard',
    id: 'test-item-123',
    name: 'Starforge',
    typeLine: 'Infernal Sword',
    baseType: 'Infernal Sword',
    identified: true,
    ilvl: 85,
    corrupted: false,
    frameType: 3, // Unique
    x: 0,
    y: 0,
    inventoryId: 'MainInventory',
    implicitMods: ['60% increased Critical Strike Chance'],
    explicitMods: [
      '(400-500)% increased Physical Damage',
      'Adds 100-200 Physical Damage',
      '(8-12)% increased Attack Speed'
    ],
    craftedMods: ['Non-Damaging Ailments have double Effect'],
    enchantMods: [],
    sockets: [
      { group: 0, attr: 'S', sColour: 'R' },
      { group: 0, attr: 'S', sColour: 'G' },
      { group: 1, attr: 'S', sColour: 'B' },
      { group: 1, attr: 'S', sColour: 'B' },
      { group: 1, attr: 'S', sColour: 'R' },
      { group: 1, attr: 'S', sColour: 'G' }
    ]
  };

  describe('normalizeItem', () => {
    it('should normalize a unique weapon correctly', () => {
      const normalized = ItemNormalizer.normalizeItem(mockRawItem);

      expect(normalized).toEqual({
        id: 'test-item-123',
        name: 'Starforge',
        baseType: 'Infernal Sword',
        itemLevel: 85,
        rarity: 'Unique',
        category: 'weapon',
        sockets: {
          total: 6,
          links: 4,
          colors: 'RGBBRG'
        },
        mods: [
          '60% increased Critical Strike Chance',
          '(400-500)% increased Physical Damage',
          'Adds 100-200 Physical Damage',
          '(8-12)% increased Attack Speed',
          'Non-Damaging Ailments have double Effect'
        ],
        implicitMods: ['60% increased Critical Strike Chance'],
        explicitMods: [
          '(400-500)% increased Physical Damage',
          'Adds 100-200 Physical Damage',
          '(8-12)% increased Attack Speed'
        ],
        corrupted: false,
        identified: true
      });
    });

    it('should handle items without sockets', () => {
      const itemWithoutSockets = {
        ...mockRawItem,
        sockets: undefined
      };

      const normalized = ItemNormalizer.normalizeItem(itemWithoutSockets);
      expect(normalized.sockets).toBeUndefined();
    });

    it('should handle empty socket arrays', () => {
      const itemWithEmptySockets = {
        ...mockRawItem,
        sockets: []
      };

      const normalized = ItemNormalizer.normalizeItem(itemWithEmptySockets);
      expect(normalized.sockets).toBeUndefined();
    });

    it('should calculate socket links correctly', () => {
      const testCases = [
        {
          sockets: [
            { group: 0, attr: 'S', sColour: 'R' },
            { group: 0, attr: 'S', sColour: 'G' },
            { group: 0, attr: 'S', sColour: 'B' }
          ],
          expectedLinks: 3
        },
        {
          sockets: [
            { group: 0, attr: 'S', sColour: 'R' },
            { group: 1, attr: 'S', sColour: 'G' },
            { group: 2, attr: 'S', sColour: 'B' }
          ],
          expectedLinks: 1
        },
        {
          sockets: [
            { group: 0, attr: 'S', sColour: 'R' },
            { group: 0, attr: 'S', sColour: 'G' },
            { group: 1, attr: 'S', sColour: 'B' },
            { group: 1, attr: 'S', sColour: 'R' },
            { group: 1, attr: 'S', sColour: 'G' },
            { group: 1, attr: 'S', sColour: 'W' }
          ],
          expectedLinks: 4
        }
      ];

      testCases.forEach(({ sockets, expectedLinks }) => {
        const item = { ...mockRawItem, sockets };
        const normalized = ItemNormalizer.normalizeItem(item);
        expect(normalized.sockets?.links).toBe(expectedLinks);
      });
    });

    it('should handle different rarity frame types', () => {
      const rarityTests = [
        { frameType: 0, expected: 'Normal' },
        { frameType: 1, expected: 'Magic' },
        { frameType: 2, expected: 'Rare' },
        { frameType: 3, expected: 'Unique' },
        { frameType: 99, expected: 'Normal' } // Unknown defaults to Normal
      ];

      rarityTests.forEach(({ frameType, expected }) => {
        const item = { ...mockRawItem, frameType };
        const normalized = ItemNormalizer.normalizeItem(item);
        expect(normalized.rarity).toBe(expected);
      });
    });

    it('should categorize different item types correctly', () => {
      const categoryTests = [
        { typeLine: 'Iron Sword', expected: 'weapon' },
        { typeLine: 'Leather Cap', expected: 'armour' },
        { typeLine: 'Gold Ring', expected: 'accessory' },
        { typeLine: 'Life Flask', expected: 'flask' },
        { typeLine: 'Beach Map', expected: 'map' },
        { typeLine: 'Skill Gem', expected: 'gem' },
        { typeLine: 'Chaos Orb', expected: 'currency' }
      ];

      categoryTests.forEach(({ typeLine, expected }) => {
        const item = { ...mockRawItem, typeLine };
        const normalized = ItemNormalizer.normalizeItem(item);
        expect(normalized.category).toBe(expected);
      });
    });

    it('should combine all mod types correctly', () => {
      const itemWithAllMods = {
        ...mockRawItem,
        implicitMods: ['Implicit mod'],
        explicitMods: ['Explicit mod 1', 'Explicit mod 2'],
        craftedMods: ['Crafted mod'],
        enchantMods: ['Enchant mod']
      };

      const normalized = ItemNormalizer.normalizeItem(itemWithAllMods);
      expect(normalized.mods).toEqual([
        'Implicit mod',
        'Explicit mod 1',
        'Explicit mod 2',
        'Crafted mod',
        'Enchant mod'
      ]);
    });

    it('should handle missing mod arrays', () => {
      const itemWithoutMods = {
        ...mockRawItem,
        implicitMods: undefined,
        explicitMods: undefined,
        craftedMods: undefined,
        enchantMods: undefined
      };

      const normalized = ItemNormalizer.normalizeItem(itemWithoutMods);
      expect(normalized.mods).toEqual([]);
    });
  });

  describe('normalizeItems', () => {
    it('should normalize an array of items', () => {
      const rawItems = [mockRawItem, { ...mockRawItem, id: 'test-item-456', name: 'Another Item' }];

      const normalized = ItemNormalizer.normalizeItems(rawItems);

      expect(normalized).toHaveLength(2);
      expect(normalized[0].id).toBe('test-item-123');
      expect(normalized[1].id).toBe('test-item-456');
      expect(normalized[1].name).toBe('Another Item');
    });

    it('should handle empty arrays', () => {
      const normalized = ItemNormalizer.normalizeItems([]);
      expect(normalized).toEqual([]);
    });
  });
});