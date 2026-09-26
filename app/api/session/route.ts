import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/utils/session';
import { ApiLogger } from '@/lib/utils/logger';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { poesessid } = await request.json();

    if (!poesessid) {
      return NextResponse.json(
        { success: false, error: 'POESESSID is required' },
        { status: 400 }
      );
    }

    if (typeof poesessid !== 'string' || poesessid.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid POESESSID format' },
        { status: 400 }
      );
    }

    // Set as environment variable for server-side access
    process.env.POESESSID = poesessid.trim();

    ApiLogger.logCacheOperation('write', {
      context: 'session_storage',
      storage_type: 'environment'
    });

    return NextResponse.json({
      success: true,
      message: 'Session stored successfully'
    });

  } catch (error) {
    ApiLogger.logError('session_store_failed', error as Error, {
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { success: false, error: 'Failed to store session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const hasValidSession = !!(process.env.POESESSID && process.env.POESESSID.trim().length > 0);

    return NextResponse.json({
      success: true,
      hasValidSession,
      message: hasValidSession ? 'Valid session found' : 'No valid session'
    });

  } catch (error) {
    ApiLogger.logError('session_check_failed', error as Error);

    return NextResponse.json(
      { success: false, error: 'Failed to check session' },
      { status: 500 }
    );
  }
}

export async function DELETE(): Promise<NextResponse> {
  try {
    // Clear environment variable
    delete process.env.POESESSID;

    ApiLogger.logCacheOperation('write', {
      context: 'session_clear',
      storage_type: 'environment'
    });

    return NextResponse.json({
      success: true,
      message: 'Session cleared successfully'
    });

  } catch (error) {
    ApiLogger.logError('session_clear_failed', error as Error);

    return NextResponse.json(
      { success: false, error: 'Failed to clear session' },
      { status: 500 }
    );
  }
}