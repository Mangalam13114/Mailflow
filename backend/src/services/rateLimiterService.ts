import redisConnection from '../config/redis';
import config from '../config/env';

// ================================
// RATE LIMITER SERVICE
// Uses Redis to track emails sent per hour
// ================================
class RateLimiterService {
  
  /**
   * Get the current hour window key
   * Format: rate_limit:YYYY-MM-DD-HH
   */
  private getHourKey(userId?: string): string {
    const now = new Date();
    const hourWindow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}`;
    
    if (userId) {
      return `rate_limit:${userId}:${hourWindow}`;
    }
    return `rate_limit:global:${hourWindow}`;
  }

  /**
   * Check if we can send more emails this hour
   */
  async canSendEmail(userId?: string): Promise<{
    allowed: boolean;
    currentCount: number;
    limit: number;
    remainingInHour: number;
    resetInSeconds: number;
  }> {
    const key = this.getHourKey(userId);
    const currentCount = await redisConnection.get(key);
    const count = parseInt(currentCount || '0');
    const limit = config.maxEmailsPerHour;

    // Calculate seconds until next hour
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    const resetInSeconds = Math.ceil((nextHour.getTime() - now.getTime()) / 1000);

    return {
      allowed: count < limit,
      currentCount: count,
      limit,
      remainingInHour: Math.max(0, limit - count),
      resetInSeconds,
    };
  }

  /**
   * Increment the email count for current hour
   */
  async incrementCount(userId?: string): Promise<number> {
    const key = this.getHourKey(userId);
    
    // Increment and set expiry (1 hour + buffer)
    const newCount = await redisConnection.incr(key);
    
    // Set expiry to 2 hours (so it auto-cleans)
    await redisConnection.expire(key, 7200);
    
    return newCount;
  }

  /**
   * Get current count for this hour
   */
  async getCurrentCount(userId?: string): Promise<number> {
    const key = this.getHourKey(userId);
    const count = await redisConnection.get(key);
    return parseInt(count || '0');
  }

  /**
   * Calculate delay needed if rate limit is hit
   * Returns milliseconds to wait until next hour window
   */
  async getDelayUntilNextWindow(): Promise<number> {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    
    return nextHour.getTime() - now.getTime();
  }

  /**
   * Get rate limit stats for monitoring
   */
  async getStats(userId?: string) {
    const status = await this.canSendEmail(userId);
    
    return {
      ...status,
      hourWindow: this.getHourKey(userId),
      maxPerHour: config.maxEmailsPerHour,
      delayBetweenEmails: config.emailDelayMs,
      workerConcurrency: config.workerConcurrency,
    };
  }
}

export default new RateLimiterService();