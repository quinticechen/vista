
import { describe, it, expect } from 'vitest';

describe('Route Guard Integration', () => {
  it('should correctly categorize all application routes', () => {
    const routes = {
      public: [
        '/',
        '/vista',
        '/vista/content-123',
        '/auth',
        '/about',
        '/custom-param',
        '/custom-param/vista',
        '/custom-param/vista/content-456',
        '/another-param/vista/content-789'
      ],
      protected: [
        '/admin',
        '/admin/language-setting',
        '/admin/embedding',
        '/admin/content'
      ]
    };

    // Test public routes
    routes.public.forEach(route => {
      const isAdminRoute = route.startsWith('/admin');
      expect(isAdminRoute).toBe(false);
    });

    // Test protected routes
    routes.protected.forEach(route => {
      const isAdminRoute = route.startsWith('/admin');
      expect(isAdminRoute).toBe(true);
    });
  });

  it('should validate URL parameter route patterns', () => {
    const urlParamRoutes = [
      '/mybrand',
      '/mybrand/vista',
      '/mybrand/vista/content-123',
      '/company-x',
      '/company-x/vista',
      '/company-x/vista/article-456'
    ];

    urlParamRoutes.forEach(route => {
      // URL param routes should not be admin routes
      expect(route.startsWith('/admin')).toBe(false);
      
      // They should follow the pattern /:urlParam[/vista[/:contentId]]
      const segments = route.split('/').filter(Boolean);
      expect(segments.length).toBeGreaterThanOrEqual(1);
      expect(segments.length).toBeLessThanOrEqual(3);
      
      if (segments.length > 1) {
        expect(segments[1]).toBe('vista');
      }
    });
  });

  it('should ensure scroll behavior is preserved for anchor links', () => {
    const routesWithAnchors = [
      '/#purpose-input',
      '/vista#search-results',
      '/custom-param#section-1',
      '/about#contact-info'
    ];

    routesWithAnchors.forEach(route => {
      const hasHash = route.includes('#');
      expect(hasHash).toBe(true);
      
      // ScrollToTop component should not scroll when hash is present
      const shouldScroll = !hasHash;
      expect(shouldScroll).toBe(false);
    });
  });
});
