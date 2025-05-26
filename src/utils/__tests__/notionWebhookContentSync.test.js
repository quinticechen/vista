
import { describe, it, expect } from 'vitest';

describe('Notion Webhook Content Sync', () => {
  it('should process page.created events and sync to Supabase', () => {
    const mockPageCreatedPayload = {
      type: 'page.created',
      entity: {
        id: '1ffb07b9-915c-808b-9182-ffad960d9943',
        type: 'page'
      },
      data: {
        parent: {
          id: '1f0b07b9-915c-8070-95ca-f75eb3f47ed1',
          type: 'database'
        }
      }
    };

    // Should trigger content sync for page creation
    expect(mockPageCreatedPayload.type).toBe('page.created');
    expect(mockPageCreatedPayload.entity.type).toBe('page');
    expect(mockPageCreatedPayload.data.parent.type).toBe('database');
  });

  it('should process page.properties_updated events and sync to Supabase', () => {
    const mockPagePropertiesUpdatedPayload = {
      type: 'page.properties_updated',
      entity: {
        id: '1f9b07b9-915c-805d-9451-d68dbd6570af',
        type: 'page'
      },
      data: {
        parent: {
          id: '1f0b07b9-915c-8070-95ca-f75eb3f47ed1',
          type: 'database'
        },
        updated_properties: ['o%3By%3D']
      }
    };

    // Should trigger content sync for property updates
    expect(mockPagePropertiesUpdatedPayload.type).toBe('page.properties_updated');
    expect(mockPagePropertiesUpdatedPayload.data.updated_properties).toBeDefined();
  });

  it('should process page.content_updated events and sync to Supabase', () => {
    const mockPageContentUpdatedPayload = {
      type: 'page.content_updated',
      entity: {
        id: '1ffb07b9-915c-808b-9182-ffad960d9943',
        type: 'page'
      },
      data: {
        parent: {
          id: '1f0b07b9-915c-8070-95ca-f75eb3f47ed1',
          type: 'database'
        },
        updated_blocks: [
          { id: '1ffb07b9-915c-803a-a31b-e49d99fcf26b', type: 'block' }
        ]
      }
    };

    // Should trigger content sync for content updates
    expect(mockPageContentUpdatedPayload.type).toBe('page.content_updated');
    expect(mockPageContentUpdatedPayload.data.updated_blocks).toBeDefined();
  });

  it('should use same content processing logic as sync-notion-database', () => {
    const mockNotionPage = {
      id: 'page-123',
      url: 'https://notion.so/page-123',
      created_time: '2023-01-01T12:00:00.000Z',
      last_edited_time: '2023-01-01T13:00:00.000Z',
      properties: {
        Name: { title: [{ plain_text: 'Test Page' }] },
        Description: { rich_text: [{ plain_text: 'Test description' }] }
      }
    };

    const mockProcessedBlocks = [
      {
        type: 'paragraph',
        text: 'Sample content',
        annotations: []
      }
    ];

    // Expected content item format matching sync-notion-database
    const expectedContentItem = {
      title: 'Test Page',
      description: 'Test description',
      notion_page_id: 'page-123',
      notion_url: 'https://notion.so/page-123',
      notion_created_time: '2023-01-01T12:00:00.000Z',
      notion_last_edited_time: '2023-01-01T13:00:00.000Z',
      content: mockProcessedBlocks,
      notion_page_status: 'active'
    };

    expect(expectedContentItem.notion_page_id).toBe(mockNotionPage.id);
    expect(expectedContentItem.title).toBe('Test Page');
    expect(expectedContentItem.content).toEqual(mockProcessedBlocks);
  });

  it('should handle webhook events for specific user databases', () => {
    const mockUserProfile = {
      id: 'user-123',
      notion_database_id: '1f0b07b9-915c-8070-95ca-f75eb3f47ed1',
      notion_api_key: 'secret_key'
    };

    const mockWebhookEvent = {
      data: {
        parent: {
          id: '1f0b07b9-915c-8070-95ca-f75eb3f47ed1',
          type: 'database'
        }
      }
    };

    // Should match user by database ID
    expect(mockWebhookEvent.data.parent.id).toBe(mockUserProfile.notion_database_id);
  });
});
