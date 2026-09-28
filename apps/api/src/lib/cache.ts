/**
 * Lightweight High-Performance In-Memory Cache with TTL & Tag-based Invalidation
 * 
 * Dramatically reduces cross-continental database latency (US-East-2 <-> India round trips)
 * for read-heavy, low-frequency mutation endpoints (Profile, Dashboard stats, Application lists).
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  tags: string[];
}

class MemoryCache {
  private store = new Map<string, CacheEntry<any>>();

  set<T>(key: string, value: T, ttlSeconds: number, tags: string[] = []): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
      tags,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidateTag(tag: string): void {
    for (const [key, entry] of this.store.entries()) {
      if (entry.tags.includes(tag)) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }

  async getOrCompute<T>(
    key: string,
    ttlSeconds: number,
    computeFn: () => Promise<T>,
    tags: string[] = []
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await computeFn();
    this.set(key, value, ttlSeconds, tags);
    return value;
  }
}

export const apiCache = new MemoryCache();

// Standard Cache Tags for coordinated invalidation
export const CACHE_TAGS = {
  PROFILE: 'profile',
  DASHBOARD: 'dashboard',
  APPLICATIONS: 'applications',
  JOBS: 'jobs',
  OPPORTUNITIES: 'opportunities',
  INTERVIEWS: 'interviews',
} as const;
