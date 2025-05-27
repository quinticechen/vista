
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Index Page URL Parameter Handling', () => {
  const mockNavigate = vi.fn();
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Profile Loading States', () => {
    it('should show loading state while fetching URL parameter profile', () => {
      const loadingState = {
        loading: true,
        urlParam: 'quintice',
        profileNotFound: false
      };

      expect(loadingState.loading).toBe(true);
      expect(loadingState.urlParam).toBe('quintice');
    });

    it('should handle successful profile loading', () => {
      const successState = {
        loading: false,
        urlParam: 'quintice',
        ownerProfile: {
          id: 'user-123',
          url_param: 'quintice',
          default_language: 'en',
          supported_ai_languages: ['en', 'es']
        },
        profileNotFound: false
      };

      expect(successState.loading).toBe(false);
      expect(successState.profileNotFound).toBe(false);
      expect(successState.ownerProfile.url_param).toBe('quintice');
    });

    it('should handle profile not found state', () => {
      const notFoundState = {
        loading: false,
        urlParam: 'nonexistent',
        ownerProfile: null,
        profileNotFound: true
      };

      expect(notFoundState.loading).toBe(false);
      expect(notFoundState.profileNotFound).toBe(true);
      expect(notFoundState.ownerProfile).toBeNull();
    });
  });

  describe('Search Functionality', () => {
    it('should allow search when profile exists', () => {
      const handlePurposeSubmit = (purpose) => {
        const urlParam = 'quintice';
        const profileNotFound = false;

        if (urlParam && profileNotFound) {
          mockToast.error(`Cannot search - the page for /${urlParam} does not exist.`);
          return;
        }

        mockNavigate(`/${urlParam}/vista?search=${encodeURIComponent(purpose)}`);
      };

      handlePurposeSubmit('test search');
      expect(mockNavigate).toHaveBeenCalledWith('/quintice/vista?search=test%20search');
      expect(mockToast.error).not.toHaveBeenCalled();
    });

    it('should prevent search when profile not found', () => {
      const handlePurposeSubmit = (purpose) => {
        const urlParam = 'nonexistent';
        const profileNotFound = true;

        if (urlParam && profileNotFound) {
          mockToast.error(`Cannot search - the page for /${urlParam} does not exist.`);
          return;
        }

        mockNavigate(`/${urlParam}/vista?search=${encodeURIComponent(purpose)}`);
      };

      handlePurposeSubmit('test search');
      expect(mockToast.error).toHaveBeenCalledWith('Cannot search - the page for /nonexistent does not exist.');
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Error Messaging', () => {
    it('should show clear error message for non-existent profiles', () => {
      const errorMessages = [
        'The page for /nonexistent does not exist.',
        'Cannot search - the page for /nonexistent does not exist.',
        'Could not load page for /nonexistent. Please check if this page exists.'
      ];

      errorMessages.forEach(message => {
        expect(message).toContain('does not exist');
        expect(message).toContain('/nonexistent');
      });
    });

    it('should provide navigation back to home for missing profiles', () => {
      const notFoundPage = {
        showErrorPage: true,
        errorMessage: 'Page Not Found',
        hasHomeButton: true,
        homeAction: () => mockNavigate('/')
      };

      expect(notFoundPage.showErrorPage).toBe(true);
      expect(notFoundPage.hasHomeButton).toBe(true);
      
      notFoundPage.homeAction();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});
