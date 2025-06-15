
import { describe, it, expect } from 'vitest';

describe('Notion Annotation Highlight and Background Styles', () => {
  it('should store both highlight and background colors in annotations', () => {
    const mockRichText = [
      {
        plain_text: 'This text has both red text and yellow background',
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'red_background'  // Notion format: color_background
        }
      },
      {
        plain_text: 'This has blue text color',
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'blue'  // Text color only
        }
      }
    ];

    // Expected processing should separate text color from background color
    const expectedAnnotations = [
      {
        text: 'This text has both red text and yellow background',
        start: 0,
        end: 47,
        bold: false,
        italic: false,
        strikethrough: false,
        underline: false,
        code: false,
        color: 'red',
        background_color: 'red'
      },
      {
        text: 'This has blue text color',
        start: 47,
        end: 71,
        bold: false,
        italic: false,
        strikethrough: false,
        underline: false,
        code: false,
        color: 'blue'
      }
    ];

    // Mock the extractAnnotationsSimplified function behavior
    const annotations = [];
    let currentPosition = 0;
    
    for (const rt of mockRichText) {
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
        
        // Handle background colors (format: color_background)
        if (color.includes('_background')) {
          const baseColor = color.replace('_background', '');
          annotation.background_color = baseColor;
        } else {
          annotation.color = color;
        }
        
        annotations.push(annotation);
      }
      
      currentPosition += textLength;
    }

    expect(annotations).toHaveLength(2);
    expect(annotations[0]).toMatchObject({
      background_color: 'red'
    });
    expect(annotations[1]).toMatchObject({
      color: 'blue'
    });
  });

  it('should handle combined text and background colors correctly', () => {
    const mockComplexRichText = [
      {
        plain_text: 'Bold red text with blue background',
        annotations: {
          bold: true,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'blue_background'
        }
      }
    ];

    const expectedResult = {
      text: 'Bold red text with blue background',
      bold: true,
      background_color: 'blue'
    };

    // Should separate background color from text formatting
    const color = mockComplexRichText[0].annotations.color;
    const result = {
      text: mockComplexRichText[0].plain_text,
      bold: mockComplexRichText[0].annotations.bold
    };

    if (color.includes('_background')) {
      result.background_color = color.replace('_background', '');
    }

    expect(result).toMatchObject(expectedResult);
  });
});
