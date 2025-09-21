import { ApiLogger } from './logger';

interface TriggerOptions {
  apiUrl?: string;
  timeout?: number;
}

interface TriggerResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class ManualTrigger {
  private readonly apiUrl: string;
  private readonly timeout: number;

  constructor(options: TriggerOptions = {}) {
    this.apiUrl = options.apiUrl || 'http://localhost:3000/api';
    this.timeout = options.timeout || 30000;
  }

  async triggerCharacterFetch(league: string = 'Standard', limit: number = 100): Promise<TriggerResult> {
    const startTime = Date.now();

    try {
      ApiLogger.logCacheOperation('trigger_start', { league, limit });

      const response = await fetch(`${this.apiUrl}/characters/fetch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ league, limit }),
        signal: AbortSignal.timeout(this.timeout)
      });

      const result = await response.json();
      const duration = Date.now() - startTime;

      if (response.ok) {
        ApiLogger.logCharacterFetch({
          league,
          requested: limit,
          successful: result.data?.stats?.successful || 0,
          failed: result.data?.stats?.failed || 0,
          duration,
          fromCache: result.data?.stats?.fromCache || false
        });

        return {
          success: true,
          message: result.message,
          data: result.data
        };
      } else {
        ApiLogger.logError('trigger_failure', new Error(result.error), {
          league,
          limit,
          duration,
          statusCode: response.status
        });

        return {
          success: false,
          message: 'Character fetch failed',
          error: result.error || 'Unknown error'
        };
      }

    } catch (error) {
      const duration = Date.now() - startTime;

      ApiLogger.logError('trigger_exception', error as Error, {
        league,
        limit,
        duration
      });

      return {
        success: false,
        message: 'Character fetch failed with exception',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getCacheInfo(): Promise<TriggerResult> {
    try {
      const response = await fetch(`${this.apiUrl}/cache/info`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.timeout)
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: 'Cache info retrieved successfully',
          data: result
        };
      } else {
        return {
          success: false,
          message: 'Failed to get cache info',
          error: result.error || 'Unknown error'
        };
      }

    } catch (error) {
      return {
        success: false,
        message: 'Failed to get cache info',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}