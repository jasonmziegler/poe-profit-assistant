import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../../../app/api/analyze/route';
import fs from 'fs/promises';
import path from 'path';

// Mock the database to avoid file system operations during testing
vi.mock('../../../lib/db/queries', () => ({
  getDB: vi.fn(() => ({
    saveDemandMetricsBatch: vi.fn(),
    saveOpportunities: vi.fn(),
    deleteExpiredOpportunities: vi.fn(() => 0)
  }))
}));

// Mock logger
vi.mock('../../../lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn()
  }
}));

// Mock file system operations
vi.mock('fs/promises');

describe('Analyze API Integration Tests', () => {
  const mockCharacterData = [
    {
      id: 'char1',
      name: 'TestCharacter1',
      level: 85,
      class: 'Marauder',
      league: 'Standard',
      items: [
        {
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
        },
        {
          id: 'item2',
          name: 'The Baron',
          baseType: 'Close Helmet',
          itemLevel: 68,
          rarity: 'Unique',
          category: 'armour',
          sockets: { total: 4, links: 4, colors: 'RRGG' },
          mods: ['Minion Damage'],
          corrupted: false,
          identified: true
        }
      ],
      skills: [],
      experience: 1500000,
      fetchedAt: new Date(),
      accountName: 'TestAccount'
    },
    {
      id: 'char2',
      name: 'TestCharacter2',
      level: 90,
      class: 'Witch',
      league: 'Standard',
      items: [
        {
          id: 'item3',
          name: 'Belly of the Beast',
          baseType: 'Full Wyrmscale',
          itemLevel: 75,
          rarity: 'Unique',
          category: 'armour',
          sockets: { total: 6, links: 6, colors: 'RRGGBB' },
          mods: ['40% increased Life'],
          corrupted: false,
          identified: true
        }
      ],
      skills: [],
      experience: 2000000,
      fetchedAt: new Date(),
      accountName: 'TestAccount'
    }
  ];

  const mockTradeData = [
    {
      id: 'listing1',
      item: {
        id: 'trade_item1',
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
      price: { amount: 50, currency: 'chaos' },
      seller: 'TestSeller1',
      listed: new Date(Date.now() - 1000 * 60 * 30),
      whisper: 'Hi, I would like to buy your item',
      indexed: new Date(Date.now() - 1000 * 60 * 25),
      league: 'Standard'
    },
    {
      id: 'listing2',
      item: {
        id: 'trade_item2',
        name: 'Belly of the Beast',
        baseType: 'Full Wyrmscale',
        itemLevel: 75,
        rarity: 'Unique',
        category: 'armour',
        sockets: { total: 6, links: 6, colors: 'RRGGBB' },
        mods: ['40% increased Life'],
        corrupted: false,
        identified: true
      },
      price: { amount: 75, currency: 'chaos' },
      seller: 'TestSeller2',
      listed: new Date(Date.now() - 1000 * 60 * 45),
      whisper: 'Hi, I would like to buy your item',
      indexed: new Date(Date.now() - 1000 * 60 * 40),
      league: 'Standard'
    },
    {
      id: 'listing3',
      item: {
        id: 'trade_item3',
        name: 'The Baron',
        baseType: 'Close Helmet',
        itemLevel: 68,
        rarity: 'Unique',
        category: 'armour',
        sockets: { total: 4, links: 4, colors: 'RRGG' },
        mods: ['Minion Damage'],
        corrupted: false,
        identified: true
      },
      price: { amount: 20, currency: 'chaos' },
      seller: 'TestSeller3',
      listed: new Date(Date.now() - 1000 * 60 * 60),
      whisper: 'Hi, I would like to buy your item',
      indexed: new Date(Date.now() - 1000 * 60 * 55),
      league: 'Standard'
    }
  ];

  beforeEach(() => {
    // Setup mock file system responses
    vi.mocked(fs.readdir).mockImplementation(async (dir) => {
      if (dir.toString().includes('cache')) {
        return ['characters_standard.json', 'trade_armour.json'];
      }
      return [];
    });

    vi.mocked(fs.readFile).mockImplementation(async (file) => {
      const filePath = file.toString();
      if (filePath.includes('characters_')) {
        return JSON.stringify(mockCharacterData);
      }
      if (filePath.includes('trade_')) {
        return JSON.stringify(mockTradeData);
      }
      if (filePath.includes('analysis_result.json')) {
        throw new Error('Cache file not found'); // Simulate no cache
      }
      return '{}';
    });

    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    vi.mocked(fs.stat).mockRejectedValue(new Error('File not found')); // Simulate no cache
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/analyze', () => {
    it('should perform complete analysis workflow', async () => {
      const request = new NextRequest('http://localhost:3000/api/analyze');
      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.opportunities).toBeDefined();
      expect(data.metadata).toBeDefined();
      expect(data.timestamp).toBeDefined();

      // Should have found some opportunities
      expect(Array.isArray(data.opportunities)).toBe(true);

      // Metadata should contain analysis information
      expect(data.metadata.totalCharacters).toBe(2);
      expect(data.metadata.analysisTime).toBeGreaterThan(0);
      expect(data.metadata.parameters).toBeDefined();
    });

    it('should handle query parameters correctly', async () => {
      const url = new URL('http://localhost:3000/api/analyze');
      url.searchParams.set('minProfitMargin', '10');
      url.searchParams.set('minConfidence', '0.5');
      url.searchParams.set('maxResults', '20');
      url.searchParams.set('categories', 'armour,weapon');

      const request = new NextRequest(url.toString());
      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.metadata.parameters.minProfitMargin).toBe(10);
      expect(data.metadata.parameters.minConfidence).toBe(0.5);
      expect(data.metadata.parameters.maxResults).toBe(20);
      expect(data.metadata.parameters.categories).toEqual(['armour', 'weapon']);
    });

    it('should validate query parameters', async () => {
      const url = new URL('http://localhost:3000/api/analyze');
      url.searchParams.set('minProfitMargin', 'invalid'); // Invalid number
      url.searchParams.set('maxResults', '0'); // Invalid range

      const request = new NextRequest(url.toString());
      const response = await GET(request);

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('Invalid request parameters');
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.details).toBeDefined();
    });

    it('should handle no character data gracefully', async () => {
      // Mock empty character files
      vi.mocked(fs.readFile).mockImplementation(async (file) => {
        const filePath = file.toString();
        if (filePath.includes('characters_')) {
          return JSON.stringify([]); // Empty character data
        }
        if (filePath.includes('trade_')) {
          return JSON.stringify(mockTradeData);
        }
        return '{}';
      });

      const request = new NextRequest('http://localhost:3000/api/analyze');
      const response = await GET(request);

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('No character data available');
      expect(data.code).toBe('NO_CHARACTER_DATA');
    });

    it('should apply minimum opportunities validation', async () => {
      // Create minimal data that won't generate many opportunities
      const minimalCharacters = [{
        ...mockCharacterData[0],
        items: [{
          id: 'rare_item',
          name: 'Rare Item',
          baseType: 'Base Type',
          itemLevel: 50,
          rarity: 'Rare',
          category: 'weapon',
          mods: [],
          corrupted: false,
          identified: true
        }]
      }];

      vi.mocked(fs.readFile).mockImplementation(async (file) => {
        const filePath = file.toString();
        if (filePath.includes('characters_')) {
          return JSON.stringify(minimalCharacters);
        }
        if (filePath.includes('trade_')) {
          return JSON.stringify([]); // No trade data
        }
        return '{}';
      });

      const request = new NextRequest('http://localhost:3000/api/analyze');
      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      // Should warn about low opportunity count in logs
      expect(data.opportunities.length).toBeLessThan(10);
    });

    it('should handle file system errors gracefully', async () => {
      vi.mocked(fs.readdir).mockRejectedValue(new Error('File system error'));

      const request = new NextRequest('http://localhost:3000/api/analyze');
      const response = await GET(request);

      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toContain('Analysis failed');
      expect(data.code).toBe('ANALYSIS_ERROR');
    });

    it('should use cached results when available and not forced refresh', async () => {
      const cachedResult = {
        success: true,
        opportunities: [],
        metadata: { cached: true },
        timestamp: new Date().toISOString()
      };

      // Mock cache file exists and is recent
      vi.mocked(fs.stat).mockResolvedValue({
        mtime: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
      } as any);

      vi.mocked(fs.readFile).mockImplementation(async (file) => {
        const filePath = file.toString();
        if (filePath.includes('analysis_result.json')) {
          return JSON.stringify(cachedResult);
        }
        return JSON.stringify([]);
      });

      const request = new NextRequest('http://localhost:3000/api/analyze');
      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.metadata.cached).toBe(true);
    });

    it('should force refresh when requested', async () => {
      const url = new URL('http://localhost:3000/api/analyze');
      url.searchParams.set('forceRefresh', 'true');

      const request = new NextRequest(url.toString());
      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      // Should not use cached result
      expect(data.metadata.cached).toBeUndefined();
    });

    it('should handle league filtering', async () => {
      const url = new URL('http://localhost:3000/api/analyze');
      url.searchParams.set('league', 'Hardcore');

      const request = new NextRequest(url.toString());
      const response = await GET(request);

      expect(response.status).toBe(400); // Should fail with no hardcore characters
    });
  });

  describe('POST /api/analyze', () => {
    it('should handle manual trigger with valid parameters', async () => {
      const requestBody = {
        minProfitMargin: 15,
        minConfidence: 0.4,
        maxResults: 25
      };

      const request = new NextRequest('http://localhost:3000/api/analyze', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.opportunities).toBeDefined();
    });

    it('should validate POST request body', async () => {
      const invalidRequestBody = {
        minProfitMargin: 'invalid',
        maxResults: -5
      };

      const request = new NextRequest('http://localhost:3000/api/analyze', {
        method: 'POST',
        body: JSON.stringify(invalidRequestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('Invalid request body');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should handle malformed JSON in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/analyze', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);

      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toContain('Manual trigger failed');
      expect(data.code).toBe('TRIGGER_ERROR');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database operations to throw errors
      const { getDB } = await import('../../../lib/db/queries');
      vi.mocked(getDB).mockReturnValue({
        saveDemandMetricsBatch: vi.fn(() => { throw new Error('DB Error'); }),
        saveOpportunities: vi.fn(),
        deleteExpiredOpportunities: vi.fn()
      } as any);

      const request = new NextRequest('http://localhost:3000/api/analyze');
      const response = await GET(request);

      // Should still succeed despite database errors
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should handle partial file loading failures', async () => {
      let callCount = 0;
      vi.mocked(fs.readFile).mockImplementation(async (file) => {
        const filePath = file.toString();
        if (filePath.includes('characters_')) {
          callCount++;
          if (callCount === 1) {
            throw new Error('File read error');
          }
          return JSON.stringify(mockCharacterData);
        }
        if (filePath.includes('trade_')) {
          return JSON.stringify(mockTradeData);
        }
        return '{}';
      });

      const request = new NextRequest('http://localhost:3000/api/analyze');
      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should complete analysis within reasonable time', async () => {
      const startTime = Date.now();

      const request = new NextRequest('http://localhost:3000/api/analyze');
      const response = await GET(request);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

      const data = await response.json();
      expect(data.metadata.analysisTime).toBeLessThan(duration);
    });

    it('should handle large datasets efficiently', async () => {
      // Create large dataset
      const largeCharacterData = Array.from({ length: 100 }, (_, i) => ({
        ...mockCharacterData[0],
        id: `char_${i}`,
        name: `Character_${i}`,
        items: Array.from({ length: 20 }, (_, j) => ({
          ...mockCharacterData[0].items[0],
          id: `item_${i}_${j}`,
          name: `Item_${i}_${j}`
        }))
      }));

      const largeTradeData = Array.from({ length: 1000 }, (_, i) => ({
        ...mockTradeData[0],
        id: `listing_${i}`,
        price: { amount: 50 + (i % 50), currency: 'chaos' }
      }));

      vi.mocked(fs.readFile).mockImplementation(async (file) => {
        const filePath = file.toString();
        if (filePath.includes('characters_')) {
          return JSON.stringify(largeCharacterData);
        }
        if (filePath.includes('trade_')) {
          return JSON.stringify(largeTradeData);
        }
        return '{}';
      });

      const startTime = Date.now();

      const request = new NextRequest('http://localhost:3000/api/analyze');
      const response = await GET(request);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(10000); // Should handle large datasets within 10 seconds

      const data = await response.json();
      expect(data.opportunities.length).toBeGreaterThan(0);
    });
  });
});