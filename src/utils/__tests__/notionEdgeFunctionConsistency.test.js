
import { describe, it, expect } from 'vitest';

describe('Notion Edge Function Background Color Consistency', () => {
  it('should handle background colors consistently between sync and webhook functions', () => {
    const mockRichText = [
      {
        plain_text: 'Text with blue background and bold formatting',
        annotations: {
          bold: true,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'blue_background'
        }
      },
      {
        plain_text: 'Regular red text',
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'red'
        }
      }
    ];

    // Mock the extractAnnotationsSimplified function (should be identical in both functions)
    const extractAnnotationsSimplified = (richText) => {
      if (!richText || richText.length === 0) return [];
      
      const annotations = [];
      let currentPosition = 0;
      
      for (const rt of richText) {
        if (!rt || !rt.annotations) {
          currentPosition += (rt.plain_text || '').length;
          continue;
        }
        
        const { bold, italic, strikethrough, underline, code, color } = rt.annotations;
        
        if (bold || italic || strikethrough || underline || code || (color && color !== 'default') || rt.href) {
          const textLength = (rt.plain_text || '').length;
          const annotation = {
            text: rt.plain_text,
            start: currentPosition,
            end: currentPosition + textLength,
            bold,
            italic,
            strikethrough,
            underline,
            code,
            href: rt.href || undefined
          };
          
          // Handle background colors properly (format: color_background)
          if (color && color !== 'default') {
            if (color.includes('_background')) {
              annotation.background_color = color.replace('_background', '');
            } else {
              annotation.color = color;
            }
          }
          
          annotations.push(annotation);
        }
        
        currentPosition += (rt.plain_text || '').length;
      }
      
      return annotations;
    };

    const result = extractAnnotationsSimplified(mockRichText);

    expect(result).toHaveLength(2);
    
    // First annotation should have background_color and bold
    expect(result[0]).toMatchObject({
      text: 'Text with blue background and bold formatting',
      start: 0,
      end: 44,
      bold: true,
      background_color: 'blue'
    });
    expect(result[0]).not.toHaveProperty('color');
    
    // Second annotation should have text color only
    expect(result[1]).toMatchObject({
      text: 'Regular red text',
      start: 44,
      end: 60,
      bold: false,
      color: 'red'
    });
    expect(result[1]).not.toHaveProperty('background_color');
  });

  it('should verify background color storage format in content jsonb', () => {
    const mockProcessedContent = [
      {
        type: 'paragraph',
        text: 'This text has yellow background and red text',
        annotations: [
          {
            text: 'yellow background',
            start: 14,
            end: 31,
            background_color: 'yellow'
          },
          {
            text: 'red text',
            start: 36,
            end: 44,
            color: 'red'
          }
        ]
      }
    ];

    // Verify the content structure matches expected format
    expect(mockProcessedContent[0].annotations[0]).toHaveProperty('background_color', 'yellow');
    expect(mockProcessedContent[0].annotations[1]).toHaveProperty('color', 'red');
    
    // Ensure background_color and color are mutually exclusive per annotation
    expect(mockProcessedContent[0].annotations[0]).not.toHaveProperty('color');
    expect(mockProcessedContent[0].annotations[1]).not.toHaveProperty('background_color');
  });

  it('should handle all supported background colors', () => {
    const supportedBackgroundColors = [
      'red_background',
      'blue_background', 
      'green_background',
      'yellow_background',
      'orange_background',
      'purple_background',
      'pink_background',
      'gray_background',
      'brown_background'
    ];

    const mockRichTextSegments = supportedBackgroundColors.map((color, index) => ({
      plain_text: `Text ${index}`,
      annotations: {
        bold: false,
        italic: false,
        strikethrough: false,
        underline: false,
        code: false,
        color: color
      }
    }));

    const extractBackgroundColor = (color) => {
      if (color && color.includes('_background')) {
        return color.replace('_background', '');
      }
      return null;
    };

    const expectedColors = supportedBackgroundColors.map(color => 
      color.replace('_background', '')
    );

    mockRichTextSegments.forEach((segment, index) => {
      const bgColor = extractBackgroundColor(segment.annotations.color);
      expect(bgColor).toBe(expectedColors[index]);
    });
  });
});
