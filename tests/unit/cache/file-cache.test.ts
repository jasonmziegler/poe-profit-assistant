import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FileCache } from '@/lib/cache/file-cache';
import { Character } from '@/lib/types/character';
import fs from 'fs/promises';
import path from 'path';

// Mock fs module
vi.mock('fs/promises', () => ({
  default: {
    access: vi.fn(),
    mkdir: vi.fn(),
    writeFile: vi.fn(),
    readFile: vi.fn(),
    readdir: vi.fn(),
    stat: vi.fn(),
    unlink: vi.fn()
  },
  access: vi.fn(),
  mkdir: vi.fn(),
  writeFile: vi.fn(),
  readFile: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
  unlink: vi.fn()
}));

describe('FileCache', () => {
  let fileCache: FileCache;
  const testCacheDir = 'test-cache';

  const mockCharacter: Character = {
    id: 'test-char-1',
    name: 'TestCharacter',
    level: 95,
    class: 'Witch',
    league: 'Standard',
    experience: 1500000000,
    fetchedAt: new Date('2023-01-01T00:00:00Z'),
    items: [
      {
        id: 'item-1',
        name: 'Test Item',
        baseType: 'Test Base',
        itemLevel: 85,
        rarity: 'Unique' as const,
        category: 'weapon',
        mods: ['Test mod'],
        corrupted: false,
        identified: true
      }
    ],
    skills: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
    fileCache = new FileCache(testCacheDir);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('ensureCacheDir', () => {
    it('should create cache directory if it does not exist', async () => {
      const mockAccess = vi.mocked(fs.access);
      const mockMkdir = vi.mocked(fs.mkdir);

      mockAccess.mockRejectedValue(new Error('Directory does not exist'));
      mockMkdir.mockResolvedValue(undefined);

      await fileCache.ensureCacheDir();

      expect(mockAccess).toHaveBeenCalledWith(path.resolve(testCacheDir));
      expect(mockMkdir).toHaveBeenCalledWith(path.resolve(testCacheDir), { recursive: true });
    });

    it('should not create directory if it already exists', async () => {
      const mockAccess = vi.mocked(fs.access);
      const mockMkdir = vi.mocked(fs.mkdir);

      mockAccess.mockResolvedValue(undefined);

      await fileCache.ensureCacheDir();

      expect(mockAccess).toHaveBeenCalled();
      expect(mockMkdir).not.toHaveBeenCalled();
    });
  });

  describe('storeCharacters', () => {
    it('should store characters with correct metadata', async () => {
      const mockWriteFile = vi.mocked(fs.writeFile);
      const mockAccess = vi.mocked(fs.access);

      mockAccess.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);

      await fileCache.storeCharacters('Standard', [mockCharacter]);

      expect(mockWriteFile).toHaveBeenCalled();
      const [filePath, content] = mockWriteFile.mock.calls[0];

      expect(filePath).toMatch(/characters_Standard_\d{4}-\d{2}-\d{2}\.json$/);

      const parsedContent = JSON.parse(content as string);
      expect(parsedContent.characters).toHaveLength(1);
      expect(parsedContent.metadata.league).toBe('Standard');
      expect(parsedContent.metadata.characterCount).toBe(1);
      expect(parsedContent.metadata.version).toBe('1.0');
    });

    it('should validate character data before storing', async () => {
      const mockWriteFile = vi.mocked(fs.writeFile);
      const mockAccess = vi.mocked(fs.access);

      mockAccess.mockResolvedValue(undefined);

      const invalidCharacter = {
        ...mockCharacter,
        level: 'invalid' // Invalid type
      } as any;

      await expect(fileCache.storeCharacters('Standard', [invalidCharacter]))
        .rejects.toThrow();

      expect(mockWriteFile).not.toHaveBeenCalled();
    });
  });

  describe('getCharacters', () => {
    it('should return cached characters if cache is valid', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockAccess = vi.mocked(fs.access);

      mockAccess.mockResolvedValue(undefined);

      const cacheData = {
        characters: [mockCharacter],
        metadata: {
          league: 'Standard',
          fetchedAt: new Date().toISOString(),
          characterCount: 1,
          version: '1.0'
        }
      };

      mockReadFile.mockResolvedValue(JSON.stringify(cacheData));

      const result = await fileCache.getCharacters('Standard');

      expect(result).toHaveLength(1);
      expect(result![0].name).toBe('TestCharacter');
    });

    it('should return null if cache is expired', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockAccess = vi.mocked(fs.access);

      mockAccess.mockResolvedValue(undefined);

      // Create expired cache (25 hours ago)
      const expiredDate = new Date(Date.now() - 25 * 60 * 60 * 1000);
      const cacheData = {
        characters: [mockCharacter],
        metadata: {
          league: 'Standard',
          fetchedAt: expiredDate.toISOString(),
          characterCount: 1,
          version: '1.0'
        }
      };

      mockReadFile.mockResolvedValue(JSON.stringify(cacheData));

      const result = await fileCache.getCharacters('Standard');

      expect(result).toBeNull();
    });

    it('should return null if cache file does not exist', async () => {
      const mockReadFile = vi.mocked(fs.readFile);

      mockReadFile.mockRejectedValue(new Error('File not found'));

      const result = await fileCache.getCharacters('Standard');

      expect(result).toBeNull();
    });

    it('should return null if cache data is invalid', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockAccess = vi.mocked(fs.access);

      mockAccess.mockResolvedValue(undefined);
      mockReadFile.mockResolvedValue('invalid json');

      const result = await fileCache.getCharacters('Standard');

      expect(result).toBeNull();
    });
  });

  describe('cleanupOldEntries', () => {
    it('should remove entries exceeding maxEntries limit', async () => {
      const mockReaddir = vi.mocked(fs.readdir);
      const mockStat = vi.mocked(fs.stat);
      const mockUnlink = vi.mocked(fs.unlink);
      const mockAccess = vi.mocked(fs.access);

      mockAccess.mockResolvedValue(undefined);

      // Create cache with maxEntries = 2
      const limitedCache = new FileCache(testCacheDir, { maxEntries: 2 });

      // Mock 4 cache files
      mockReaddir.mockResolvedValue(['file1.json', 'file2.json', 'file3.json', 'file4.json'] as any);

      const now = new Date();
      const stats = [
        { mtime: new Date(now.getTime() - 1000) }, // newest
        { mtime: new Date(now.getTime() - 2000) },
        { mtime: new Date(now.getTime() - 3000) },
        { mtime: new Date(now.getTime() - 4000) }  // oldest
      ];

      mockStat.mockImplementation((filepath) => {
        const filename = path.basename(filepath as string);
        const index = ['file1.json', 'file2.json', 'file3.json', 'file4.json'].indexOf(filename);
        return Promise.resolve(stats[index] as any);
      });

      mockUnlink.mockResolvedValue(undefined);

      await limitedCache.cleanupOldEntries();

      // Should delete the 2 oldest files
      expect(mockUnlink).toHaveBeenCalledTimes(2);
    });

    it('should remove expired entries', async () => {
      const mockReaddir = vi.mocked(fs.readdir);
      const mockStat = vi.mocked(fs.stat);
      const mockUnlink = vi.mocked(fs.unlink);
      const mockAccess = vi.mocked(fs.access);

      mockAccess.mockResolvedValue(undefined);

      // Create cache with maxAgeHours = 1
      const shortCache = new FileCache(testCacheDir, { maxAgeHours: 1 });

      mockReaddir.mockResolvedValue(['expired.json', 'valid.json'] as any);

      const now = new Date();
      mockStat
        .mockResolvedValueOnce({ mtime: new Date(now.getTime() - 2 * 60 * 60 * 1000) } as any) // 2 hours ago (expired)
        .mockResolvedValueOnce({ mtime: new Date(now.getTime() - 30 * 60 * 1000) } as any); // 30 minutes ago (valid)

      mockUnlink.mockResolvedValue(undefined);

      await shortCache.cleanupOldEntries();

      // Should delete only the expired file
      expect(mockUnlink).toHaveBeenCalledTimes(1);
      expect(mockUnlink).toHaveBeenCalledWith(expect.stringContaining('expired.json'));
    });
  });

  describe('getCacheInfo', () => {
    it('should return cache statistics', async () => {
      const mockReaddir = vi.mocked(fs.readdir);
      const mockStat = vi.mocked(fs.stat);
      const mockAccess = vi.mocked(fs.access);

      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue(['file1.json', 'file2.json', 'other.txt'] as any);

      mockStat
        .mockResolvedValueOnce({ size: 1000 } as any)
        .mockResolvedValueOnce({ size: 2000 } as any);

      const result = await fileCache.getCacheInfo();

      expect(result.totalEntries).toBe(2); // Only .json files counted
      expect(result.totalSizeBytes).toBe(3000);
    });

    it('should return zero stats if directory does not exist', async () => {
      const mockReaddir = vi.mocked(fs.readdir);

      mockReaddir.mockRejectedValue(new Error('Directory not found'));

      const result = await fileCache.getCacheInfo();

      expect(result.totalEntries).toBe(0);
      expect(result.totalSizeBytes).toBe(0);
    });
  });
});