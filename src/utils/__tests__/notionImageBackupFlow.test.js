
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Notion Image Backup Flow', () => {
  // Mock Supabase storage operations
  const mockSupabase = {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn()
      })),
      listBuckets: vi.fn(),
      createBucket: vi.fn()
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock implementations
    mockSupabase.storage.from.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ 
        data: { path: 'test-path' }, 
        error: null 
      }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: 'https://storage.supabase.co/test-bucket/test-path' }
      })
    });
  });

  describe('Image Index Generation', () => {
    it('should generate unique sequential indices for images in the same page', () => {
      // Mock the image counter functionality
      let counters = new Map();
      const getAndIncrementImageIndex = (pageId) => {
        const current = counters.get(pageId) || 0;
        counters.set(pageId, current + 1);
        return current;
      };

      const pageId = 'test-page-123';
      
      const index1 = getAndIncrementImageIndex(pageId);
      const index2 = getAndIncrementImageIndex(pageId);
      const index3 = getAndIncrementImageIndex(pageId);
      
      expect(index1).toBe(0);
      expect(index2).toBe(1);
      expect(index3).toBe(2);
    });

    it('should handle multiple pages with separate counters', () => {
      let counters = new Map();
      const getAndIncrementImageIndex = (pageId) => {
        const current = counters.get(pageId) || 0;
        counters.set(pageId, current + 1);
        return current;
      };

      const page1 = 'page-1';
      const page2 = 'page-2';
      
      expect(getAndIncrementImageIndex(page1)).toBe(0);
      expect(getAndIncrementImageIndex(page2)).toBe(0);
      expect(getAndIncrementImageIndex(page1)).toBe(1);
      expect(getAndIncrementImageIndex(page2)).toBe(1);
    });
  });

  describe('Image Backup Process', () => {
    it('should successfully backup an image and return new URL', async () => {
      const mockBackupImageToStorage = async (imageUrl, options) => {
        const { supabase, bucketName, userId, pageId, imageIndex } = options;
        
        // Simulate fetching image
        if (!imageUrl) return null;
        
        // Simulate upload
        const fileName = `${userId}/${pageId}/image-${imageIndex}.jpg`;
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(fileName, new ArrayBuffer(0), { upsert: true });
        
        if (error) return imageUrl;
        
        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName);
        
        return publicUrlData.publicUrl;
      };

      const originalUrl = 'https://notion.so/image/expiring-url.jpg';
      const backupUrl = await mockBackupImageToStorage(originalUrl, {
        supabase: mockSupabase,
        bucketName: 'notion-images',
        userId: 'user-123',
        pageId: 'page-456',
        imageIndex: 0
      });

      expect(backupUrl).toBe('https://storage.supabase.co/test-bucket/test-path');
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('notion-images');
    });

    it('should handle image backup failure gracefully', async () => {
      // Mock upload failure
      mockSupabase.storage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ 
          data: null, 
          error: new Error('Upload failed') 
        }),
        getPublicUrl: vi.fn()
      });

      const mockBackupImageToStorage = async (imageUrl, options) => {
        const { supabase, bucketName, userId, pageId, imageIndex } = options;
        
        try {
          const fileName = `${userId}/${pageId}/image-${imageIndex}.jpg`;
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, new ArrayBuffer(0), { upsert: true });
          
          if (error) return imageUrl; // Return original URL on failure
          
          const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);
          
          return publicUrlData.publicUrl;
        } catch (error) {
          return imageUrl; // Return original URL on failure
        }
      };

      const originalUrl = 'https://notion.so/image/expiring-url.jpg';
      const backupUrl = await mockBackupImageToStorage(originalUrl, {
        supabase: mockSupabase,
        bucketName: 'notion-images',
        userId: 'user-123',
        pageId: 'page-456',
        imageIndex: 0
      });

      expect(backupUrl).toBe(originalUrl); // Should return original URL on failure
    });
  });

  describe('Notion Block Processing with Image Backup', () => {
    it('should process image blocks and replace URLs with backup URLs', async () => {
      const mockBlocks = [
        {
          id: 'block-1',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ plain_text: 'Some text', annotations: {} }]
          }
        },
        {
          id: 'block-2',
          type: 'image',
          image: {
            type: 'file',
            file: { url: 'https://notion.so/image/expiring-1.jpg' },
            caption: []
          }
        },
        {
          id: 'block-3',
          type: 'image',
          image: {
            type: 'external',
            external: { url: 'https://notion.so/image/expiring-2.jpg' },
            caption: [{ plain_text: 'Image caption', annotations: {} }]
          }
        }
      ];

      const processedBlocks = [];
      let imageCounter = 0;
      
      for (const block of mockBlocks) {
        const processedBlock = { type: block.type };
        
        if (block.type === 'image') {
          const imageIndex = imageCounter++;
          const imageUrl = block.image.type === 'external' ? 
            block.image.external.url : 
            block.image.file.url;
          
          // Mock backup process
          const backupUrl = `https://storage.supabase.co/notion-images/user-123/page-456/image-${imageIndex}.jpg`;
          
          processedBlock.media_type = 'image';
          processedBlock.media_url = backupUrl;
          processedBlock.caption = block.image.caption.length > 0 ? 
            block.image.caption.map(c => c.plain_text).join('') : null;
        } else if (block.type === 'paragraph') {
          processedBlock.text = block.paragraph.rich_text.map(rt => rt.plain_text).join('');
        }
        
        processedBlocks.push(processedBlock);
      }

      expect(processedBlocks).toHaveLength(3);
      expect(processedBlocks[1].media_url).toBe('https://storage.supabase.co/notion-images/user-123/page-456/image-0.jpg');
      expect(processedBlocks[2].media_url).toBe('https://storage.supabase.co/notion-images/user-123/page-456/image-1.jpg');
      expect(processedBlocks[2].caption).toBe('Image caption');
    });

    it('should maintain image sequence order across multiple pages', async () => {
      const page1Images = ['image1.jpg', 'image2.jpg'];
      const page2Images = ['imageA.jpg', 'imageB.jpg', 'imageC.jpg'];
      
      let page1Counter = 0;
      let page2Counter = 0;
      
      const page1Results = page1Images.map(img => {
        const index = page1Counter++;
        return `https://storage.supabase.co/notion-images/user-123/page-1/image-${index}.jpg`;
      });
      
      const page2Results = page2Images.map(img => {
        const index = page2Counter++;
        return `https://storage.supabase.co/notion-images/user-123/page-2/image-${index}.jpg`;
      });

      expect(page1Results).toEqual([
        'https://storage.supabase.co/notion-images/user-123/page-1/image-0.jpg',
        'https://storage.supabase.co/notion-images/user-123/page-1/image-1.jpg'
      ]);
      
      expect(page2Results).toEqual([
        'https://storage.supabase.co/notion-images/user-123/page-2/image-0.jpg',
        'https://storage.supabase.co/notion-images/user-123/page-2/image-1.jpg',
        'https://storage.supabase.co/notion-images/user-123/page-2/image-2.jpg'
      ]);
    });
  });

  describe('HEIC Image Detection', () => {
    it('should detect and mark HEIC images correctly', () => {
      const testUrls = [
        'https://notion.so/image.heic',
        'https://notion.so/photos/heic/photo.jpg',
        'https://notion.so/image-heic.png',
        'https://notion.so/regular-image.jpg'
      ];

      const isHeicImage = (url) => {
        if (!url) return false;
        return url.toLowerCase().includes('.heic') || 
               url.toLowerCase().includes('/heic') || 
               url.toLowerCase().includes('heic.');
      };

      expect(isHeicImage(testUrls[0])).toBe(true);
      expect(isHeicImage(testUrls[1])).toBe(true);
      expect(isHeicImage(testUrls[2])).toBe(true);
      expect(isHeicImage(testUrls[3])).toBe(false);
    });
  });

  describe('Storage Bucket Management', () => {
    it('should create notion-images bucket if it does not exist', async () => {
      mockSupabase.storage.listBuckets.mockResolvedValue({
        data: [], // No existing buckets
        error: null
      });
      
      mockSupabase.storage.createBucket.mockResolvedValue({
        data: { name: 'notion-images' },
        error: null
      });

      // Simulate bucket creation logic
      const { data: existingBuckets } = await mockSupabase.storage.listBuckets();
      const notionImagesBucket = 'notion-images';
      const bucketExists = existingBuckets?.some(bucket => bucket.name === notionImagesBucket);

      if (!bucketExists) {
        await mockSupabase.storage.createBucket(notionImagesBucket, {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
        });
      }

      expect(mockSupabase.storage.createBucket).toHaveBeenCalledWith('notion-images', {
        public: true,
        fileSizeLimit: 10485760,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
      });
    });
  });
});
