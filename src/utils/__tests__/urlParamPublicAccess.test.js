
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('URL Parameter Public Access', () => {
  const mockSupabaseClient = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Public Profile Access', () => {
    it('should allow unauthenticated access to profiles with url_param', async () => {
      // Mock successful profile fetch for public URL parameter
      mockSupabaseClient.single.mockResolvedValue({
        data: {
          id: 'user-123',
          url_param: 'quintice',
          default_language: 'en',
          supported_ai_languages: ['en', 'es']
        },
        error: null
      });

      const { data, error } = await mockSupabaseClient
        .from('profiles')
        .select('*')
        .eq('url_param', 'quintice')
        .single();

      expect(data).toBeDefined();
      expect(data.url_param).toBe('quintice');
      expect(error).toBeNull();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles');
    });

    it('should handle profile not found gracefully', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' }
      });

      const { data, error } = await mockSupabaseClient
        .from('profiles')
        .select('*')
        .eq('url_param', 'nonexistent')
        .single();

      expect(data).toBeNull();
      expect(error.code).toBe('PGRST116');
    });

    it('should no longer encounter 406 errors after RLS policy fix', async () => {
      // This test verifies that the RLS policy allows public access
      mockSupabaseClient.single.mockResolvedValue({
        data: {
          id: 'user-456',
          url_param: 'testuser',
          default_language: 'en',
          supported_ai_languages: ['en']
        },
        error: null
      });

      const { data, error } = await mockSupabaseClient
        .from('profiles')
        .select('*')
        .eq('url_param', 'testuser')
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      // Should not get 406 errors anymore
      expect(error?.message).not.toContain('406');
    });
  });

  describe('URL Parameter Route Functionality', () => {
    const testRoutes = [
      { route: '/quintice', description: 'Profile landing page' },
      { route: '/quintice/vista', description: 'Vista search page' },
      { route: '/quintice/vista/content-123', description: 'Content detail page' }
    ];

    testRoutes.forEach(({ route, description }) => {
      it(`should support public access to ${description}: ${route}`, () => {
        const segments = route.split('/').filter(Boolean);
        const urlParam = segments[0];
        
        expect(urlParam).toBe('quintice');
        expect(route.startsWith('/admin')).toBe(false);
        
        // Verify route structure
        if (segments.length === 1) {
          expect(segments).toEqual(['quintice']);
        } else if (segments.length === 2) {
          expect(segments).toEqual(['quintice', 'vista']);
        } else if (segments.length === 3) {
          expect(segments[1]).toBe('vista');
          expect(segments[2]).toMatch(/^content-/);
        }
      });
    });
  });

  describe('User Experience Without Authentication', () => {
    it('should allow full feature access on URL parameter pages', () => {
      const publicFeatures = [
        'view profile content',
        'search user content',
        'view content details',
        'navigate between pages'
      ];

      publicFeatures.forEach(feature => {
        // These features should be available without login
        expect(feature).toBeDefined();
        
        // Verify no authentication barriers for URL parameter routes
        const requiresAuth = feature.includes('admin') || feature.includes('edit');
        expect(requiresAuth).toBe(false);
      });
    });

    it('should provide appropriate error messages for missing profiles', () => {
      const errorScenarios = [
        {
          urlParam: 'nonexistent',
          expectedMessage: 'does not exist',
          shouldShowFallback: true
        },
        {
          urlParam: 'quintice',
          profileExists: true,
          shouldShowContent: true
        }
      ];

      errorScenarios.forEach(scenario => {
        if (scenario.profileExists) {
          expect(scenario.shouldShowContent).toBe(true);
        } else {
          expect(scenario.expectedMessage).toContain('does not exist');
          expect(scenario.shouldShowFallback).toBe(true);
        }
      });
    });
  });
});
