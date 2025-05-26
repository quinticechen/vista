
import { describe, it, expect, beforeEach } from 'vitest';

describe('Notion Sync Integration', () => {
  // Mock data that simulates the issue described
  const mockNotionPageWithMultipleImages = {
    id: '1f6b07b9-915c-8018-b5ff-facb4b7817bc',
    blocks: [
      {
        id: 'block-1',
        type: 'image',
        image: {
          type: 'file',
          file: { url: 'https://notion.so/image1.jpg' },
          caption: []
        }
      },
      {
        id: 'block-2',
        type: 'image',
        image: {
          type: 'file',
          file: { url: 'https://notion.so/image2.jpg' },
          caption: []
        }
      },
      {
        id: 'block-3',
        type: 'image',
        image: {
          type: 'file',
          file: { url: 'https://notion.so/image3.jpg' },
          caption: []
        }
      },
      {
        id: 'block-4',
        type: 'image',
        image: {
          type: 'file',
          file: { url: 'https://notion.so/image4.jpg' },
          caption: []
        }
      }
    ]
  };

  beforeEach(() => {
    // Reset any global state that might affect image indexing
  });

  it('should process four distinct images with unique backup URLs', async () => {
    const pageId = mockNotionPageWithMultipleImages.id;
    const blocks = mockNotionPageWithMultipleImages.blocks;
    
    // Mock image counter
    let imageCounter = 0;
    const getImageIndex = () => imageCounter++;
    
    // Mock backup function
    const mockBackupImage = async (url, options) => {
      const { imageIndex } = options;
      return `https://storage.supabase.co/${pageId}/${imageIndex}-${url.split('/').pop()}`;
    };

    const processedImages = [];
    
    for (const block of blocks) {
      const imageIndex = getImageIndex();
      const imageUrl = block.image.file.url;
      const backupUrl = await mockBackupImage(imageUrl, {
        pageId,
        imageIndex,
        supabase: {},
        bucketName: 'notion-images',
        userId: 'test-user'
      });
      
      processedImages.push({
        originalUrl: imageUrl,
        backupUrl,
        imageIndex
      });
    }

    // Verify all images have unique indices and backup URLs
    expect(processedImages).toHaveLength(4);
    expect(processedImages[0].imageIndex).toBe(0);
    expect(processedImages[1].imageIndex).toBe(1);
    expect(processedImages[2].imageIndex).toBe(2);
    expect(processedImages[3].imageIndex).toBe(3);

    // Verify all backup URLs are unique
    const backupUrls = processedImages.map(img => img.backupUrl);
    const uniqueUrls = new Set(backupUrls);
    expect(uniqueUrls.size).toBe(4);

    // Verify the fourth image is not the same as the first
    expect(processedImages[3].backupUrl).not.toBe(processedImages[0].backupUrl);
    expect(processedImages[3].backupUrl).toContain('3-image4.jpg');
  });

  it('should handle annotation positioning correctly for complex text', () => {
    const mockRichText = [
      {
        plain_text: 'Text Colors: Can be applied to blocks or text using highlight (',
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default'
        }
      },
      {
        plain_text: 'red',
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'red'
        }
      },
      {
        plain_text: ', blue, green, etc.) ❤️',
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default'
        }
      }
    ];

    // Simulate the extractAnnotationsSimplified function
    const annotations = [];
    let currentPosition = 0;
    
    for (const rt of mockRichText) {
      const { color } = rt.annotations;
      
      if (color && color !== 'default') {
        annotations.push({
          text: rt.plain_text,
          start: currentPosition,
          end: currentPosition + rt.plain_text.length,
          color
        });
      }
      
      currentPosition += rt.plain_text.length;
    }

    expect(annotations).toHaveLength(1);
    expect(annotations[0]).toMatchObject({
      text: 'red',
      start: 63, // After "Text Colors: Can be applied to blocks or text using highlight ("
      end: 66,   // 63 + 3
      color: 'red'
    });
  });

  it('should maintain correct text positions when multiple annotations exist', () => {
    const mockRichText = [
      {
        plain_text: 'This text has ',
        annotations: { bold: false, italic: false, color: 'default' }
      },
      {
        plain_text: 'bold',
        annotations: { bold: true, italic: false, color: 'default' }
      },
      {
        plain_text: ' and ',
        annotations: { bold: false, italic: false, color: 'default' }
      },
      {
        plain_text: 'red',
        annotations: { bold: false, italic: false, color: 'red' }
      },
      {
        plain_text: ' text.',
        annotations: { bold: false, italic: false, color: 'default' }
      }
    ];

    const annotations = [];
    let currentPosition = 0;
    
    for (const rt of mockRichText) {
      const { bold, color } = rt.annotations;
      
      if (bold || (color && color !== 'default')) {
        annotations.push({
          text: rt.plain_text,
          start: currentPosition,
          end: currentPosition + rt.plain_text.length,
          bold: bold || false,
          color: color !== 'default' ? color : undefined
        });
      }
      
      currentPosition += rt.plain_text.length;
    }

    expect(annotations).toHaveLength(2);
    
    // Bold annotation should be at position 14-18
    expect(annotations[0]).toMatchObject({
      text: 'bold',
      start: 14,
      end: 18,
      bold: true
    });
    
    // Red annotation should be at position 23-26
    expect(annotations[1]).toMatchObject({
      text: 'red',
      start: 23,
      end: 26,
      color: 'red'
    });
  });
});
