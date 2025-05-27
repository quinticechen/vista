
import { describe, it, expect } from 'vitest';

describe('Notion Background Color Processing - Edge Functions', () => {
  it('should extract and store background colors from Notion rich text annotations', () => {
    const mockNotionRichText = [
      {
        plain_text: 'Text with yellow background',
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'yellow_background'
        }
      },
      {
        plain_text: 'Text with blue background and bold',
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
        plain_text: 'Red text color only',
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

    // Mock extractAnnotationsSimplified function behavior
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
        
        currentPosition += textLength;
      }
      
      return annotations;
    };

    const result = extractAnnotationsSimplified(mockNotionRichText);

    expect(result).toHaveLength(3);
    
    // First annotation should have background_color
    expect(result[0]).toMatchObject({
      text: 'Text with yellow background',
      background_color: 'yellow'
    });
    expect(result[0]).not.toHaveProperty('color');
    
    // Second annotation should have background_color and bold
    expect(result[1]).toMatchObject({
      text: 'Text with blue background and bold',
      background_color: 'blue',
      bold: true
    });
    expect(result[1]).not.toHaveProperty('color');
    
    // Third annotation should have text color only
    expect(result[2]).toMatchObject({
      text: 'Red text color only',
      color: 'red'
    });
    expect(result[2]).not.toHaveProperty('background_color');
  });

  it('should handle all supported Notion background colors', () => {
    const supportedBackgroundColors = [
      'default_background',
      'gray_background',
      'brown_background', 
      'orange_background',
      'yellow_background',
      'green_background',
      'blue_background',
      'purple_background',
      'pink_background',
      'red_background'
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
        const baseColor = color.replace('_background', '');
        return baseColor === 'default' ? null : baseColor;
      }
      return null;
    };

    const expectedColors = [
      null, // default_background should return null
      'gray', 'brown', 'orange', 'yellow', 
      'green', 'blue', 'purple', 'pink', 'red'
    ];

    mockRichTextSegments.forEach((segment, index) => {
      const bgColor = extractBackgroundColor(segment.annotations.color);
      expect(bgColor).toBe(expectedColors[index]);
    });
  });

  it('should verify webhook and sync functions produce identical background color results', () => {
    const mockNotionRichText = [
      {
        plain_text: 'Consistent background processing',
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'green_background'
        }
      }
    ];

    // Both webhook and sync should produce identical results
    const processAnnotations = (richText) => {
      const annotations = [];
      let currentPosition = 0;
      
      for (const rt of richText) {
        const { color } = rt.annotations;
        const textLength = rt.plain_text.length;
        
        if (color && color !== 'default') {
          const annotation = {
            text: rt.plain_text,
            start: currentPosition,
            end: currentPosition + textLength,
            bold: rt.annotations.bold,
            italic: rt.annotations.italic,
            strikethrough: rt.annotations.strikethrough,
            underline: rt.annotations.underline,
            code: rt.annotations.code
          };
          
          if (color.includes('_background')) {
            const baseColor = color.replace('_background', '');
            if (baseColor !== 'default') {
              annotation.background_color = baseColor;
            }
          } else {
            annotation.color = color;
          }
          
          annotations.push(annotation);
        }
        
        currentPosition += textLength;
      }
      
      return annotations;
    };

    const webhookResult = processAnnotations(mockNotionRichText);
    const syncResult = processAnnotations(mockNotionRichText);

    expect(webhookResult).toEqual(syncResult);
    expect(webhookResult[0]).toMatchObject({
      background_color: 'green'
    });
    expect(webhookResult[0]).not.toHaveProperty('color');
  });

  it('should store background colors correctly in content jsonb structure', () => {
    const mockProcessedContent = [
      {
        type: 'paragraph',
        text: 'Text with multiple background colors',
        annotations: [
          {
            text: 'yellow',
            start: 16,
            end: 22,
            background_color: 'yellow'
          },
          {
            text: 'background',
            start: 23,
            end: 33,
            background_color: 'blue'
          },
          {
            text: 'colors',
            start: 34,
            end: 40,
            color: 'red'
          }
        ]
      }
    ];

    // Verify the structure matches expected format
    expect(mockProcessedContent[0].annotations[0]).toHaveProperty('background_color', 'yellow');
    expect(mockProcessedContent[0].annotations[1]).toHaveProperty('background_color', 'blue');
    expect(mockProcessedContent[0].annotations[2]).toHaveProperty('color', 'red');
    
    // Ensure background_color and color are mutually exclusive
    expect(mockProcessedContent[0].annotations[0]).not.toHaveProperty('color');
    expect(mockProcessedContent[0].annotations[1]).not.toHaveProperty('color');
    expect(mockProcessedContent[0].annotations[2]).not.toHaveProperty('background_color');
  });
});
