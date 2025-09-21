import { NextResponse } from 'next/server';
import { FileCache } from '@/lib/cache/file-cache';
import { ApiLogger } from '@/lib/utils/logger';

export async function GET(): Promise<NextResponse> {
  try {
    const fileCache = new FileCache();
    const cacheInfo = await fileCache.getCacheInfo();

    ApiLogger.logCacheOperation('info_request', cacheInfo);

    return NextResponse.json({
      success: true,
      message: 'Cache info retrieved successfully',
      data: cacheInfo
    });

  } catch (error) {
    ApiLogger.logError('cache_info_failure', error as Error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve cache information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}