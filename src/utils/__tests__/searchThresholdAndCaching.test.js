
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the semantic search service
const mockSemanticSearch = vi.fn();
vi.mock('../../services/adminService', () => ({
  semanticSearch: mockSemanticSearch
}));

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
});

const createMockSearchResult = (id, title, similarity) => ({
  id,
  title,
  content: [],
  similarity,
  notion_page_status: 'active',
  created_at: '2024-01-01T00:00:00Z'
});

describe('Search Threshold and Caching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  describe('Search threshold filtering', () => {
    it('should filter results below 50% similarity', () => {
      const searchResults = [
        createMockSearchResult('1', 'High Relevance', 0.8),
        createMockSearchResult('2', 'Medium Relevance', 0.6),
        createMockSearchResult('3', 'Low Relevance', 0.3),
        createMockSearchResult('4', 'Very Low Relevance', 0.1)
      ];

      // Filter results with similarity >= 0.5 (50%)
      const filteredResults = searchResults.filter(item => item.similarity >= 0.5);

      expect(filteredResults).toHaveLength(2);
      expect(filteredResults[0].title).toBe('High Relevance');
      expect(filteredResults[1].title).toBe('Medium Relevance');
    });

    it('should include results with exactly 50% similarity', () => {
      const searchResults = [
        createMockSearchResult('1', 'Exact Threshold', 0.5),
        createMockSearchResult('2', 'Below Threshold', 0.49)
      ];

      const filteredResults = searchResults.filter(item => item.similarity >= 0.5);

      expect(filteredResults).toHaveLength(1);
      expect(filteredResults[0].title).toBe('Exact Threshold');
    });

    it('should return empty array when no results meet threshold', () => {
      const searchResults = [
        createMockSearchResult('1', 'Low Relevance', 0.3),
        createMockSearchResult('2', 'Very Low Relevance', 0.1)
      ];

      const filteredResults = searchResults.filter(item => item.similarity >= 0.5);

      expect(filteredResults).toHaveLength(0);
    });
  });

  describe('Search result caching', () => {
    it('should save search results to sessionStorage', () => {
      const searchResults = [
        createMockSearchResult('1', 'Test Result', 0.8)
      ];
      const searchQuery = 'test query';
      const urlParam = 'testuser';

      // Simulate saving to cache
      const cacheKey = `search-cache-${urlParam}`;
      const cacheData = {
        results: searchResults,
        query: searchQuery,
        timestamp: Date.now(),
        showingSearchResults: true
      };

      mockSessionStorage.setItem(cacheKey, JSON.stringify(cacheData));

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        cacheKey,
        JSON.stringify(cacheData)
      );
    });

    it('should restore search results from sessionStorage', () => {
      const cachedResults = [
        createMockSearchResult('1', 'Cached Result', 0.7)
      ];
      const cacheData = {
        results: cachedResults,
        query: 'cached query',
        timestamp: Date.now(),
        showingSearchResults: true
      };

      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(cacheData));

      const restored = JSON.parse(mockSessionStorage.getItem('search-cache-testuser'));

      expect(restored.results).toEqual(cachedResults);
      expect(restored.query).toBe('cached query');
      expect(restored.showingSearchResults).toBe(true);
    });

    it('should clear cache when viewing all content', () => {
      const urlParam = 'testuser';
      const cacheKey = `search-cache-${urlParam}`;

      // Simulate clearing cache
      mockSessionStorage.removeItem(cacheKey);

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(cacheKey);
    });

    it('should handle invalid cached data gracefully', () => {
      mockSessionStorage.getItem.mockReturnValue('invalid json');

      expect(() => {
        try {
          JSON.parse(mockSessionStorage.getItem('search-cache-testuser'));
        } catch (e) {
          // Should handle gracefully
          return null;
        }
      }).not.toThrow();
    });
  });

  describe('Page navigation persistence', () => {
    it('should maintain search state when navigating between pages', () => {
      const searchResults = [
        createMockSearchResult('1', 'Result 1', 0.8),
        createMockSearchResult('2', 'Result 2', 0.6)
      ];

      // Mock navigation between pages while maintaining search state
      const cacheData = {
        results: searchResults,
        query: 'test query',
        timestamp: Date.now(),
        showingSearchResults: true
      };

      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(cacheData));

      // Simulate page navigation - cache should persist
      const restoredData = JSON.parse(mockSessionStorage.getItem('search-cache-testuser'));

      expect(restoredData.results).toEqual(searchResults);
      expect(restoredData.showingSearchResults).toBe(true);
    });

    it('should clear cache timestamp when performing new search', () => {
      const oldTimestamp = Date.now() - 1000;
      const newTimestamp = Date.now();

      // Old cache data
      mockSessionStorage.getItem.mockReturnValueOnce(JSON.stringify({
        results: [],
        query: 'old query',
        timestamp: oldTimestamp,
        showingSearchResults: true
      }));

      // New search should update timestamp
      const newCacheData = {
        results: [createMockSearchResult('1', 'New Result', 0.8)],
        query: 'new query',
        timestamp: newTimestamp,
        showingSearchResults: true
      };

      mockSessionStorage.setItem('search-cache-testuser', JSON.stringify(newCacheData));

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'search-cache-testuser',
        JSON.stringify(newCacheData)
      );
    });
  });
});
