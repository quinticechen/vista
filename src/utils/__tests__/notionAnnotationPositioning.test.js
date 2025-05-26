
import { describe, it, expect } from 'vitest';

// Mock function to simulate extractAnnotationsSimplified
const mockExtractAnnotationsSimplified = (richText) => {
  if (!richText || richText.length === 0) return [];
  
  const annotations = [];
  let currentPosition = 0;
  
  // Process each rich text segment
  for (const rt of richText) {
    if (!rt || !rt.annotations) {
      currentPosition += rt.plain_text.length;
      continue;
    }
    
    const {
      bold, italic, strikethrough, underline, code, color
    } = rt.annotations;
    
    // Only create an annotation if there's formatting applied
    if (bold || italic || strikethrough || underline || code || (color && color !== 'default') || rt.href) {
      annotations.push({
        text: rt.plain_text,
        start: currentPosition,
        end: currentPosition + rt.plain_text.length,
        bold,
        italic,
        strikethrough,
        underline,
        code,
        color: color !== 'default' ? color : undefined,
        href: rt.href || undefined
      });
    }
    
    currentPosition += rt.plain_text.length;
  }
  
  return annotations;
};

describe('Notion Annotation Positioning', () => {
  it('should correctly calculate annotation positions for single formatted text', () => {
    const richText = [
      {
        plain_text: 'red',
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

    const annotations = mockExtractAnnotationsSimplified(richText);
    
    expect(annotations).toEqual([
      {
        text: 'red',
        start: 0,
        end: 3,
        bold: false,
        italic: false,
        strikethrough: false,
        underline: false,
        code: false,
        color: 'red'
      }
    ]);
  });

  it('should correctly calculate annotation positions for mixed formatted text', () => {
    const richText = [
      {
        plain_text: 'Text Colors: Can be applied to blocks or text using highlight (',
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
        plain_text: 'red',
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
        plain_text: ', blue, green, etc.) ❤️',
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default'
        }
      }
    ];

    const annotations = mockExtractAnnotationsSimplified(richText);
    
    expect(annotations).toEqual([
      {
        text: 'red',
        start: 63, // Position after "Text Colors: Can be applied to blocks or text using highlight ("
        end: 66,   // 63 + 3
        bold: false,
        italic: false,
        strikethrough: false,
        underline: false,
        code: false,
        color: 'red'
      }
    ]);
  });

  it('should handle multiple annotations with correct positions', () => {
    const richText = [
      {
        plain_text: 'This is ',
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
        plain_text: 'bold',
        annotations: {
          bold: true,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default'
        }
      },
      {
        plain_text: ' and this is ',
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
        plain_text: 'italic',
        annotations: {
          bold: false,
          italic: true,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default'
        }
      }
    ];

    const annotations = mockExtractAnnotationsSimplified(richText);
    
    expect(annotations).toHaveLength(2);
    expect(annotations[0]).toMatchObject({
      text: 'bold',
      start: 8,  // After "This is "
      end: 12,   // 8 + 4
      bold: true
    });
    expect(annotations[1]).toMatchObject({
      text: 'italic',
      start: 25, // After "This is bold and this is "
      end: 31,   // 25 + 6
      italic: true
    });
  });

  it('should extract full text correctly from rich text array', () => {
    const richText = [
      { plain_text: 'Text Colors: Can be applied to blocks or text using highlight (' },
      { plain_text: 'red' },
      { plain_text: ', blue, green, etc.) ❤️' }
    ];

    const fullText = richText.map(rt => rt.plain_text).join('');
    expect(fullText).toBe('Text Colors: Can be applied to blocks or text using highlight (red, blue, green, etc.) ❤️');
  });
});
