
import { ContentItem } from "@/services/adminService";

export interface SearchCacheData {
  results: ContentItem[];
  query: string;
  timestamp: number;
  showingSearchResults: boolean;
  purpose?: string;
}

export class SearchCache {
  private static getCacheKey(urlParam?: string): string {
    return urlParam ? `search-cache-${urlParam}` : 'search-cache-global';
  }

  static save(data: SearchCacheData, urlParam?: string): void {
    try {
      const cacheKey = this.getCacheKey(urlParam);
      const cacheData = {
        ...data,
        timestamp: Date.now()
      };
      sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`Search cache saved: ${data.results.length} results for "${data.query}"`);
    } catch (error) {
      console.error('Error saving search cache:', error);
    }
  }

  static load(urlParam?: string): SearchCacheData | null {
    try {
      const cacheKey = this.getCacheKey(urlParam);
      const cached = sessionStorage.getItem(cacheKey);
      
      if (!cached) {
        return null;
      }

      const data = JSON.parse(cached) as SearchCacheData;
      console.log(`Search cache loaded: ${data.results.length} results for "${data.query}"`);
      return data;
    } catch (error) {
      console.error('Error loading search cache:', error);
      return null;
    }
  }

  static clear(urlParam?: string): void {
    try {
      const cacheKey = this.getCacheKey(urlParam);
      sessionStorage.removeItem(cacheKey);
      console.log('Search cache cleared');
    } catch (error) {
      console.error('Error clearing search cache:', error);
    }
  }

  static isValid(data: SearchCacheData | null): boolean {
    if (!data) return false;
    
    // Cache is valid if it has results and a query
    return data.results.length > 0 && data.query.trim().length > 0;
  }
}
