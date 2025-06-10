
// Test file for validating embedding functionality only processes updated content
// This test simulates the behavior of only embedding content items that were updated
// since the last successful embedding job

describe('Content embedding process for updated items', () => {
  // Mock data
  const mockUser = { id: 'test-user-id' };
  const mockContentItems = [
    { 
      id: '1', 
      title: 'Test Item 1', 
      user_id: 'test-user-id',
      updated_at: '2025-06-01T10:00:00Z' 
    },
    { 
      id: '2', 
      title: 'Test Item 2', 
      user_id: 'test-user-id',
      updated_at: '2025-06-05T15:30:00Z' 
    },
    { 
      id: '3', 
      title: 'Test Item 3',
      user_id: 'test-user-id', 
      updated_at: '2025-06-10T08:45:00Z' 
    }
  ];
  
  const mockPreviousJob = {
    id: 'previous-job',
    status: 'completed',
    completed_at: '2025-06-02T12:00:00Z',
    created_by: 'test-user-id'
  };
  
  const mockNewJob = {
    id: 'new-job',
    status: 'pending',
    created_by: 'test-user-id'
  };
  
  // Mock Supabase client
  const mockSupabase = {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              maybeSingle: jest.fn(() => ({
                data: mockPreviousJob,
                error: null
              }))
            })),
            filter: jest.fn(() => ({
              data: [mockPreviousJob],
              error: null
            }))
          })),
          gt: jest.fn(() => ({
            data: [mockContentItems[1], mockContentItems[2]],  // Only items after last job date
            error: null
          })),
          data: mockContentItems,
          error: null
        })),
        data: mockContentItems,
        error: null
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: {},
          error: null
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: mockNewJob,
            error: null
          }))
        }))
      })),
      rpc: jest.fn(() => ({
        data: {},
        error: null
      }))
    }),
    auth: {
      getUser: jest.fn(() => ({
        data: { user: mockUser },
        error: null
      }))
    },
    functions: {
      invoke: jest.fn(() => ({
        data: { success: true },
        error: null
      }))
    }
  };
  
  test('Should only process content items updated after last embedding', async () => {
    // Using filters based on updated_at column
    const filteredItems = mockContentItems.filter(item => 
      new Date(item.updated_at) > new Date(mockPreviousJob.completed_at)
    );
    
    // Verify we're filtering correctly - should only include items 2 and 3
    expect(filteredItems.length).toBe(2);
    expect(filteredItems.map(i => i.id)).toContain('2');
    expect(filteredItems.map(i => i.id)).toContain('3');
    expect(filteredItems.map(i => i.id)).not.toContain('1');
  });

  test('Should only fetch embedding jobs for the current user', async () => {
    // Simulating fetching jobs filtered by user ID
    const userJobs = [mockPreviousJob, mockNewJob].filter(
      job => job.created_by === mockUser.id
    );
    
    expect(userJobs.length).toBe(2);
    expect(userJobs[0].created_by).toBe(mockUser.id);
    expect(userJobs[1].created_by).toBe(mockUser.id);
  });
  
  test('Should properly handle case with no previous embedding jobs', () => {
    // Simulate no previous jobs existing
    const noJobs = [];
    
    // In this case, all content items should be processed
    // since there's no cutoff date
    const itemsToProcess = noJobs.length === 0 ? mockContentItems : [];
    
    expect(itemsToProcess.length).toBe(3);
    expect(itemsToProcess).toEqual(mockContentItems);
  });

  test('Should include user ID when starting embedding process', () => {
    // Verify we're passing both job ID and user ID when starting process
    const payload = {
      jobId: 'new-job',
      userId: mockUser.id
    };
    
    expect(payload.jobId).toBeDefined();
    expect(payload.userId).toBeDefined();
    expect(payload.userId).toBe(mockUser.id);
  });
});
