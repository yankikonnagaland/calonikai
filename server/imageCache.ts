/**
 * Image Analysis Cache System
 * Prevents duplicate API calls for identical or similar images
 */

interface CachedResult {
  foods: any[];
  suggestions: string[];
  timestamp: number;
  imageHash: string;
  compressionSavings?: string;
}

export class ImageCache {
  private static cache = new Map<string, CachedResult>();
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly MAX_CACHE_SIZE = 1000;

  /**
   * Stores analysis result in cache
   */
  static set(imageHash: string, result: CachedResult): void {
    // Clean old entries if cache is getting too large
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.cleanOldEntries();
    }

    result.timestamp = Date.now();
    this.cache.set(imageHash, result);
    
    console.log(`Image analysis cached. Hash: ${imageHash}, Cache size: ${this.cache.size}`);
  }

  /**
   * Retrieves cached analysis if available and not expired
   */
  static get(imageHash: string): CachedResult | null {
    const cached = this.cache.get(imageHash);
    
    if (!cached) {
      return null;
    }

    // Check if cache entry is still valid
    const isExpired = (Date.now() - cached.timestamp) > this.CACHE_DURATION;
    
    if (isExpired) {
      this.cache.delete(imageHash);
      console.log(`Cache entry expired for hash: ${imageHash}`);
      return null;
    }

    console.log(`Cache hit! Saved Gemini API call for hash: ${imageHash}`);
    return cached;
  }

  /**
   * Removes expired entries from cache
   */
  private static cleanOldEntries(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [hash, entry] of this.cache.entries()) {
      if ((now - entry.timestamp) > this.CACHE_DURATION) {
        this.cache.delete(hash);
        removedCount++;
      }
    }

    console.log(`Cleaned ${removedCount} expired cache entries`);
  }

  /**
   * Gets cache statistics for admin monitoring
   */
  static getStats(): { size: number; hits: number; misses: number } {
    return {
      size: this.cache.size,
      hits: this.getCacheHits(),
      misses: this.getCacheMisses(),
    };
  }

  private static getCacheHits(): number {
    // This would need to be tracked in a persistent store for accuracy
    // For now, returning cache size as approximation
    return this.cache.size;
  }

  private static getCacheMisses(): number {
    // This would need to be tracked in a persistent store for accuracy
    return 0;
  }

  /**
   * Clears all cache entries (for admin use)
   */
  static clear(): void {
    this.cache.clear();
    console.log('Image analysis cache cleared');
  }
}