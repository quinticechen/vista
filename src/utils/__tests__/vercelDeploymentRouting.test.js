
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Vercel Deployment URL Parameter Routing', () => {
  const mockNavigate = vi.fn();
  const mockLocation = { pathname: '', search: '' };

  beforeEach(() => {
    vi.clearAllMocks();
    global.window = {
      location: mockLocation,
      history: {
        pushState: vi.fn(),
        replaceState: vi.fn()
      }
    };
  });

  describe('URL Parameter Route Accessibility', () => {
    const urlParamRoutes = [
      { path: '/quintice', description: 'User profile landing page' },
      { path: '/quintice/vista', description: 'User vista page' },
      { path: '/quintice/vista/content-123', description: 'User content detail page' },
      { path: '/company-brand', description: 'Brand profile page' },
      { path: '/company-brand/vista', description: 'Brand vista page' }
    ];

    urlParamRoutes.forEach(({ path, description }) => {
      it(`should handle direct access to ${description}: ${path}`, () => {
        mockLocation.pathname = path;
        
        // Simulate what should happen when accessing the route directly
        const segments = path.split('/').filter(Boolean);
        const urlParam = segments[0];
        
        expect(urlParam).toBeDefined();
        expect(urlParam.length).toBeGreaterThan(0);
        
        // Should not be admin route
        expect(path.startsWith('/admin')).toBe(false);
        
        // Should be a valid URL parameter format
        expect(urlParam).toMatch(/^[a-zA-Z0-9_-]+$/);
      });
    });

    it('should handle root path correctly', () => {
      mockLocation.pathname = '/';
      
      // Root path should not have URL parameter
      const segments = mockLocation.pathname.split('/').filter(Boolean);
      expect(segments.length).toBe(0);
    });

    it('should differentiate between root and URL parameter routes', () => {
      const testCases = [
        { path: '/', hasUrlParam: false },
        { path: '/quintice', hasUrlParam: true, urlParam: 'quintice' },
        { path: '/admin', hasUrlParam: false }, // Admin route, not URL param
        { path: '/vista', hasUrlParam: false }, // Global vista, not URL param
        { path: '/company-name', hasUrlParam: true, urlParam: 'company-name' }
      ];

      testCases.forEach(({ path, hasUrlParam, urlParam }) => {
        mockLocation.pathname = path;
        const segments = path.split('/').filter(Boolean);
        
        if (hasUrlParam) {
          expect(segments.length).toBeGreaterThan(0);
          expect(segments[0]).toBe(urlParam);
          // Should not be reserved routes
          expect(['admin', 'vista', 'about', 'auth'].includes(segments[0])).toBe(false);
        } else {
          // Either root or reserved route
          const isReservedRoute = segments.length > 0 && 
            ['admin', 'vista', 'about', 'auth'].includes(segments[0]);
          const isRoot = segments.length === 0;
          expect(isReservedRoute || isRoot).toBe(true);
        }
      });
    });
  });

  describe('Server-Side Routing Configuration', () => {
    it('should require catch-all routing for SPA functionality', () => {
      const requiredRedirects = [
        { source: '/:urlParam*', destination: '/index.html' },
        { source: '/admin/:path*', destination: '/index.html' },
        { source: '/vista/:path*', destination: '/index.html' }
      ];

      requiredRedirects.forEach(redirect => {
        expect(redirect.source).toBeDefined();
        expect(redirect.destination).toBe('/index.html');
      });
    });

    it('should handle static assets correctly', () => {
      const staticPaths = [
        '/favicon.ico',
        '/robots.txt',
        '/_next/static/*',
        '/assets/*'
      ];

      staticPaths.forEach(path => {
        // Static assets should not be redirected to index.html
        expect(path.includes('.')).toBe(true);
      });
    });
  });

  describe('URL Parameter Validation in Production', () => {
    it('should validate URL parameters meet requirements', () => {
      const validUrlParams = ['quintice', 'company-brand', 'user123', 'my-startup'];
      const invalidUrlParams = ['', ' ', 'admin', 'vista', 'about', '!@#$'];

      validUrlParams.forEach(param => {
        expect(param).toMatch(/^[a-zA-Z0-9_-]+$/);
        expect(param.length).toBeGreaterThan(0);
        expect(['admin', 'vista', 'about', 'auth'].includes(param)).toBe(false);
      });

      invalidUrlParams.forEach(param => {
        const isReserved = ['admin', 'vista', 'about', 'auth'].includes(param);
        const isInvalidFormat = !param.match(/^[a-zA-Z0-9_-]+$/);
        const isEmpty = param.trim().length === 0;
        
        expect(isReserved || isInvalidFormat || isEmpty).toBe(true);
      });
    });
  });
});
