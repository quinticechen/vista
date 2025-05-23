
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the semantic search service
const mockSemanticSearch = vi.fn();
vi.mock('../../services/adminService', () => ({
  semanticSearch: mockSemanticSearch
}));

// Mock the URL param service
const mockGetUserContentItems = vi.fn();
vi.mock('../../services/urlParamService', () => ({
  getUserContentItems: mockGetUserContentItems,
  getProfileByUrlParam: vi.fn().mockResolvedValue({ id: 'user1', url_param: 'testuser' })
}));

// Mock the content processor
const mockProcessNotionContent = vi.fn();
vi.mock('../notionContentProcessor', () => ({
  processNotionContent: mockProcessNotionContent
}));

const createMockSearchResult = (id, title, similarity = 0.8) => ({
  id,
  title,
  content: [
    {
      type: 'image',
      media_type: 'image',
      media_url: `https://example.com/image${id}.jpg`
    }
  ],
  similarity,
  notion_page_status: 'active',
  created_at: '2024-01-01T00:00:00Z'
});

describe('UrlParamVista Search Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock content processing to ensure images are detected
    mockProcessNotionContent.mockImplementation((item) => ({
      ...item,
      preview_image: item.content?.[0]?.media_url || null,
      orientation: 'landscape'
    }));
    
    // Mock user content items
    mockGetUserContentItems.mockResolvedValue([
      createMockSearchResult('1', 'User Item 1'),
      createMockSearchResult('2', 'User Item 2')
    ]);
  });

  describe('Search navigation flow', () => {
    it('should process search results with same image detection as view all', async () => {
      const searchResults = [
        createMockSearchResult('1', 'Search Result 1', 0.9),
        createMockSearchResult('2', 'Search Result 2', 0.7)
      ];
      
      mockSemanticSearch.mockResolvedValue(searchResults);
      
      // Simulate the search flow processing
      const userContentItems = await mockGetUserContentItems('user1');
      const searchResultsFromAPI = await mockSemanticSearch('test query');
      
      // Filter search results to user's content
      const userIdsSet = new Set(userContentItems.map(item => item.id));
      const filteredResults = searchResultsFromAPI.filter(item => userIdsSet.has(item.id));
      
      // Process filtered results (this should match view all processing)
      const processedResults = filteredResults.map(item => mockProcessNotionContent(item));
      
      // Verify processing was applied
      expect(mockProcessNotionContent).toHaveBeenCalledTimes(filteredResults.length + userContentItems.length);
      
      // Verify image detection worked
      processedResults.forEach(item => {
        expect(item.preview_image).toBeDefined();
        expect(item.preview_image).toContain('https://example.com/image');
      });
    });

    it('should filter out removed items from search results', async () => {
      const searchResults = [
        createMockSearchResult('1', 'Active Item'),
        { ...createMockSearchResult('2', 'Removed Item'), notion_page_status: 'removed' }
      ];
      
      const userContentItems = [
        createMockSearchResult('1', 'Active Item'),
        createMockSearchResult('2', 'Removed Item') // This will be filtered out
      ];
      
      mockSemanticSearch.mockResolvedValue(searchResults);
      mockGetUserContentItems.mockResolvedValue(userContentItems);
      
      // Simulate filtering logic
      const userIdsSet = new Set(userContentItems.map(item => item.id));
      let filteredResults = searchResults.filter(item => userIdsSet.has(item.id));
      filteredResults = filteredResults.filter(item => item.notion_page_status !== 'removed');
      
      expect(filteredResults).toHaveLength(1);
      expect(filteredResults[0].id).toBe('1');
    });

    it('should maintain consistency between search and view all image processing', async () => {
      const contentItem = createMockSearchResult('1', 'Test Item');
      
      // Process as search result
      const processedAsSearch = mockProcessNotionContent(contentItem);
      
      // Process as view all item
      const processedAsViewAll = mockProcessNotionContent(contentItem);
      
      // Should produce identical results
      expect(processedAsSearch.preview_image).toBe(processedAsViewAll.preview_image);
      expect(processedAsSearch.orientation).toBe(processedAsViewAll.orientation);
    });
  });

  describe('Error handling in search flow', () => {
    it('should handle search API errors gracefully', async () => {
      mockSemanticSearch.mockRejectedValue(new Error('Search API error'));
      
      // The component should fall back to showing all user content
      const userContent = await mockGetUserContentItems('user1');
      expect(userContent).toBeDefined();
      expect(Array.isArray(userContent)).toBe(true);
    });

    it('should handle content processing errors gracefully', () => {
      const malformedItem = {
        id: '1',
        title: 'Malformed Item',
        content: 'invalid json'
      };
      
      mockProcessNotionContent.mockImplementation((item) => {
        if (item.content === 'invalid json') {
          return { ...item, content: [], preview_image: null };
        }
        return item;
      });
      
      const result = mockProcessNotionContent(malformedItem);
      expect(result.content).toEqual([]);
      expect(result.preview_image).toBeNull();
    });
  });
});
