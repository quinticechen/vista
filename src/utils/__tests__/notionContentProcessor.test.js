
import { processNotionContent, extractFirstImageUrl, isHeicImage } from '../notionContentProcessor';

describe('notionContentProcessor', () => {
  describe('isHeicImage', () => {
    it('should correctly identify HEIC images from URLs', () => {
      expect(isHeicImage('https://example.com/image.heic')).toBe(true);
      expect(isHeicImage('https://example.com/photos/heic/image1.jpg')).toBe(true);
      expect(isHeicImage('https://example.com/image-heic.jpg')).toBe(true);
      expect(isHeicImage('https://example.com/image.jpg')).toBe(false);
      expect(isHeicImage()).toBe(false);
      expect(isHeicImage('')).toBe(false);
    });
  });

  describe('extractFirstImageUrl', () => {
    it('should extract the first image from content blocks', () => {
      const blocks = [
        { type: 'paragraph', text: 'Test paragraph' },
        { 
          type: 'image', 
          media_url: 'https://example.com/image1.jpg'
        },
        { 
          type: 'image', 
          media_url: 'https://example.com/image2.jpg'
        }
      ];

      const result = extractFirstImageUrl(blocks);
      expect(result.url).toBe('https://example.com/image1.jpg');
      expect(result.isHeic).toBe(false);
    });

    it('should detect HEIC images during extraction', () => {
      const blocks = [
        { type: 'paragraph', text: 'Test paragraph' },
        { 
          type: 'image', 
          media_url: 'https://example.com/image.heic'
        }
      ];

      const result = extractFirstImageUrl(blocks);
      expect(result.url).toBe('https://example.com/image.heic');
      expect(result.isHeic).toBe(true);
    });

    it('should find images in nested blocks', () => {
      const blocks = [
        { type: 'paragraph', text: 'Test paragraph' },
        { 
          type: 'column',
          children: [
            {
              type: 'image',
              media_url: 'https://example.com/nested-image.jpg'
            }
          ]
        }
      ];

      const result = extractFirstImageUrl(blocks);
      expect(result.url).toBe('https://example.com/nested-image.jpg');
    });

    it('should handle empty or non-array content', () => {
      expect(extractFirstImageUrl([])).toEqual({ url: undefined, isHeic: false });
      expect(extractFirstImageUrl(null)).toEqual({ url: undefined, isHeic: false });
      expect(extractFirstImageUrl(undefined)).toEqual({ url: undefined, isHeic: false });
      expect(extractFirstImageUrl("not an array")).toEqual({ url: undefined, isHeic: false });
    });
  });

  describe('processNotionContent', () => {
    it('should process content and extract preview images', () => {
      const contentItem = {
        id: '123',
        title: 'Test Content',
        user_id: 'user1',
        content: [
          { type: 'paragraph', text: 'Test paragraph' },
          { 
            type: 'image', 
            media_url: 'https://example.com/image1.jpg'
          }
        ]
      };

      const processed = processNotionContent(contentItem);
      expect(processed.preview_image).toBe('https://example.com/image1.jpg');
      expect(processed.preview_is_heic).toBe(false);
    });

    it('should use preview image as cover if no cover image exists', () => {
      const contentItem = {
        id: '123',
        title: 'Test Content',
        user_id: 'user1',
        cover_image: null,
        content: [
          { 
            type: 'image', 
            media_url: 'https://example.com/image1.jpg'
          }
        ]
      };

      const processed = processNotionContent(contentItem);
      expect(processed.cover_image).toBe('https://example.com/image1.jpg');
    });

    it('should maintain existing cover image if present', () => {
      const contentItem = {
        id: '123',
        title: 'Test Content',
        user_id: 'user1',
        cover_image: 'https://example.com/cover.jpg',
        content: [
          { 
            type: 'image', 
            media_url: 'https://example.com/image1.jpg'
          }
        ]
      };

      const processed = processNotionContent(contentItem);
      expect(processed.cover_image).toBe('https://example.com/cover.jpg');
      expect(processed.preview_image).toBe('https://example.com/image1.jpg');
    });
    
    it('should handle empty content', () => {
      const contentItem = {
        id: '123',
        title: 'Test Content',
        user_id: 'user1',
      };

      const processed = processNotionContent(contentItem);
      expect(processed).toEqual(expect.objectContaining({
        id: '123',
        title: 'Test Content',
        user_id: 'user1',
      }));
    });
  });
});
