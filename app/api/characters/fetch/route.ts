import { NextRequest, NextResponse } from 'next/server';
import { PoEApiClient } from '@/lib/api/poe-client';
import { Character } from '@/lib/types/character';
import { FileCache } from '@/lib/cache/file-cache';
import { ItemNormalizer } from '@/lib/api/item-normalizer';
import { ApiLogger } from '@/lib/utils/logger';

interface CharacterFetchRequest {
  league?: string;
  limit?: number;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    const body = await request.json() as CharacterFetchRequest;
    const league = body.league || 'Standard';
    const limit = Math.min(body.limit || 100, 200);

    const poeClient = new PoEApiClient();
    const fileCache = new FileCache();

    // Check cache first
    ApiLogger.logCacheOperation('read', { league });
    const cachedCharacters = await fileCache.getCharacters(league);
    if (cachedCharacters) {
      const duration = Date.now() - startTime;

      ApiLogger.logCharacterFetch({
        league,
        requested: limit,
        successful: cachedCharacters.length,
        failed: 0,
        duration,
        fromCache: true,
        cacheHit: true
      });

      return NextResponse.json({
        success: true,
        message: `Retrieved ${cachedCharacters.length} characters from cache for ${league} league`,
        data: {
          characters: cachedCharacters,
          stats: {
            total: cachedCharacters.length,
            successful: cachedCharacters.length,
            failed: 0,
            fromCache: true
          }
        }
      });
    }

    // Fetch ladder data
    const ladderResponse = await poeClient.fetchCharacterLadder(league, limit);

    const characters: Character[] = [];
    let successCount = 0;
    let errorCount = 0;

    // Process ladder data - try to fetch detailed character data but fallback to ladder data only
    const detailErrors: Array<{character: string, account: string, error: string}> = [];

    for (const entry of ladderResponse.entries) {
      let characterItems: any[] = [];
      let hasDetailedData = false;
      let errorDetails = '';

      // Try to fetch character details (this may fail due to private profiles)
      try {
        const characterDetails = await poeClient.fetchCharacterDetails(
          entry.account.name,
          entry.character.name
        );
        characterItems = ItemNormalizer.normalizeItems(characterDetails.items);
        hasDetailedData = true;
      } catch (error) {
        // Character details failed (likely private profile), use ladder data only
        errorDetails = error instanceof Error ? error.message : 'Unknown error';
        detailErrors.push({
          character: entry.character.name,
          account: entry.account.name,
          error: errorDetails
        });

        ApiLogger.logError('character_detail_fetch', error as Error, {
          characterName: entry.character.name,
          accountName: entry.account.name,
          league,
          fallbackToLadderData: true,
          errorMessage: errorDetails
        });
        // Don't increment errorCount - this is expected for private profiles
      }

      // Create character record (with or without detailed item data)
      const character: Character = {
        id: entry.character.id,
        name: entry.character.name,
        level: entry.character.level,
        class: entry.character.class,
        league: league, // Use the league parameter since it's not in the ladder API response
        experience: entry.character.experience,
        depth: entry.depth,
        accountName: entry.account.name,
        fetchedAt: new Date(),
        items: characterItems, // Empty array if character details failed
        skills: [] // Skills will be implemented in future story
      };

      characters.push(character);
      if (hasDetailedData) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    // Store characters in cache
    if (characters.length > 0) {
      ApiLogger.logCacheOperation('write', { league, characterCount: characters.length });
      await fileCache.storeCharacters(league, characters);

      ApiLogger.logCacheOperation('cleanup', {});
      await fileCache.cleanupOldEntries();
    }

    const duration = Date.now() - startTime;

    ApiLogger.logCharacterFetch({
      league,
      requested: limit,
      successful: successCount,
      failed: errorCount,
      duration,
      fromCache: false,
      cacheHit: false
    });

    return NextResponse.json({
      success: true,
      message: `Successfully fetched ${successCount} characters from ${league} league`,
      data: {
        characters,
        stats: {
          total: ladderResponse.entries.length,
          successful: successCount,
          failed: errorCount,
          fromCache: false
        }
      },
      debug: {
        detailErrors: detailErrors.slice(0, 5), // First 5 errors for debugging
        totalDetailErrors: detailErrors.length
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;

    ApiLogger.logError('character_fetch_failure', error as Error, {
      duration
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch character data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

