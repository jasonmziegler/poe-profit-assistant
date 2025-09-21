interface RateLimitOptions {
  requestsPerSecond: number;
  burstLimit: number;
}

interface RateLimitState {
  tokens: number;
  lastRefill: number;
}

export class RateLimiter {
  private readonly maxTokens: number;
  private readonly refillRate: number;
  private state: RateLimitState;

  constructor(options: RateLimitOptions) {
    this.maxTokens = options.burstLimit;
    this.refillRate = options.requestsPerSecond;
    this.state = {
      tokens: this.maxTokens,
      lastRefill: Date.now()
    };
  }

  async waitForToken(): Promise<void> {
    this.refillTokens();

    if (this.state.tokens >= 1) {
      this.state.tokens -= 1;
      return;
    }

    const waitTime = (1 / this.refillRate) * 1000;
    await new Promise(resolve => setTimeout(resolve, waitTime));
    return this.waitForToken();
  }

  private refillTokens(): void {
    const now = Date.now();
    const timePassed = now - this.state.lastRefill;
    const tokensToAdd = (timePassed / 1000) * this.refillRate;

    this.state.tokens = Math.min(this.maxTokens, this.state.tokens + tokensToAdd);
    this.state.lastRefill = now;
  }

  getRemainingTokens(): number {
    this.refillTokens();
    return Math.floor(this.state.tokens);
  }
}