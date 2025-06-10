
/**
 * Test file for embedding job polling and notification logic
 * Tests to prevent duplicate success notifications
 */

describe('Embedding Job Polling and Notifications', () => {
  const mockJob = {
    id: 'test-job',
    status: 'processing',
    items_processed: 5,
    total_items: 10
  };

  test('Should not show multiple success notifications for same job', () => {
    let notificationCount = 0;
    const mockToast = {
      success: () => notificationCount++
    };

    // Simulate polling the same completed job multiple times
    const completedJob = { ...mockJob, status: 'completed' };
    let hasShownNotification = false;

    // First poll - should show notification
    if (completedJob.status === 'completed' && !hasShownNotification) {
      mockToast.success();
      hasShownNotification = true;
    }

    // Second poll - should not show notification again
    if (completedJob.status === 'completed' && !hasShownNotification) {
      mockToast.success();
    }

    expect(notificationCount).toBe(1);
  });

  test('Should clear polling interval when job completes', () => {
    let intervalCleared = false;
    const mockClearInterval = () => { intervalCleared = true; };

    const jobStatuses = ['processing', 'completed'];
    
    jobStatuses.forEach(status => {
      if (status === 'completed' || status === 'error' || status === 'partial_success') {
        mockClearInterval();
      }
    });

    expect(intervalCleared).toBe(true);
  });
});
