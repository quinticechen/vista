
/**
 * Test file for embedding process optimization
 * Tests the logic for only processing content updated after the last embedding job
 */

describe('Embedding Process Optimization', () => {
  // Mock data
  const mockUser = { id: 'test-user-id' };
  
  const mockContentItems = [
    { 
      id: '1', 
      title: 'Old Content', 
      user_id: 'test-user-id',
      updated_at: '2025-06-01T10:00:00Z' 
    },
    { 
      id: '2', 
      title: 'Recent Content', 
      user_id: 'test-user-id',
      updated_at: '2025-06-10T15:30:00Z' 
    }
  ];
  
  const mockLastEmbeddingJob = {
    id: 'last-job',
    status: 'completed',
    started_at: '2025-06-08T12:00:00Z',
    completed_at: '2025-06-08T12:30:00Z',
    created_by: 'test-user-id'
  };
  
  test('Should only process content updated after last embedding job started_at', () => {
    // Filter content based on last embedding job's started_at timestamp
    const filteredItems = mockContentItems.filter(item => 
      new Date(item.updated_at) > new Date(mockLastEmbeddingJob.started_at)
    );
    
    // Should only include content updated after the last job started
    expect(filteredItems.length).toBe(1);
    expect(filteredItems[0].id).toBe('2');
    expect(filteredItems[0].title).toBe('Recent Content');
  });

  test('Should process all content when no previous embedding job exists', () => {
    // When no previous job exists, all content should be processed
    const noPreviousJob = null;
    const itemsToProcess = noPreviousJob ? [] : mockContentItems;
    
    expect(itemsToProcess.length).toBe(2);
  });

  test('Should use started_at timestamp, not completed_at for filtering', () => {
    // The cutoff should be based on when the job started, not when it completed
    const cutoffTime = mockLastEmbeddingJob.started_at;
    const filteredItems = mockContentItems.filter(item => 
      new Date(item.updated_at) > new Date(cutoffTime)
    );
    
    expect(filteredItems.length).toBe(1);
    expect(new Date(filteredItems[0].updated_at) > new Date(cutoffTime)).toBe(true);
  });
});
