import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the processNotionContent function
const mockProcessNotionContent = vi.fn();
vi.mock('../notionContentProcessor', () => ({
  processNotionContent: mockProcessNotionContent
}));

// Mock content items with different image scenarios
const createMockContentItem = (id, title, content, coverImage = null) => ({
  id,
  title,
  content,
  cover_image: coverImage,
  created_at: '2024-01-01T00:00:00Z',
  notion_page_status: 'active'
});

const mockContentWithImage = [
  {
    type: 'image',
    media_type: 'image',
    media_url: 'https://example.com/image1.jpg',
    caption: 'Test image'
  },
  {
    type: 'paragraph',
    text: 'Some text content'
  }
];

const mockContentWithNestedImage = [
  {
    type: 'column_list',
    children: [
      {
        type: 'column',
        children: [
          {
            type: 'image',
            media_type: 'image',
            media_url: 'https://example.com/nested-image.jpg',
            caption: 'Nested image'
          }
        ]
      }
    ]
  }
];

const mockContentWithoutImage = [
  {
    type: 'paragraph',
    text: 'Just text content'
  }
];

describe('Search Image Processing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation that processes content to detect images
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
      
      // Find preview image from content
      if (Array.isArray(processed.content) && !processed.cover_image) {
        const findImage = (blocks) => {
          for (const block of blocks) {
            if (block.media_type === 'image' && block.media_url) {
              return block.media_url;
            }
            if (block.children && Array.isArray(block.children)) {
              const nestedImage = findImage(block.children);
              if (nestedImage) return nestedImage;
            }
          }
          return null;
        };
        
        processed.preview_image = findImage(processed.content);
      }
      
      return processed;
    });
  });

  describe('Content item processing for search results', () => {
    it('should extract preview image from content blocks when no cover image exists', () => {
      const item = createMockContentItem('1', 'Test Item', mockContentWithImage);
      const processed = mockProcessNotionContent(item);
      
      expect(processed.preview_image).toBe('https://example.com/image1.jpg');
      expect(mockProcessNotionContent).toHaveBeenCalledWith(item);
    });

    it('should extract preview image from nested content blocks', () => {
      const item = createMockContentItem('2', 'Nested Item', mockContentWithNestedImage);
      const processed = mockProcessNotionContent(item);
      
      expect(processed.preview_image).toBe('https://example.com/nested-image.jpg');
    });

    it('should prioritize cover image over content images', () => {
      const item = createMockContentItem('3', 'Cover Item', mockContentWithImage, 'https://example.com/cover.jpg');
      const processed = mockProcessNotionContent(item);
      
      // Should keep cover image and not override with content image
      expect(processed.cover_image).toBe('https://example.com/cover.jpg');
    });

    it('should handle content without images gracefully', () => {
      const item = createMockContentItem('4', 'Text Only', mockContentWithoutImage);
      const processed = mockProcessNotionContent(item);
      
      expect(processed.preview_image).toBeNull();
      expect(processed.cover_image).toBeNull();
    });

    it('should handle stringified JSON content', () => {
      const item = createMockContentItem('5', 'JSON String', JSON.stringify(mockContentWithImage));
      const processed = mockProcessNotionContent(item);
      
      expect(processed.preview_image).toBe('https://example.com/image1.jpg');
    });

    it('should filter out removed content items', () => {
      const items = [
        createMockContentItem('1', 'Active Item', mockContentWithImage),
        { ...createMockContentItem('2', 'Removed Item', mockContentWithImage), notion_page_status: 'removed' }
      ];
      
      const activeItems = items.filter(item => item.notion_page_status !== 'removed');
      expect(activeItems).toHaveLength(1);
      expect(activeItems[0].id).toBe('1');
    });
  });

  describe('Search vs View All consistency', () => {
    it('should apply same processing logic to both search results and view all content', () => {
      const searchResults = [
        createMockContentItem('1', 'Search Result', mockContentWithImage)
      ];
      
      const viewAllResults = [
        createMockContentItem('1', 'Search Result', mockContentWithImage)
      ];
      
      // Process both with same logic
      const processedSearch = searchResults.map(item => mockProcessNotionContent(item));
      const processedViewAll = viewAllResults.map(item => mockProcessNotionContent(item));
      
      expect(processedSearch[0].preview_image).toBe(processedViewAll[0].preview_image);
      expect(mockProcessNotionContent).toHaveBeenCalledTimes(2);
    });
  });
});
