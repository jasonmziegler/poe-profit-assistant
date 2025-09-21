import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { Character } from '@/lib/types/character';

const CharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.number(),
  class: z.string(),
  league: z.string(),
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    baseType: z.string(),
    itemLevel: z.number(),
    rarity: z.enum(['Normal', 'Magic', 'Rare', 'Unique']),
    category: z.string(),
    sockets: z.object({
      total: z.number(),
      links: z.number(),
      colors: z.string()
    }).optional(),
    mods: z.array(z.string()),
    implicitMods: z.array(z.string()).optional(),
    explicitMods: z.array(z.string()).optional(),
    corrupted: z.boolean(),
    identified: z.boolean()
  })),
  skills: z.array(z.object({
    name: z.string(),
    level: z.number(),
    support: z.boolean()
  })),
  experience: z.number(),
  depth: z.number().optional(),
  fetchedAt: z.string().transform(str => new Date(str)),
  accountName: z.string().optional()
});

const CacheMetadataSchema = z.object({
  league: z.string(),
  fetchedAt: z.string().transform(str => new Date(str)),
  characterCount: z.number(),
  version: z.string()
});

interface CacheEntry {
  characters: Character[];
  metadata: {
    league: string;
    fetchedAt: Date;
    characterCount: number;
    version: string;
  };
}

interface CacheOptions {
  maxAgeHours?: number;
  maxEntries?: number;
}

const DEFAULT_OPTIONS: CacheOptions = {
  maxAgeHours: 24,
  maxEntries: 100
};

export class FileCache {
  private readonly cacheDir: string;
  private readonly options: CacheOptions;

  constructor(cacheDir: string = 'data/cache', options: CacheOptions = {}) {
    this.cacheDir = path.resolve(cacheDir);
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async ensureCacheDir(): Promise<void> {
    try {
      await fs.access(this.cacheDir);
    } catch {
      await fs.mkdir(this.cacheDir, { recursive: true });
    }
  }

  async storeCharacters(league: string, characters: Character[]): Promise<void> {
    await this.ensureCacheDir();

    const validatedCharacters = characters.map(char => this.validateCharacter(char));

    const cacheEntry: CacheEntry = {
      characters: validatedCharacters,
      metadata: {
        league,
        fetchedAt: new Date(),
        characterCount: validatedCharacters.length,
        version: '1.0'
      }
    };

    const filename = this.generateFilename(league);
    const filepath = path.join(this.cacheDir, filename);

    await fs.writeFile(filepath, JSON.stringify(cacheEntry, null, 2), 'utf-8');
  }

  async getCharacters(league: string): Promise<Character[] | null> {
    const filename = this.generateFilename(league);
    const filepath = path.join(this.cacheDir, filename);

    try {
      const fileContent = await fs.readFile(filepath, 'utf-8');
      const rawData = JSON.parse(fileContent);

      // Validate metadata
      const metadata = CacheMetadataSchema.parse(rawData.metadata);

      // Check if cache is still valid
      if (this.isCacheExpired(metadata.fetchedAt)) {
        return null;
      }

      // Validate and return characters
      const characters = rawData.characters.map((char: any) => this.validateCharacter(char));
      return characters;

    } catch (error) {
      // File doesn't exist or is invalid
      return null;
    }
  }

  async cleanupOldEntries(): Promise<void> {
    await this.ensureCacheDir();

    try {
      const files = await fs.readdir(this.cacheDir);
      const cacheFiles = files.filter(file => file.endsWith('.json'));

      const fileStats = await Promise.all(
        cacheFiles.map(async file => {
          const filepath = path.join(this.cacheDir, file);
          const stats = await fs.stat(filepath);
          return { file, filepath, mtime: stats.mtime };
        })
      );

      // Sort by modification time (newest first)
      fileStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      // Remove old entries if we exceed maxEntries
      if (this.options.maxEntries && fileStats.length > this.options.maxEntries) {
        const filesToDelete = fileStats.slice(this.options.maxEntries);
        await Promise.all(
          filesToDelete.map(({ filepath }) => fs.unlink(filepath))
        );
      }

      // Remove expired entries
      const cutoffDate = new Date(Date.now() - (this.options.maxAgeHours! * 60 * 60 * 1000));
      const expiredFiles = fileStats.filter(({ mtime }) => mtime < cutoffDate);
      await Promise.all(
        expiredFiles.map(({ filepath }) => fs.unlink(filepath))
      );

    } catch (error) {
      // Silently handle cache cleanup errors
      // In production, this would be logged via the logging system
    }
  }

  async getCacheInfo(): Promise<{ totalEntries: number; totalSizeBytes: number }> {
    await this.ensureCacheDir();

    try {
      const files = await fs.readdir(this.cacheDir);
      const cacheFiles = files.filter(file => file.endsWith('.json'));

      const fileStats = await Promise.all(
        cacheFiles.map(async file => {
          const filepath = path.join(this.cacheDir, file);
          const stats = await fs.stat(filepath);
          return stats.size;
        })
      );

      return {
        totalEntries: cacheFiles.length,
        totalSizeBytes: fileStats.reduce((total, size) => total + size, 0)
      };

    } catch {
      return { totalEntries: 0, totalSizeBytes: 0 };
    }
  }

  private validateCharacter(character: any): Character {
    return CharacterSchema.parse({
      ...character,
      fetchedAt: character.fetchedAt instanceof Date
        ? character.fetchedAt.toISOString()
        : character.fetchedAt
    });
  }

  private generateFilename(league: string): string {
    const sanitized = league.replace(/[^a-zA-Z0-9-_]/g, '_');
    const timestamp = new Date().toISOString().split('T')[0];
    return `characters_${sanitized}_${timestamp}.json`;
  }

  private isCacheExpired(fetchedAt: Date): boolean {
    if (!this.options.maxAgeHours) return false;

    const maxAge = this.options.maxAgeHours * 60 * 60 * 1000;
    return (Date.now() - fetchedAt.getTime()) > maxAge;
  }
}