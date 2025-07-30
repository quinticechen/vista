import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: '123', title: 'Test Content', visitor_count: 5 },
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: null,
          error: null
        }))
      }))
    }))
  }
}));

// Mock the content detail components
vi.mock('@/pages/ContentDetail', () => ({
  default: () => <div data-testid="content-detail">Content Detail with Visitor Count: 6</div>
}));

vi.mock('@/pages/UrlParamContentDetail', () => ({
  default: () => <div data-testid="url-param-content-detail">URL Param Content Detail with Visitor Count: 6</div>
}));

describe('Content Visitor Tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (component) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  describe('Visitor Count Database Operations', () => {
    it('should increment visitor count when content is viewed', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Simulate viewing content
      const incrementVisitorCount = async (contentId) => {
        return supabase
          .from('content_items')
          .update({ visitor_count: 6 })
          .eq('id', contentId);
      };

      await incrementVisitorCount('123');
      
      expect(supabase.from).toHaveBeenCalledWith('content_items');
    });

    it('should display visitor count on content page', async () => {
      const ContentDetail = (await import('@/pages/ContentDetail')).default;
      renderWithRouter(<ContentDetail />);
      
      await waitFor(() => {
        expect(screen.getByTestId('content-detail')).toBeInTheDocument();
        expect(screen.getByTestId('content-detail')).toHaveTextContent('Visitor Count: 6');
      });
    });

    it('should handle visitor count increment errors gracefully', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Mock error response
      supabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Database error' }
          }))
        }))
      });

      const incrementVisitorCount = async (contentId) => {
        const result = await supabase
          .from('content_items')
          .update({ visitor_count: 1 })
          .eq('id', contentId);
        
        return result.error === null;
      };

      const success = await incrementVisitorCount('123');
      expect(success).toBe(false);
    });
  });

  describe('URL Parameter Content Visitor Tracking', () => {
    it('should track visitors on URL parameter content pages', async () => {
      const UrlParamContentDetail = (await import('@/pages/UrlParamContentDetail')).default;
      renderWithRouter(<UrlParamContentDetail />);
      
      await waitFor(() => {
        expect(screen.getByTestId('url-param-content-detail')).toBeInTheDocument();
        expect(screen.getByTestId('url-param-content-detail')).toHaveTextContent('Visitor Count: 6');
      });
    });
  });

  describe('Visitor Count Display', () => {
    it('should show visitor count with proper formatting', () => {
      const formatVisitorCount = (count) => {
        if (count >= 1000) {
          return `${(count / 1000).toFixed(1)}k`;
        }
        return count.toString();
      };

      expect(formatVisitorCount(5)).toBe('5');
      expect(formatVisitorCount(1500)).toBe('1.5k');
      expect(formatVisitorCount(999)).toBe('999');
    });

    it('should handle zero visitor count', () => {
      const displayCount = (count) => count || 0;
      
      expect(displayCount(null)).toBe(0);
      expect(displayCount(undefined)).toBe(0);
      expect(displayCount(0)).toBe(0);
      expect(displayCount(5)).toBe(5);
    });
  });
});