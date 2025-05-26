
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ContentDisplayItem } from '@/components/ContentDisplay';

// Mock the ImageAspectRatio component
vi.mock('@/components/ImageAspectRatio', () => ({
  ImageAspectRatio: ({ src, alt, onError, fallback, className }) => {
    const [hasError, setHasError] = React.useState(false);
    
    React.useEffect(() => {
      // Simulate image loading failure for test images
      if (src && src.includes('fail-to-load')) {
        setHasError(true);
        if (onError) onError();
      }
    }, [src, onError]);
    
    if (hasError && fallback) {
      return fallback;
    }
    
    if (hasError) {
      return null; // Don't render anything if image fails and no fallback
    }
    
    return <img src={src} alt={alt} className={className} data-testid="content-image" />;
  }
}));

describe('ContentDisplay Layout Tests', () => {
  const mockContentWithLandscapeImage = {
    id: '1',
    title: 'Landscape Content',
    description: 'Content with landscape image',
    cover_image: 'https://example.com/landscape.jpg',
    orientation: 'landscape',
    content: [],
    created_at: '2023-01-01',
    user_id: 'user1'
  };

  const mockContentWithPortraitImage = {
    id: '2',
    title: 'Portrait Content',
    description: 'Content with portrait image',
    cover_image: 'https://example.com/portrait.jpg',
    orientation: 'portrait',
    content: [],
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

  const mockContentWithVideo = {
    id: '4',
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

  const mockContentTextOnly = {
    id: '5',
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

  describe('Layout Structure', () => {
    it('should have fixed height of 400px when media is present', () => {
      const { container } = renderWithRouter(
        <ContentDisplayItem content={mockContentWithLandscapeImage} />
      );
      
      const card = container.querySelector('.h-\\[400px\\]');
      expect(card).toBeInTheDocument();
    });

    it('should have auto height when no media is present', () => {
      const { container } = renderWithRouter(
        <ContentDisplayItem content={mockContentTextOnly} />
      );
      
      const card = container.querySelector('.h-auto');
      expect(card).toBeInTheDocument();
    });

    it('should split into two sections when media is present', () => {
      const { container } = renderWithRouter(
        <ContentDisplayItem content={mockContentWithLandscapeImage} />
      );
      
      // Should have text section
      const textSection = container.querySelector('.w-1\\/2');
      expect(textSection).toBeInTheDocument();
      
      // Should have media section
      expect(screen.getByTestId('content-image')).toBeInTheDocument();
    });

    it('should use full width for text when no media is present', () => {
      const { container } = renderWithRouter(
        <ContentDisplayItem content={mockContentTextOnly} />
      );
      
      const textSection = container.querySelector('.w-full');
      expect(textSection).toBeInTheDocument();
    });
  });

  describe('Image Orientation Handling', () => {
    it('should render landscape images correctly', () => {
      renderWithRouter(
        <ContentDisplayItem content={mockContentWithLandscapeImage} />
      );
      
      const image = screen.getByTestId('content-image');
      expect(image).toBeInTheDocument();
      expect(image.src).toBe('https://example.com/landscape.jpg');
    });

    it('should render portrait images correctly', () => {
      renderWithRouter(
        <ContentDisplayItem content={mockContentWithPortraitImage} />
      );
      
      const image = screen.getByTestId('content-image');
      expect(image).toBeInTheDocument();
      expect(image.src).toBe('https://example.com/portrait.jpg');
    });
  });

  describe('Media Failure Handling', () => {
    it('should fallback to text-only layout when image fails to load', () => {
      const { container } = renderWithRouter(
        <ContentDisplayItem content={mockContentWithFailingImage} />
      );
      
      // Should fallback to auto height
      const card = container.querySelector('.h-auto');
      expect(card).toBeInTheDocument();
      
      // Should use full width for text
      const textSection = container.querySelector('.w-full');
      expect(textSection).toBeInTheDocument();
      
      // Should not have image
      expect(screen.queryByTestId('content-image')).not.toBeInTheDocument();
    });

    it('should handle video content correctly', () => {
      renderWithRouter(
        <ContentDisplayItem content={mockContentWithVideo} />
      );
      
      // Should still render content
      expect(screen.getByText('Video Content')).toBeInTheDocument();
      expect(screen.getByText('Content with video')).toBeInTheDocument();
    });
  });

  describe('Content Positioning', () => {
    it('should alternate media position based on index', () => {
      const { container: container1 } = renderWithRouter(
        <ContentDisplayItem content={mockContentWithLandscapeImage} index={0} />
      );
      
      const { container: container2 } = renderWithRouter(
        <ContentDisplayItem content={mockContentWithLandscapeImage} index={1} />
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
    it('should maintain proper structure with different content types', () => {
      const contentWithEmbeddedMedia = {
        ...mockContentWithLandscapeImage,
        content: [
          {
            type: 'image',
            media_type: 'image',
            media_url: 'https://example.com/embedded.jpg'
          },
          {
            type: 'paragraph',
            text: 'Some text content'
          }
        ]
      };
      
      renderWithRouter(
        <ContentDisplayItem content={contentWithEmbeddedMedia} />
      );
      
      expect(screen.getByText('Landscape Content')).toBeInTheDocument();
      expect(screen.getByTestId('content-image')).toBeInTheDocument();
    });
  });
});
