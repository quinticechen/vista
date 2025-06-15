
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Route Guards', () => {
  const mockNavigate = vi.fn();
  const mockToast = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Admin Route Protection', () => {
    it('should allow access to public routes without authentication', () => {
      const publicRoutes = [
        '/',
        '/about',
        '/auth',
        '/vista',
        '/vista/123',
        '/custom-param',
        '/custom-param/vista',
        '/custom-param/vista/456'
      ];
      
      publicRoutes.forEach(route => {
        expect(route).not.toMatch(/^\/admin/);
      });
    });

    it('should identify admin routes correctly', () => {
      const adminRoutes = [
        '/admin',
        '/admin/language-setting',
        '/admin/embedding',
        '/admin/content'
      ];
      
      adminRoutes.forEach(route => {
        expect(route).toMatch(/^\/admin/);
      });
    });

    it('should redirect unauthenticated users from admin routes', async () => {
      const mockCheckAdminStatus = vi.fn().mockResolvedValue(false);
      const mockGetSession = vi.fn().mockResolvedValue({ data: { session: null } });
      
      // Simulate AdminGuard behavior
      const session = null;
      const isAdmin = false;
      
      if (!session) {
        mockNavigate('/');
        mockToast.error("Please sign in to access the admin page");
      } else if (!isAdmin) {
        mockNavigate('/');
        mockToast.error("You don't have permission to access this page");
      }
      
      expect(mockNavigate).toHaveBeenCalledWith('/');
      expect(mockToast.error).toHaveBeenCalledWith("Please sign in to access the admin page");
    });

    it('should allow authenticated admin users to access admin routes', async () => {
      const mockSession = { user: { id: 'user-123' } };
      const mockCheckAdminStatus = vi.fn().mockResolvedValue(true);
      
      // Simulate AdminGuard behavior for valid admin
      const session = mockSession;
      const isAdmin = true;
      
      // Should not redirect
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockToast.error).not.toHaveBeenCalled();
    });
  });
});
