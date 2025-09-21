import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RateLimiter } from '@/lib/api/rate-limiter';

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow requests when tokens are available', async () => {
    const limiter = new RateLimiter({
      requestsPerSecond: 5,
      burstLimit: 10
    });

    const startTime = Date.now();
    await limiter.waitForToken();
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(10);
    expect(limiter.getRemainingTokens()).toBe(9);
  });

  it('should rate limit when burst limit is exceeded', async () => {
    const limiter = new RateLimiter({
      requestsPerSecond: 1,
      burstLimit: 2
    });

    // Use up burst tokens
    await limiter.waitForToken();
    await limiter.waitForToken();

    expect(limiter.getRemainingTokens()).toBe(0);

    // Next request should be delayed
    const promise = limiter.waitForToken();

    // Advance time by 1 second to allow token refill
    vi.advanceTimersByTime(1000);

    await promise;
    expect(limiter.getRemainingTokens()).toBe(0);
  });

  it('should refill tokens over time', async () => {
    const limiter = new RateLimiter({
      requestsPerSecond: 2,
      burstLimit: 5
    });

    // Use up all tokens
    for (let i = 0; i < 5; i++) {
      await limiter.waitForToken();
    }

    expect(limiter.getRemainingTokens()).toBe(0);

    // Advance time by 1 second
    vi.advanceTimersByTime(1000);

    // Should have 2 tokens available
    expect(limiter.getRemainingTokens()).toBe(2);
  });

  it('should not exceed burst limit when refilling', async () => {
    const limiter = new RateLimiter({
      requestsPerSecond: 10,
      burstLimit: 3
    });

    // Use one token
    await limiter.waitForToken();
    expect(limiter.getRemainingTokens()).toBe(2);

    // Advance time by 5 seconds (should generate 50 tokens, but capped at burst limit)
    vi.advanceTimersByTime(5000);

    // Should not exceed burst limit
    expect(limiter.getRemainingTokens()).toBe(3);
  });

  it('should handle multiple concurrent requests correctly', async () => {
    const limiter = new RateLimiter({
      requestsPerSecond: 1,
      burstLimit: 2
    });

    const promises = [
      limiter.waitForToken(),
      limiter.waitForToken(),
      limiter.waitForToken()
    ];

    // First two should resolve immediately
    await Promise.all(promises.slice(0, 2));
    expect(limiter.getRemainingTokens()).toBe(0);

    // Third should be waiting
    let thirdResolved = false;
    promises[2].then(() => { thirdResolved = true; });

    // Advance time slightly - third should still be waiting
    vi.advanceTimersByTime(500);
    await vi.runAllTimersAsync();
    expect(thirdResolved).toBe(false);

    // Advance time by full second - third should resolve
    vi.advanceTimersByTime(500);
    await vi.runAllTimersAsync();
    expect(thirdResolved).toBe(true);
  });
});

