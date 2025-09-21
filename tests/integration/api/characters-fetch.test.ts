import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST } from '@/app/api/characters/fetch/route';
import { NextRequest } from 'next/server';

// Mock the external dependencies
vi.mock('@/lib/api/poe-client');
vi.mock('@/lib/cache/file-cache');
vi.mock('@/lib/utils/logger');

import { PoEApiClient } from '@/lib/api/poe-client';
import { FileCache } from '@/lib/cache/file-cache';
import { ApiLogger } from '@/lib/utils/logger';

describe('/api/characters/fetch', () => {
  let mockPoEClient: any;
  let mockFileCache: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock PoEApiClient
    mockPoEClient = {
      fetchCharacterLadder: vi.fn(),
      fetchCharacterDetails: vi.fn()
    };
    vi.mocked(PoEApiClient).mockImplementation(() => mockPoEClient);

    // Mock FileCache
    mockFileCache = {
      getCharacters: vi.fn(),
      storeCharacters: vi.fn(),
      cleanupOldEntries: vi.fn()
    };
    vi.mocked(FileCache).mockImplementation(() => mockFileCache);

    // Mock ApiLogger methods
    vi.mocked(ApiLogger.logCacheOperation).mockImplementation(() => {});
    vi.mocked(ApiLogger.logCharacterFetch).mockImplementation(() => {});
    vi.mocked(ApiLogger.logError).mockImplementation(() => {});
  });

  const createMockRequest = (body: any): NextRequest => {
    return {
      json: vi.fn().mockResolvedValue(body)
    } as any;
  };

  const mockLadderResponse = {
    entries: [
      {
        character: {
          id: 'char1',
          name: 'TestChar1',
          level: 95,
          class: 'Witch',
          league: 'Standard',
          experience: 1500000000
        },
        account: {
          name: 'TestAccount1'
        },
        depth: 100
      },
      {
        character: {
          id: 'char2',
          name: 'TestChar2',
          level: 92,
          class: 'Ranger',
          league: 'Standard',
          experience: 1200000000
        },
        account: {
          name: 'TestAccount2'
        }
      }
    ]
  };

  const mockCharacterDetails = {
    character: {
      name: 'TestChar1',
      league: 'Standard',
      classId: 1,
      ascendancyClass: 0,
      class: 'Witch',
      level: 95,
      experience: 1500000000
    },
    items: [
      {
        verified: true,
        w: 2,
        h: 4,
        icon: 'test-icon',
        league: 'Standard',
        id: 'item1',
        name: 'Test Sword',
        typeLine: 'One Hand Sword',
        baseType: 'Iron Sword',
        identified: true,
        ilvl: 85,
        corrupted: false,
        frameType: 3, // Unique
        x: 0,
        y: 0,
        inventoryId: 'MainInventory',
        implicitMods: ['60% increased Critical Strike Chance'],
        explicitMods: ['(400-500)% increased Physical Damage'],
        sockets: [
          { group: 0, attr: 'S', sColour: 'R' },
          { group: 0, attr: 'S', sColour: 'G' }
        ]
      }
    ]
  };

  describe('POST', () => {
    it('should return cached characters if available', async () => {
      const cachedCharacters = [
        {
          id: 'cached-char',
          name: 'CachedCharacter',
          level: 95,
          class: 'Witch',
          league: 'Standard',
          experience: 1500000000,
          fetchedAt: '2025-09-21T16:27:48.239Z',
          items: [],
          skills: []
        }
      ];

      mockFileCache.getCharacters.mockResolvedValue(cachedCharacters);

      const request = createMockRequest({ league: 'Standard', limit: 100 });
      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.characters).toEqual(cachedCharacters);
      expect(result.data.stats.fromCache).toBe(true);
      expect(mockFileCache.getCharacters).toHaveBeenCalledWith('Standard');
      expect(mockPoEClient.fetchCharacterLadder).not.toHaveBeenCalled();
    });

    it('should fetch and store new character data when cache is empty', async () => {
      mockFileCache.getCharacters.mockResolvedValue(null);
      mockPoEClient.fetchCharacterLadder.mockResolvedValue(mockLadderResponse);
      mockPoEClient.fetchCharacterDetails
        .mockResolvedValueOnce(mockCharacterDetails)
        .mockResolvedValueOnce(mockCharacterDetails); // Both characters succeed
      mockFileCache.storeCharacters.mockResolvedValue(undefined);
      mockFileCache.cleanupOldEntries.mockResolvedValue(undefined);

      const request = createMockRequest({ league: 'Standard', limit: 100 });
      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.stats.fromCache).toBe(false);
      expect(result.data.stats.successful).toBe(2);
      expect(result.data.stats.failed).toBe(0);

      expect(mockPoEClient.fetchCharacterLadder).toHaveBeenCalledWith('Standard', 100);
      expect(mockPoEClient.fetchCharacterDetails).toHaveBeenCalledWith('TestAccount1', 'TestChar1');
      expect(mockFileCache.storeCharacters).toHaveBeenCalled();
      expect(mockFileCache.cleanupOldEntries).toHaveBeenCalled();
    });

    it('should handle character detail fetch failures gracefully', async () => {
      mockFileCache.getCharacters.mockResolvedValue(null);
      mockPoEClient.fetchCharacterLadder.mockResolvedValue(mockLadderResponse);
      mockPoEClient.fetchCharacterDetails
        .mockResolvedValueOnce(mockCharacterDetails)
        .mockRejectedValueOnce(new Error('Character details not found'));

      const request = createMockRequest({ league: 'Standard', limit: 100 });
      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.stats.successful).toBe(1);
      expect(result.data.stats.failed).toBe(1);
      expect(ApiLogger.logError).toHaveBeenCalledWith(
        'character_detail_fetch',
        expect.any(Error),
        expect.objectContaining({
          characterName: 'TestChar2',
          accountName: 'TestAccount2',
          league: 'Standard'
        })
      );
    });

    it('should use default values for missing parameters', async () => {
      mockFileCache.getCharacters.mockResolvedValue(null);
      mockPoEClient.fetchCharacterLadder.mockResolvedValue({ entries: [] });

      const request = createMockRequest({}); // Empty body
      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(mockPoEClient.fetchCharacterLadder).toHaveBeenCalledWith('Standard', 100);
    });

    it('should limit the number of characters to 200', async () => {
      mockFileCache.getCharacters.mockResolvedValue(null);
      mockPoEClient.fetchCharacterLadder.mockResolvedValue({ entries: [] });

      const request = createMockRequest({ league: 'Standard', limit: 500 });
      await POST(request);

      expect(mockPoEClient.fetchCharacterLadder).toHaveBeenCalledWith('Standard', 200);
    });

    it('should handle API client failures', async () => {
      mockFileCache.getCharacters.mockResolvedValue(null);
      mockPoEClient.fetchCharacterLadder.mockRejectedValue(new Error('API rate limit exceeded'));

      const request = createMockRequest({ league: 'Standard', limit: 100 });
      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch character data');
      expect(result.details).toBe('API rate limit exceeded');
      expect(ApiLogger.logError).toHaveBeenCalledWith(
        'character_fetch_failure',
        expect.any(Error),
        expect.any(Object)
      );
    });

    it('should handle invalid JSON in request', async () => {
      const request = {
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
      } as any;

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch character data');
    });

    it('should log all operations correctly', async () => {
      mockFileCache.getCharacters.mockResolvedValue(null);
      mockPoEClient.fetchCharacterLadder.mockResolvedValue({ entries: [] });
      mockFileCache.storeCharacters.mockResolvedValue(undefined);
      mockFileCache.cleanupOldEntries.mockResolvedValue(undefined);

      const request = createMockRequest({ league: 'Standard', limit: 50 });
      await POST(request);

      expect(ApiLogger.logCacheOperation).toHaveBeenCalledWith('read', { league: 'Standard' });
      expect(ApiLogger.logCharacterFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          league: 'Standard',
          requested: 50,
          successful: 0,
          failed: 0,
          fromCache: false,
          cacheHit: false
        })
      );
    });
  });
});