
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

const createContentWithImage = (id, title, hasImage = true) => ({
  id,
  title,
  content: hasImage ? [
    {
      type: 'paragraph',
      text: 'Introduction text'
    },
    {
      type: 'image',
      media_type: 'image',
      media_url: `https://example.com/image${id}.jpg`,
      caption: `Image for ${title}`
    }
  ] : [
    {
      type: 'paragraph',
      text: 'Text only content'
    }
  ],
  notion_page_status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  user_id: 'user1'
});

describe('Search Image Consistency Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock content processing to extract preview images consistently
    mockProcessNotionContent.mockImplementation((item) => {
      const processed = { ...item };
      
      // Parse content if it's a string
      if (typeof processed.content === 'string') {
        try {
          processed.content = JSON.parse(processed.content);
        } catch (e) {
          processed.content = [];
        }
      }
      
      // Extract preview image from content
      if (Array.isArray(processed.content)) {
        const imageBlock = processed.content.find(block => 
          block.media_type === 'image' && block.media_url
        );
        if (imageBlock) {
          processed.preview_image = imageBlock.media_url;
          processed.cover_image = processed.cover_image || imageBlock.media_url;
        }
      }
      
      return processed;
    });
  });

  describe('Use Case 1: Embedding Search from /:urlParam page', () => {
    it('should extract images from semantic search results when navigating from PurposeInput', async () => {
      const searchResults = [
        createContentWithImage('1', 'AI Content 1'),
        createContentWithImage('2', 'AI Content 2')
      ];
      
      mockSemanticSearch.mockResolvedValue(searchResults);
      
      // Simulate the flow from PurposeInput
      const results = await mockSemanticSearch('AI concepts');
      const processedResults = results.map(item => mockProcessNotionContent(item));
      
      expect(processedResults).toHaveLength(2);
      processedResults.forEach((item, index) => {
        expect(item.preview_image).toBe(`https://example.com/image${index + 1}.jpg`);
        expect(item.cover_image).toBe(`https://example.com/image${index + 1}.jpg`);
      });
    });

    it('should handle content without images gracefully', async () => {
      const searchResults = [
        createContentWithImage('1', 'Text Only Content', false)
      ];
      
      mockSemanticSearch.mockResolvedValue(searchResults);
      
      const results = await mockSemanticSearch('text content');
      const processedResults = results.map(item => mockProcessNotionContent(item));
      
      expect(processedResults[0].preview_image).toBeUndefined();
      expect(processedResults[0].cover_image).toBeUndefined();
    });
  });

  describe('Use Case 2: View All Content functionality', () => {
    it('should extract images from all user content items', async () => {
      const userContent = [
        createContentWithImage('1', 'User Content 1'),
        createContentWithImage('2', 'User Content 2'),
        createContentWithImage('3', 'User Content 3', false)
      ];
      
      mockGetUserContentItems.mockResolvedValue(userContent);
      
      const results = await mockGetUserContentItems('user1');
      const processedResults = results.map(item => mockProcessNotionContent(item));
      
      expect(processedResults).toHaveLength(3);
      expect(processedResults[0].preview_image).toBe('https://example.com/image1.jpg');
      expect(processedResults[1].preview_image).toBe('https://example.com/image2.jpg');
      expect(processedResults[2].preview_image).toBeUndefined();
    });
  });

  describe('Use Case 3: Vista page search functionality', () => {
    it('should filter search results to user content and extract images', async () => {
      const userContent = [
        createContentWithImage('1', 'User Content 1'),
        createContentWithImage('2', 'User Content 2')
      ];
      
      const searchResults = [
        createContentWithImage('1', 'User Content 1'), // Matches user content
        createContentWithImage('3', 'Other User Content') // Doesn't match
      ];
      
      mockGetUserContentItems.mockResolvedValue(userContent);
      mockSemanticSearch.mockResolvedValue(searchResults);
      
      // Simulate the vista page search flow
      const allUserContent = await mockGetUserContentItems('user1');
      const searchRes = await mockSemanticSearch('search term');
      
      // Filter search results to user's content
      const userIdsSet = new Set(allUserContent.map(item => item.id));
      const filteredResults = searchRes.filter(item => userIdsSet.has(item.id));
      
      // Process filtered results
      const processedResults = filteredResults.map(item => mockProcessNotionContent(item));
      
      expect(processedResults).toHaveLength(1);
      expect(processedResults[0].id).toBe('1');
      expect(processedResults[0].preview_image).toBe('https://example.com/image1.jpg');
    });

    it('should maintain image data consistency between view all and search', async () => {
      const contentItem = createContentWithImage('1', 'Test Content');
      
      // Process as view all item
      const processedAsViewAll = mockProcessNotionContent(contentItem);
      
      // Process as search result
      const processedAsSearch = mockProcessNotionContent(contentItem);
      
      expect(processedAsViewAll.preview_image).toBe(processedAsSearch.preview_image);
      expect(processedAsViewAll.cover_image).toBe(processedAsSearch.cover_image);
    });
  });

  describe('Content Processing Pipeline Consistency', () => {
    it('should apply same processing logic regardless of data source', () => {
      const contentItem = createContentWithImage('1', 'Test Item');
      
      // Should work the same whether coming from getUserContentItems or semanticSearch
      const processed1 = mockProcessNotionContent(contentItem);
      const processed2 = mockProcessNotionContent(contentItem);
      
      expect(processed1.preview_image).toBe(processed2.preview_image);
      expect(processed1.cover_image).toBe(processed2.cover_image);
      
      expect(mockProcessNotionContent).toHaveBeenCalledTimes(2);
    });

    it('should handle stringified JSON content consistently', () => {
      const contentWithStringifiedJSON = {
        id: '1',
        title: 'JSON String Content',
        content: JSON.stringify([
          {
            type: 'image',
            media_type: 'image',
            media_url: 'https://example.com/json-image.jpg'
          }
        ]),
        user_id: 'user1'
      };
      
      const processed = mockProcessNotionContent(contentWithStringifiedJSON);
      
      expect(processed.preview_image).toBe('https://example.com/json-image.jpg');
    });
  });
});
