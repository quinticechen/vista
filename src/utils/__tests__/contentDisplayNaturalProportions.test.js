
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ContentDisplayItem } from '@/components/ContentDisplay';

// Mock the i18n hook
vi.mock('@/hooks/use-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
    i18n: { language: 'en' }
  })
}));

describe('ContentDisplay Natural Proportions Tests', () => {
  const mockContentWithImage = {
    id: '1',
    title: 'Test Content',
    description: 'Content with image',
    cover_image: 'https://example.com/test.jpg',
    content: [],
    created_at: '2023-01-01',
    user_id: 'user1'
  };

  const mockContentWithVideo = {
    id: '2',
    title: 'Video Content',
    description: 'Content with video',
    content: [
      {
        type: 'video',
        media_type: 'video',
        media_url: 'https://example.com/video.mp4'
      }
    ],
    created_at: '2023-01-01',
    user_id: 'user1'
  };

  const mockContentWithFailingImage = {
    id: '3',
    title: 'Failed Image Content',
    description: 'Content with failing image',
    cover_image: 'https://example.com/fail-to-load.jpg',
    content: [],
    created_at: '2023-01-01',
    user_id: 'user1'
  };

  const mockContentTextOnly = {
    id: '4',
    title: 'Text Only Content',
    description: 'Content without any media',
    content: [
      {
        type: 'paragraph',
        text: 'Just text content'
      }
    ],
    created_at: '2023-01-01',
    user_id: 'user1'
  };

  const renderWithRouter = (component) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Fixed Height Layout', () => {
    it('should maintain 400px height when media is present', () => {
      const { container } = renderWithRouter(
        <ContentDisplayItem content={mockContentWithImage} />
      );
      
      const card = container.querySelector('.h-\\[400px\\]');
      expect(card).toBeInTheDocument();
    });

    it('should use auto height when no media is present', () => {
      const { container } = renderWithRouter(
        <ContentDisplayItem content={mockContentTextOnly} />
      );
      
      const card = container.querySelector('.h-auto');
      expect(card).toBeInTheDocument();
    });

    it('should create media section with fixed height and natural width', () => {
      const { container } = renderWithRouter(
        <ContentDisplayItem content={mockContentWithImage} />
      );
      
      // Should have media section with fixed height
      const mediaSection = container.querySelector('[style*="height: 400px"]');
      expect(mediaSection).toBeInTheDocument();
      
      // Should have image element
      const image = container.querySelector('img');
      expect(image).toBeInTheDocument();
      expect(image).toHaveClass('object-cover', 'w-full', 'h-full');
    });
  });

  describe('Natural Proportions Handling', () => {
    it('should render images with natural proportions at 400px height', () => {
      renderWithRouter(
        <ContentDisplayItem content={mockContentWithImage} />
      );
      
      const image = screen.getByAltText('Test Content');
      expect(image).toBeInTheDocument();
      expect(image.src).toBe('https://example.com/test.jpg');
    });

    it('should render videos with natural proportions at 400px height', () => {
      renderWithRouter(
        <ContentDisplayItem content={mockContentWithVideo} />
      );
      
      const video = screen.getByText('Your browser does not support the video tag.');
      expect(video.parentElement).toHaveAttribute('src', 'https://example.com/video.mp4');
    });
  });

  describe('Media Failure Fallback', () => {
    it('should fallback to text-only layout when image fails to load', async () => {
      const { container } = renderWithRouter(
        <ContentDisplayItem content={mockContentWithFailingImage} />
      );
      
      // Simulate image load error
      const image = container.querySelector('img');
      if (image) {
        fireEvent.error(image);
      }
      
      await waitFor(() => {
        // Should fallback to auto height
        const card = container.querySelector('.h-auto');
        expect(card).toBeInTheDocument();
        
        // Should use full width for text
        const textSection = container.querySelector('.w-full');
        expect(textSection).toBeInTheDocument();
      });
    });

    it('should fallback to text-only layout when video fails to load', async () => {
      const { container } = renderWithRouter(
        <ContentDisplayItem content={mockContentWithVideo} />
      );
      
      // Simulate video load error
      const video = container.querySelector('video');
      if (video) {
        fireEvent.error(video);
      }
      
      await waitFor(() => {
        // Should fallback to auto height
        const card = container.querySelector('.h-auto');
        expect(card).toBeInTheDocument();
        
        // Should use full width for text
        const textSection = container.querySelector('.w-full');
        expect(textSection).toBeInTheDocument();
      });
    });
  });

  describe('Content Positioning', () => {
    it('should alternate media position based on index', () => {
      const { container: container1 } = renderWithRouter(
        <ContentDisplayItem content={mockContentWithImage} index={0} />
      );
      
      const { container: container2 } = renderWithRouter(
        <ContentDisplayItem content={mockContentWithImage} index={1} />
      );
      
      // Index 0 should have media on right (text first)
      const textFirst = container1.querySelector('.order-first');
      expect(textFirst).toBeInTheDocument();
      
      // Index 1 should have media on left (text last)
      const textLast = container2.querySelector('.order-last');
      expect(textLast).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should maintain proper flex layout with media and text sections', () => {
      const { container } = renderWithRouter(
        <ContentDisplayItem content={mockContentWithImage} />
      );
      
      // Should have flex layout
      const card = container.querySelector('.flex.flex-row');
      expect(card).toBeInTheDocument();
      
      // Should have text section that takes remaining space
      const textSection = container.querySelector('.flex-1');
      expect(textSection).toBeInTheDocument();
      
      // Should have media section with fixed dimensions
      const mediaSection = container.querySelector('[style*="flexShrink: 0"]');
      expect(mediaSection).toBeInTheDocument();
    });
  });
});
