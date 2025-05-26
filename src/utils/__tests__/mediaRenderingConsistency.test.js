
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('Media Rendering Consistency Tests', () => {
  const mockContentWithVideo = {
    id: '1',
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

  const mockContentWithUnavailableImage = {
    id: '2',
    title: 'Content with unavailable image',
    description: 'This image will fail to load',
    cover_image: 'https://example.com/nonexistent.jpg',
    content: [],
    created_at: '2023-01-01',
    user_id: 'user1'
  };

  const mockContentWithYouTubeVideo = {
    id: '3',
    title: 'YouTube Video Content',
    description: 'Content with YouTube video',
    content: [
      {
        type: 'video',
        media_type: 'video',
        media_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
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

  describe('Video Rendering', () => {
    it('should render video element for direct video URLs', () => {
      renderWithRouter(
        <ContentDisplayItem content={mockContentWithVideo} />
      );
      
      const video = screen.getByText('Your browser does not support the video tag.');
      expect(video.parentElement).toHaveAttribute('src', 'https://example.com/video.mp4');
      expect(video.parentElement).toHaveAttribute('controls');
    });

    it('should render iframe for YouTube videos', () => {
      const { container } = renderWithRouter(
        <ContentDisplayItem content={mockContentWithYouTubeVideo} />
      );
      
      const iframe = container.querySelector('iframe');
      expect(iframe).toBeInTheDocument();
      expect(iframe.src).toContain('youtube.com/embed/dQw4w9WgXcQ');
    });

    it('should maintain fixed height of 400px for video content', () => {
      const { container } = renderWithRouter(
        <ContentDisplayItem content={mockContentWithVideo} />
      );
      
      const card = container.querySelector('.h-\\[400px\\]');
      expect(card).toBeInTheDocument();
    });

    it('should fall back to text-only when video fails to load', async () => {
      const { container } = renderWithRouter(
        <ContentDisplayItem content={mockContentWithVideo} />
      );
      
      const video = container.querySelector('video');
      if (video) {
        fireEvent.error(video);
      }
      
      // Should fall back to auto height and full width text
      const autoHeightCard = container.querySelector('.h-auto');
      expect(autoHeightCard).toBeInTheDocument();
    });
  });

  describe('Unavailable Media Handling', () => {
    it('should not display media section when image is unavailable', async () => {
      const { container } = renderWithRouter(
        <ContentDisplayItem content={mockContentWithUnavailableImage} />
      );
      
      const image = container.querySelector('img');
      if (image) {
        fireEvent.error(image);
      }
      
      // Should not have media section visible
      const mediaSection = container.querySelector('[style*="flexShrink: 0"]');
      expect(mediaSection).not.toBeInTheDocument();
      
      // Should use auto height layout
      const autoHeightCard = container.querySelector('.h-auto');
      expect(autoHeightCard).toBeInTheDocument();
    });

    it('should use full width for text when no media is available', () => {
      const { container } = renderWithRouter(
        <ContentDisplayItem content={{ ...mockContentWithUnavailableImage, cover_image: null }} />
      );
      
      const textSection = container.querySelector('.w-full');
      expect(textSection).toBeInTheDocument();
    });
  });

  describe('Media Section Layout', () => {
    it('should calculate width based on natural proportions at 400px height', () => {
      const { container } = renderWithRouter(
        <ContentDisplayItem content={mockContentWithVideo} />
      );
      
      const mediaSection = container.querySelector('[style*="height: 400px"]');
      expect(mediaSection).toBeInTheDocument();
      expect(mediaSection).toHaveStyle('flexShrink: 0');
    });

    it('should maintain consistent layout between different media types', () => {
      const { container: videoContainer } = renderWithRouter(
        <ContentDisplayItem content={mockContentWithVideo} />
      );
      
      const { container: imageContainer } = renderWithRouter(
        <ContentDisplayItem content={mockContentWithUnavailableImage} />
      );
      
      const videoCard = videoContainer.querySelector('.h-\\[400px\\]');
      const imageCard = imageContainer.querySelector('.h-\\[400px\\]');
      
      // Both should use same card height when media is present
      expect(videoCard).toBeInTheDocument();
      expect(imageCard).toBeInTheDocument();
    });
  });

  describe('Content Alternation', () => {
    it('should alternate media position based on index', () => {
      const { container: container1 } = renderWithRouter(
        <ContentDisplayItem content={mockContentWithVideo} index={0} />
      );
      
      const { container: container2 } = renderWithRouter(
        <ContentDisplayItem content={mockContentWithVideo} index={1} />
      );
      
      // Index 0 should have media on right (text first)
      const textFirst = container1.querySelector('.order-first');
      expect(textFirst).toBeInTheDocument();
      
      // Index 1 should have media on left (text last)
      const textLast = container2.querySelector('.order-last');
      expect(textLast).toBeInTheDocument();
    });
  });
});
