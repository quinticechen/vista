
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ContentDisplayItem } from '@/components/ContentDisplay';
import { ContentCoverImage } from '@/components/content/ContentCoverImage';
import { renderAnnotatedText } from '@/components/notion/utils/text-renderer';

// Mock the ImageAspectRatio component to simulate image loading failures
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
    
    return <img src={src} alt={alt} className={className} />;
  }
}));

describe('Image Loading and Annotation Handling', () => {
  const mockContentWithFailingImage = {
    id: '1',
    title: 'Test Content',
    description: 'Test description',
    cover_image: 'https://example.com/fail-to-load.jpg',
    content: [
      {
        type: 'paragraph',
        text: 'Some content text'
      }
    ],
    created_at: '2023-01-01',
    user_id: 'user1'
  };

  const mockContentWithAnnotations = {
    id: '2',
    title: 'Annotated Content',
    description: 'Content with annotations',
    content: [
      {
        type: 'paragraph',
        text: 'WORD UP Smart Learning Co., Ltd. | Product Manager | 2021/09 - 2023/09',
        annotations: [
          {
            start: 0,
            end: 53,
            text: 'WORD UP Smart Learning Co., Ltd. | Product Manager | ',
            bold: true,
            italic: false,
            underline: false,
            strikethrough: false,
            code: false
          }
        ]
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

  describe('Image Loading Failure Handling', () => {
    it('should not display ContentCoverImage when image fails to load', () => {
      const { container } = renderWithRouter(
        <ContentCoverImage content={mockContentWithFailingImage} />
      );
      
      // Should not render anything when image fails to load
      expect(container.firstChild).toBeNull();
    });

    it('should display ContentDisplayItem without image when cover image fails', () => {
      renderWithRouter(
        <ContentDisplayItem content={mockContentWithFailingImage} />
      );
      
      // Content should still be displayed
      expect(screen.getByText('Test Content')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
      
      // But no image should be visible
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('should handle missing cover_image gracefully', () => {
      const contentWithoutImage = { ...mockContentWithFailingImage };
      delete contentWithoutImage.cover_image;
      
      const { container } = renderWithRouter(
        <ContentCoverImage content={contentWithoutImage} />
      );
      
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Annotation Rendering', () => {
    it('should render text with bold annotation correctly', () => {
      const result = renderAnnotatedText(
        'WORD UP Smart Learning Co., Ltd. | Product Manager | 2021/09 - 2023/09',
        [
          {
            start: 0,
            end: 53,
            text: 'WORD UP Smart Learning Co., Ltd. | Product Manager | ',
            bold: true,
            italic: false,
            underline: false,
            strikethrough: false,
            code: false
          }
        ]
      );
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle multiple annotations correctly', () => {
      const result = renderAnnotatedText(
        'This is bold and this is italic text',
        [
          {
            start: 8,
            end: 12,
            text: 'bold',
            bold: true,
            italic: false
          },
          {
            start: 25,
            end: 31,
            text: 'italic',
            bold: false,
            italic: true
          }
        ]
      );
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle content with annotations in ContentDisplayItem', () => {
      renderWithRouter(
        <ContentDisplayItem content={mockContentWithAnnotations} />
      );
      
      expect(screen.getByText('Annotated Content')).toBeInTheDocument();
    });

    it('should not break when annotations array is empty', () => {
      const result = renderAnnotatedText('Plain text', []);
      expect(result).toBe('Plain text');
    });

    it('should handle missing annotations gracefully', () => {
      const result = renderAnnotatedText('Plain text');
      expect(result).toBe('Plain text');
    });
  });

  describe('Edge Cases', () => {
    it('should handle content with both failing images and annotations', () => {
      const complexContent = {
        ...mockContentWithFailingImage,
        content: mockContentWithAnnotations.content
      };
      
      renderWithRouter(
        <ContentDisplayItem content={complexContent} />
      );
      
      expect(screen.getByText('Test Content')).toBeInTheDocument();
      // Should not crash despite having both failing image and annotations
    });

    it('should handle malformed annotation objects', () => {
      const result = renderAnnotatedText(
        'Test text',
        [
          {
            // Missing required properties
            bold: true
          }
        ]
      );
      
      expect(result).toBe('Test text');
    });
  });
});
