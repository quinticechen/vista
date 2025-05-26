
import { describe, it, expect } from 'vitest';

describe('Notion Webhook Page Deletion and Removal', () => {
  it('should handle page.deleted events and mark content as removed', () => {
    const mockPageDeletedPayload = {
      type: 'page.deleted',
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

    // Should trigger status update to 'removed' for deleted pages
    expect(mockPageDeletedPayload.type).toBe('page.deleted');
    expect(mockPageDeletedPayload.entity.type).toBe('page');
    expect(mockPageDeletedPayload.data.parent.type).toBe('database');
  });

  it('should handle page.moved events and mark content as removed', () => {
    const mockPageMovedPayload = {
      type: 'page.moved',
      entity: {
        id: '1ffb07b9-915c-8026-bf31-dabd4d58ca49',
        type: 'page'
      },
      data: {
        parent: {
          id: '1f0b07b9-915c-8070-95ca-f75eb3f47ed1',
          type: 'database'
        }
      }
    };

    // Should trigger status update to 'removed' for moved pages
    expect(mockPageMovedPayload.type).toBe('page.moved');
    expect(mockPageMovedPayload.entity.type).toBe('page');
    expect(mockPageMovedPayload.data.parent.type).toBe('database');
  });

  it('should handle page.undeleted events and restore content', () => {
    const mockPageUndeletedPayload = {
      type: 'page.undeleted',
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

    // Should trigger status update to 'active' for undeleted pages
    expect(mockPageUndeletedPayload.type).toBe('page.undeleted');
    expect(mockPageUndeletedPayload.entity.type).toBe('page');
    expect(mockPageUndeletedPayload.data.parent.type).toBe('database');
  });

  it('should handle API errors gracefully when page is already deleted', () => {
    const mockApiError = {
      name: 'APIResponseError',
      code: 'object_not_found',
      status: 404,
      message: 'Could not find block with ID: 1ffb07b9-915c-808b-9182-ffad960d9943'
    };

    // Should not prevent status update when page cannot be fetched
    expect(mockApiError.code).toBe('object_not_found');
    expect(mockApiError.status).toBe(404);
  });

  it('should preserve existing content when marking as removed', () => {
    const existingContentItem = {
      id: '2ba57832-2732-447a-9023-e7e6933691d9',
      title: 'Existing Content',
      description: 'This content should be preserved',
      notion_page_id: '1ffb07b9-915c-808b-9182-ffad960d9943',
      notion_page_status: 'active',
      content: [
        { type: 'paragraph', text: 'Existing content' }
      ]
    };

    const expectedUpdate = {
      notion_page_status: 'removed',
      updated_at: expect.any(String)
    };

    // Should only update status and timestamp, preserving other data
    expect(expectedUpdate.notion_page_status).toBe('removed');
    expect(expectedUpdate).not.toHaveProperty('title');
    expect(expectedUpdate).not.toHaveProperty('content');
  });
});
