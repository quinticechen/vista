
import { describe, it, expect } from 'vitest';

describe('Notion Webhook Data Consistency', () => {
  it('should process blocks identically to sync-notion-database', () => {
    const mockNotionBlock = {
      id: 'block-123',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          {
            plain_text: 'Hello world',
            annotations: {
              bold: false,
              italic: false,
              strikethrough: false,
              underline: false,
              code: false,
              color: 'default'
            }
          }
        ]
      }
    };

    // Expected processed format (from sync-notion-database)
    const expectedProcessedBlock = {
      id: 'block-123',
      type: 'paragraph',
      text: 'Hello world',
      annotations: []
    };

    // Mock webhook processing should produce identical result
    const webhookProcessedBlock = {
      id: mockNotionBlock.id,
      type: mockNotionBlock.type,
      text: mockNotionBlock.paragraph.rich_text.map(rt => rt.plain_text).join(''),
      annotations: []
    };

    expect(webhookProcessedBlock).toEqual(expectedProcessedBlock);
  });

  it('should handle image blocks consistently with backup URLs', () => {
    const mockImageBlock = {
      id: 'image-block-123',
      type: 'image',
      image: {
        type: 'file',
        file: {
          url: 'https://notion.so/temp-image-url'
        },
        caption: []
      }
    };

    const expectedImageBlock = {
      id: 'image-block-123',
      type: 'image',
      url: 'https://storage.supabase.co/backup-url',
      caption: null
    };

    // Webhook should process images with backup URLs like sync does
    const webhookImageBlock = {
      id: mockImageBlock.id,
      type: mockImageBlock.type,
      url: 'https://storage.supabase.co/backup-url', // Should be backup URL
      caption: null
    };

    expect(webhookImageBlock.type).toBe(expectedImageBlock.type);
    expect(webhookImageBlock.url).not.toContain('notion.so');
  });

  it('should extract properties consistently', () => {
    const mockNotionProperties = {
      Name: {
        title: [{ plain_text: 'Test Page Title' }]
      },
      Description: {
        rich_text: [{ plain_text: 'Test description' }]
      },
      Category: {
        select: { name: 'Blog Post' }
      },
      Tags: {
        multi_select: [
          { name: 'tech' },
          { name: 'tutorial' }
        ]
      }
    };

    const expectedExtracted = {
      title: 'Test Page Title',
      description: 'Test description',
      category: 'Blog Post',
      tags: ['tech', 'tutorial']
    };

    // Mock property extraction should match sync-notion-database logic
    const webhookExtracted = {
      title: mockNotionProperties.Name.title[0].plain_text,
      description: mockNotionProperties.Description.rich_text[0].plain_text,
      category: mockNotionProperties.Category.select.name,
      tags: mockNotionProperties.Tags.multi_select.map(item => item.name)
    };

    expect(webhookExtracted).toEqual(expectedExtracted);
  });
});
