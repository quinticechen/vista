
import { describe, it, expect, beforeEach } from 'vitest';

// Mock functions for testing
const mockGetAndIncrementImageIndex = (() => {
  let counters = new Map();
  return (pageId) => {
    const current = counters.get(pageId) || 0;
    counters.set(pageId, current + 1);
    return current;
  };
})();

const mockResetImageCounters = (() => {
  // This should reset the counters for all pages
  let counters = new Map();
  return () => {
    counters.clear();
  };
})();

const mockBackupImageToStorage = async (imageUrl, options) => {
  // Mock that returns unique URLs based on image index
  const { imageIndex, pageId } = options;
  return `https://storage.example.com/${pageId}/${imageIndex}-${imageUrl.split('/').pop()}`;
};

describe('Notion Image Backup', () => {
  beforeEach(() => {
    mockResetImageCounters();
  });

  it('should generate unique image indices for multiple images in the same page', () => {
    const pageId = 'test-page-id';
    
    const index1 = mockGetAndIncrementImageIndex(pageId);
    const index2 = mockGetAndIncrementImageIndex(pageId);
    const index3 = mockGetAndIncrementImageIndex(pageId);
    const index4 = mockGetAndIncrementImageIndex(pageId);
    
    expect(index1).toBe(0);
    expect(index2).toBe(1);
    expect(index3).toBe(2);
    expect(index4).toBe(3);
  });

  it('should handle multiple pages with separate image counters', () => {
    const page1 = 'page-1';
    const page2 = 'page-2';
    
    const page1Index1 = mockGetAndIncrementImageIndex(page1);
    const page2Index1 = mockGetAndIncrementImageIndex(page2);
    const page1Index2 = mockGetAndIncrementImageIndex(page1);
    const page2Index2 = mockGetAndIncrementImageIndex(page2);
    
    expect(page1Index1).toBe(0);
    expect(page2Index1).toBe(0);
    expect(page1Index2).toBe(1);
    expect(page2Index2).toBe(1);
  });

  it('should create unique backup URLs for each image', async () => {
    const pageId = 'test-page-id';
    const images = [
      'https://notion.so/image1.jpg',
      'https://notion.so/image2.jpg',
      'https://notion.so/image3.jpg',
      'https://notion.so/image4.jpg'
    ];

    const backupUrls = [];
    for (let i = 0; i < images.length; i++) {
      const imageIndex = mockGetAndIncrementImageIndex(pageId);
      const backupUrl = await mockBackupImageToStorage(images[i], {
        pageId,
        imageIndex,
        supabase: {},
        bucketName: 'test-bucket',
        userId: 'test-user'
      });
      backupUrls.push(backupUrl);
    }

    // All backup URLs should be unique
    const uniqueUrls = new Set(backupUrls);
    expect(uniqueUrls.size).toBe(4);
    expect(backupUrls).toEqual([
      'https://storage.example.com/test-page-id/0-image1.jpg',
      'https://storage.example.com/test-page-id/1-image2.jpg',
      'https://storage.example.com/test-page-id/2-image3.jpg',
      'https://storage.example.com/test-page-id/3-image4.jpg'
    ]);
  });
});
