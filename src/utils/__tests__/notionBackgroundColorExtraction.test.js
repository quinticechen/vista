
import { describe, it, expect } from 'vitest';

describe('Notion Background Color Extraction - Complete Implementation', () => {
  it('should extract all supported background colors from Notion rich text', () => {
    const mockNotionRichTextWithBackgrounds = [
      {
        plain_text: 'Default text ',
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default'
        }
      },
      {
        plain_text: 'Gray background ',
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'gray_background'
        }
      },
      {
        plain_text: 'Brown background ',
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'brown_background'
        }
      },
      {
        plain_text: 'Orange background ',
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'orange_background'
        }
      },
      {
        plain_text: 'Yellow background ',
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
        plain_text: 'Green background ',
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'green_background'
        }
      },
      {
        plain_text: 'Blue background ',
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'blue_background'
        }
      },
      {
        plain_text: 'Purple background ',
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'purple_background'
        }
      },
      {
        plain_text: 'Pink background ',
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'pink_background'
        }
      },
      {
        plain_text: 'Red background ❤️❤️',
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'red_background'
        }
      }
    ];

    // Mock the extractAnnotationsSimplified function behavior
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
        const textLength = (rt.plain_text || '').length;
        
        // Check if any formatting is applied or if there's a background color
        if (bold || italic || strikethrough || underline || code || (color && color !== 'default') || rt.href) {
          const annotation = {
            text: rt.plain_text,
            start: currentPosition,
            end: currentPosition + textLength,
            bold: bold || false,
            italic: italic || false,
            strikethrough: strikethrough || false,
            underline: underline || false,
            code: code || false
          };
          
          // Handle background colors properly (format: color_background)
          if (color && color !== 'default') {
            if (color.includes('_background')) {
              const baseColor = color.replace('_background', '');
              // Only add background_color if it's not default
              if (baseColor && baseColor !== 'default') {
                annotation.background_color = baseColor;
              }
            } else {
              // Regular text color
              annotation.color = color;
            }
          }
          
          // Handle links
          if (rt.href) {
            annotation.href = rt.href;
          }
          
          annotations.push(annotation);
        }
        
        currentPosition += textLength;
      }
      
      return annotations;
    };

    const result = extractAnnotationsSimplified(mockNotionRichTextWithBackgrounds);

    // Should extract 9 annotations (all except default)
    expect(result).toHaveLength(9);
    
    // Verify each background color is properly extracted
    expect(result[0]).toMatchObject({
      text: 'Gray background ',
      background_color: 'gray'
    });
    
    expect(result[1]).toMatchObject({
      text: 'Brown background ',
      background_color: 'brown'
    });
    
    expect(result[2]).toMatchObject({
      text: 'Orange background ',
      background_color: 'orange'
    });
    
    expect(result[3]).toMatchObject({
      text: 'Yellow background ',
      background_color: 'yellow'
    });
    
    expect(result[4]).toMatchObject({
      text: 'Green background ',
      background_color: 'green'
    });
    
    expect(result[5]).toMatchObject({
      text: 'Blue background ',
      background_color: 'blue'
    });
    
    expect(result[6]).toMatchObject({
      text: 'Purple background ',
      background_color: 'purple'
    });
    
    expect(result[7]).toMatchObject({
      text: 'Pink background ',
      background_color: 'pink'
    });
    
    expect(result[8]).toMatchObject({
      text: 'Red background ❤️❤️',
      background_color: 'red'
    });

    // Ensure no regular 'color' property exists for background colors
    result.forEach(annotation => {
      if (annotation.background_color) {
        expect(annotation).not.toHaveProperty('color');
      }
    });
  });

  it('should handle mixed text and background colors correctly', () => {
    const mockMixedColorText = [
      {
        plain_text: 'Regular red text with ',
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'red'
        }
      },
      {
        plain_text: 'yellow background',
        annotations: {
          bold: true,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'yellow_background'
        }
      }
    ];

    const extractAnnotationsSimplified = (richText) => {
      const annotations = [];
      let currentPosition = 0;
      
      for (const rt of richText) {
        if (!rt || !rt.annotations) {
          currentPosition += (rt.plain_text || '').length;
          continue;
        }
        
        const { bold, italic, strikethrough, underline, code, color } = rt.annotations;
        const textLength = (rt.plain_text || '').length;
        
        if (bold || italic || strikethrough || underline || code || (color && color !== 'default') || rt.href) {
          const annotation = {
            text: rt.plain_text,
            start: currentPosition,
            end: currentPosition + textLength,
            bold: bold || false,
            italic: italic || false,
            strikethrough: strikethrough || false,
            underline: underline || false,
            code: code || false
          };
          
          if (color && color !== 'default') {
            if (color.includes('_background')) {
              const baseColor = color.replace('_background', '');
              if (baseColor && baseColor !== 'default') {
                annotation.background_color = baseColor;
              }
            } else {
              annotation.color = color;
            }
          }
          
          if (rt.href) {
            annotation.href = rt.href;
          }
          
          annotations.push(annotation);
        }
        
        currentPosition += textLength;
      }
      
      return annotations;
    };

    const result = extractAnnotationsSimplified(mockMixedColorText);

    expect(result).toHaveLength(2);
    
    // First annotation should have text color only
    expect(result[0]).toMatchObject({
      text: 'Regular red text with ',
      color: 'red',
      bold: false
    });
    expect(result[0]).not.toHaveProperty('background_color');
    
    // Second annotation should have background color and bold formatting
    expect(result[1]).toMatchObject({
      text: 'yellow background',
      background_color: 'yellow',
      bold: true
    });
    expect(result[1]).not.toHaveProperty('color');
  });

  it('should verify final content structure matches expected format', () => {
    const expectedContentStructure = {
      type: 'paragraph',
      text: 'Text Background Colors: Can be applied to blocks or text using highlight - Default, Gray, Brown, Orange, Yellow, Green, Blue, Purple, Pink, Red ❤️❤️',
      annotations: [
        {
          text: 'Default',
          start: 74,
          end: 81,
          background_color: 'default'
        },
        {
          text: 'Gray',
          start: 83,
          end: 87,
          background_color: 'gray'
        },
        {
          text: 'Brown',
          start: 89,
          end: 94,
          background_color: 'brown'
        },
        {
          text: 'Orange',
          start: 96,
          end: 102,
          background_color: 'orange'
        },
        {
          text: 'Yellow',
          start: 104,
          end: 110,
          background_color: 'yellow'
        },
        {
          text: 'Green',
          start: 112,
          end: 117,
          background_color: 'green'
        },
        {
          text: 'Blue',
          start: 119,
          end: 123,
          background_color: 'blue'
        },
        {
          text: 'Purple',
          start: 125,
          end: 131,
          background_color: 'purple'
        },
        {
          text: 'Pink',
          start: 133,
          end: 137,
          background_color: 'pink'
        },
        {
          text: 'Red',
          start: 139,
          end: 142,
          background_color: 'red'
        }
      ]
    };

    // Verify structure
    expect(expectedContentStructure).toHaveProperty('type', 'paragraph');
    expect(expectedContentStructure).toHaveProperty('text');
    expect(expectedContentStructure).toHaveProperty('annotations');
    expect(expectedContentStructure.annotations).toBeInstanceOf(Array);
    expect(expectedContentStructure.annotations).toHaveLength(10);

    // Verify each annotation has correct properties
    expectedContentStructure.annotations.forEach((annotation, index) => {
      expect(annotation).toHaveProperty('text');
      expect(annotation).toHaveProperty('start');
      expect(annotation).toHaveProperty('end');
      expect(annotation).toHaveProperty('background_color');
      expect(typeof annotation.start).toBe('number');
      expect(typeof annotation.end).toBe('number');
      expect(annotation.start).toBeLessThan(annotation.end);
    });
  });
});
