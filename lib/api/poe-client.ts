import { RateLimiter } from './rate-limiter';
import { ApiLogger } from '@/lib/utils/logger';

interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

interface PoEClientOptions {
  rateLimiter?: RateLimiter;
  retryOptions?: RetryOptions;
  timeoutMs?: number;
}

export interface CharacterLadderResponse {
  entries: Array<{
    character: {
      id: string;
      name: string;
      level: number;
      class: string;
      league: string;
      experience: number;
    };
    account: {
      name: string;
    };
    depth?: number;
  }>;
}

export interface CharacterDetailsResponse {
  character: {
    name: string;
    league: string;
    classId: number;
    ascendancyClass: number;
    class: string;
    level: number;
    experience: number;
  };
  items: Array<{
    verified: boolean;
    w: number;
    h: number;
    icon: string;
    league: string;
    id: string;
    name: string;
    typeLine: string;
    baseType: string;
    identified: boolean;
    ilvl: number;
    corrupted?: boolean;
    properties?: Array<{
      name: string;
      values: Array<[string, number]>;
      displayMode: number;
      type: number;
    }>;
    requirements?: Array<{
      name: string;
      values: Array<[string, number]>;
      displayMode: number;
      type: number;
    }>;
    implicitMods?: string[];
    explicitMods?: string[];
    craftedMods?: string[];
    enchantMods?: string[];
    frameType: number;
    x: number;
    y: number;
    inventoryId: string;
    socketedItems?: any[];
    sockets?: Array<{
      group: number;
      attr: string;
      sColour: string;
    }>;
  }>;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000
};

const DEFAULT_RATE_LIMITER = new RateLimiter({
  requestsPerSecond: 5,
  burstLimit: 10
});

export class PoEApiClient {
  private readonly baseUrl = 'https://www.pathofexile.com/api';
  private readonly rateLimiter: RateLimiter;
  private readonly retryOptions: RetryOptions;
  private readonly timeoutMs: number;

  constructor(options: PoEClientOptions = {}) {
    this.rateLimiter = options.rateLimiter || DEFAULT_RATE_LIMITER;
    this.retryOptions = options.retryOptions || DEFAULT_RETRY_OPTIONS;
    this.timeoutMs = options.timeoutMs || 30000;
  }

  async fetchCharacterLadder(league: string, limit = 200, offset = 0): Promise<CharacterLadderResponse> {
    const url = `${this.baseUrl}/ladders/${encodeURIComponent(league)}`;
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });

    return this.makeRequest<CharacterLadderResponse>(`${url}?${params}`);
  }

  async fetchCharacterDetails(accountName: string, characterName: string): Promise<CharacterDetailsResponse> {
    const url = `${this.baseUrl}/character-window/get-items`;
    const params = new URLSearchParams({
      accountName: encodeURIComponent(accountName),
      character: encodeURIComponent(characterName)
    });

    return this.makeRequest<CharacterDetailsResponse>(`${url}?${params}`);
  }

  private async makeRequest<T>(url: string): Promise<T> {
    const startTime = Date.now();

    await this.rateLimiter.waitForToken();

    ApiLogger.logRateLimit(url, this.rateLimiter.getRemainingTokens());

    return this.executeWithRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'POE-Profit-Assistant/1.0'
          }
        });

        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;

        if (!response.ok) {
          ApiLogger.logApiFailure(url, response.status, response.statusText);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        ApiLogger.logApiCall({
          endpoint: url,
          method: 'GET',
          duration,
          statusCode: response.status,
          rateLimitRemaining: this.rateLimiter.getRemainingTokens()
        });

        const data = await response.json();
        return data as T;
      } catch (error) {
        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;

        if (error instanceof Error && error.name === 'AbortError') {
          ApiLogger.logError('request_timeout', new Error(`Request timeout after ${this.timeoutMs}ms`), { url, duration });
          throw new Error(`Request timeout after ${this.timeoutMs}ms`);
        }

        throw error;
      }
    });
  }

  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error = new Error('No attempts made');

    for (let attempt = 0; attempt <= this.retryOptions.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === this.retryOptions.maxRetries) {
          break;
        }

        // Don't retry on client errors (4xx)
        if (lastError.message.includes('HTTP 4')) {
          break;
        }

        const delay = Math.min(
          this.retryOptions.baseDelayMs * Math.pow(2, attempt),
          this.retryOptions.maxDelayMs
        );

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}