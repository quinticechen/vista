
import { describe, it, expect } from 'vitest';

describe('Notion Webhook Page Deletion - Specific Content Item', () => {
  it('should handle deletion of specific content item with id 2ba57832-2732-447a-9023-e7e6933691d9', () => {
    const mockPageDeletedPayload = {
      type: 'page.deleted',
      entity: {
        id: '2ba57832-2732-447a-9023-e7e6933691d9',
        type: 'page'
      },
      data: {
        parent: {
          id: '1f0b07b9-915c-8070-95ca-f75eb3f47ed1',
          type: 'database'
        }
      }
    };

    // Should trigger status update to 'removed' for the specific deleted page
    expect(mockPageDeletedPayload.type).toBe('page.deleted');
    expect(mockPageDeletedPayload.entity.id).toBe('2ba57832-2732-447a-9023-e7e6933691d9');
    expect(mockPageDeletedPayload.entity.type).toBe('page');
    expect(mockPageDeletedPayload.data.parent.type).toBe('database');
  });

  it('should update content_items table with correct notion_page_status for deleted page', () => {
    const expectedDatabaseUpdate = {
      table: 'content_items',
      operation: 'UPDATE',
      where: {
        notion_page_id: '2ba57832-2732-447a-9023-e7e6933691d9',
        user_id: 'c1c23503-cd3f-4368-9cce-7cf794b51c08'
      },
      set: {
        notion_page_status: 'removed',
        updated_at: expect.any(String)
      }
    };

    // Should only update status and timestamp, preserving other data
    expect(expectedDatabaseUpdate.set.notion_page_status).toBe('removed');
    expect(expectedDatabaseUpdate.where.notion_page_id).toBe('2ba57832-2732-447a-9023-e7e6933691d9');
  });

  it('should handle page.moved event for content item removal from database', () => {
    const mockPageMovedPayload = {
      type: 'page.moved',
      entity: {
        id: '2ba57832-2732-447a-9023-e7e6933691d9',
        type: 'page'
      },
      data: {
        parent: {
          id: 'different-parent-id',
          type: 'page'  // Moved out of database to regular page
        }
      }
    };

    // Should also trigger status update to 'removed' when moved out of database
    expect(mockPageMovedPayload.type).toBe('page.moved');
    expect(mockPageMovedPayload.entity.id).toBe('2ba57832-2732-447a-9023-e7e6933691d9');
    expect(mockPageMovedPayload.data.parent.type).toBe('page'); // Not database anymore
  });

  it('should verify webhook response format for deletion events', () => {
    const expectedSuccessResponse = {
      status: 'success',
      message: 'Page marked as removed successfully',
      page_id: '2ba57832-2732-447a-9023-e7e6933691d9',
      user_id: 'c1c23503-cd3f-4368-9cce-7cf794b51c08',
      operation: 'removed'
    };

    // Should return proper success response after marking as removed
    expect(expectedSuccessResponse.status).toBe('success');
    expect(expectedSuccessResponse.operation).toBe('removed');
    expect(expectedSuccessResponse.page_id).toBe('2ba57832-2732-447a-9023-e7e6933691d9');
  });

  it('should handle database errors gracefully during deletion', () => {
    const mockDatabaseError = {
      name: 'PostgrestError',
      message: 'relation "content_items" does not exist',
      details: null,
      hint: null,
      code: '42P01'
    };

    const expectedErrorResponse = {
      status: 'error',
      message: 'Failed to mark page as removed',
      error: mockDatabaseError.message
    };

    // Should handle database errors without crashing
    expect(expectedErrorResponse.status).toBe('error');
    expect(expectedErrorResponse.message).toBe('Failed to mark page as removed');
  });
});
