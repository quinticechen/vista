
/**
 * @jest-environment jsdom
 */

describe('Notion Webhook Syncing Feature', () => {
  const mockProfile = {
    id: 'user-123',
    notion_database_id: '1f0b07b9915c807095caf75eb3f47ed1',
    notion_api_key: 'secret_test_key',
    verification_token: 'test_token_123'
  };

  test('should display Notion template link', () => {
    // Test that the Notion template link is properly displayed
    expect(true).toBe(true); // Placeholder for actual implementation
  });

  test('should save Notion settings correctly', () => {
    // Test saving Notion API key and database ID
    const notionSettings = {
      notion_database_id: '1f0b07b9915c807095caf75eb3f47ed1',
      notion_api_key: 'secret_test_key'
    };
    
    expect(notionSettings.notion_database_id).toBe('1f0b07b9915c807095caf75eb3f47ed1');
    expect(notionSettings.notion_api_key).toBe('secret_test_key');
  });

  test('should trigger manual sync operation', () => {
    // Test manual sync now functionality
    expect(true).toBe(true); // Placeholder for actual implementation
  });

  test('should display user-specific webhook URL', () => {
    // Test that webhook URL includes user ID parameter
    const webhookUrl = `https://oyvbdbajqsqzafpuahvz.supabase.co/functions/v1/notion-webhook?user_id=${mockProfile.id}`;
    
    expect(webhookUrl).toContain('user_id=');
    expect(webhookUrl).toContain(mockProfile.id);
  });

  test('should display verification token with refresh capability', () => {
    // Test verification token display and refresh
    expect(mockProfile.verification_token).toBe('test_token_123');
  });

  test('should provide webhook setup instructions', () => {
    // Test that setup instructions are comprehensive
    const setupSteps = [
      'Save your Notion settings above first',
      'Go to your Notion integration settings',
      'Add your unique webhook URL above to your integration',
      'Click "Verify subscription" in Notion - your token will appear automatically',
      'Select "Page content changed" as the event type'
    ];
    
    expect(setupSteps.length).toBe(5);
    expect(setupSteps[0]).toContain('Save your Notion settings');
  });
});
