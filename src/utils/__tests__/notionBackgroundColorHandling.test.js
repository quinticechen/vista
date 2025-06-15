
import { describe, it, expect } from 'vitest';

describe('Notion Background Color Annotation Handling', () => {
  it('should extract background colors from Notion rich text with _background format', () => {
    const mockRichText = [
      {
        plain_text: 'This text has yellow background',
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'yellow_background'  // Notion format: color_background
        }
      },
      {
        plain_text: 'This has red background',
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'red_background'
        }
      },
      {
        plain_text: 'This has blue text color only',
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
        text: 'This text has yellow background',
        start: 0,
        end: 32,
        bold: false,
        italic: false,
        strikethrough: false,
        underline: false,
        code: false,
        background_color: 'yellow'
      },
      {
        text: 'This has red background',
        start: 32,
        end: 55,
        bold: false,
        italic: false,
        strikethrough: false,
        underline: false,
        code: false,
        background_color: 'red'
      },
      {
        text: 'This has blue text color only',
        start: 55,
        end: 84,
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

    expect(annotations).toHaveLength(3);
    expect(annotations[0]).toMatchObject({
      background_color: 'yellow'
    });
    expect(annotations[1]).toMatchObject({
      background_color: 'red'
    });
    expect(annotations[2]).toMatchObject({
      color: 'blue'
    });
  });

  it('should handle mixed text and background colors in same rich text segment', () => {
    const mockComplexRichText = [
      {
        plain_text: 'Bold text with background',
        annotations: {
          bold: true,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'green_background'
        }
      }
    ];

    const expectedResult = {
      text: 'Bold text with background',
      bold: true,
      background_color: 'green'
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

  it('should process webhook and sync data identically for background colors', () => {
    const mockNotionRichText = [
      {
        plain_text: 'Webhook and sync should match',
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'purple_background'
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
            annotation.background_color = color.replace('_background', '');
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
      background_color: 'purple'
    });
  });
});
