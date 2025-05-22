import React from "react";
import { cn } from "@/lib/utils";
import { NotionAnnotation } from "../types";

// Render annotated text with formatting
export const renderAnnotatedText = (text: string, annotations?: NotionAnnotation[]) => {
  if (!text) return null;
  
  // Handle line breaks in text
  if (text.includes('\n')) {
    const segments = text.split('\n').map((segment, index, array) => {
      return (
        <React.Fragment key={`segment-${index}`}>
          {renderAnnotatedTextSegment(segment, annotations)}
          {index < array.length - 1 && <br />}
        </React.Fragment>
      );
    });
    return segments;
  }
  
  return renderAnnotatedTextSegment(text, annotations);
};

// Helper function to render a single text segment with annotations
const renderAnnotatedTextSegment = (text: string, annotations?: NotionAnnotation[]) => {
  if (!annotations || annotations.length === 0) {
    return text;
  }

  // If we have position-based annotations (start/end)
  if (annotations.some(a => a.start !== undefined && a.end !== undefined)) {
    const textLength = text.length;
    const segments: React.ReactNode[] = [];
    
    // Sort annotations by start position
    const positionAnnotations = annotations
      .filter(a => a.start !== undefined && a.end !== undefined)
      .sort((a, b) => (a.start || 0) - (b.start || 0));
    
    // If there are no position-based annotations with valid ranges, just return the text
    if (positionAnnotations.length === 0) {
      return text;
    }
    
    // Process non-overlapping segments
    let lastEnd = 0;
    
    // Add text before first annotation if needed
    if (positionAnnotations[0].start && positionAnnotations[0].start > 0) {
      segments.push(text.substring(0, positionAnnotations[0].start));
      lastEnd = positionAnnotations[0].start;
    }

    // Process each annotation
    for (let i = 0; i < positionAnnotations.length; i++) {
      const annotation = positionAnnotations[i];
      const start = annotation.start || 0;
      const end = annotation.end || 0;

      // Skip if invalid positions
      if (end <= start || start >= textLength) continue;
      
      // If there's a gap between the last segment and this one, add the plain text
      if (start > lastEnd) {
        segments.push(text.substring(lastEnd, start));
      }
      
      // Create styled segment for this annotation
      const segmentText = text.substring(start, Math.min(end, textLength));
      segments.push(createStyledSegment(segmentText, annotation));
      
      lastEnd = Math.min(end, textLength);
    }
    
    // Add any remaining text after the last annotation
    if (lastEnd < textLength) {
      segments.push(text.substring(lastEnd));
    }

    return segments.length > 0 ? <>{segments}</> : text;
  }
  
  // Legacy format - whole text has the same annotations
  return annotations.map((annotation, index) => {
    const { bold, italic, underline, strikethrough, code, color, text: annotationText, href } = annotation;
    
    // Use annotationText if available, otherwise this is the wrong format
    if (!annotationText) return null;
    
    // Handle styling classes properly
    const colorClass = getColorClass(color);
    const bgColorClass = getBackgroundColorClass(color);

    const styles = cn(
      bold && "font-bold",
      italic && "italic",
      underline && "underline",
      strikethrough && "line-through",
      code && "font-mono bg-muted rounded px-1 py-0.5",
      colorClass,
      bgColorClass
    );

    const content = (
      <span key={index} className={styles}>
        {annotationText}
      </span>
    );

    return href ? (
      <a key={index} href={href} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    ) : (
      content
    );
  });
};

// Helper function to create a styled segment based on a single annotation
const createStyledSegment = (text: string, annotation: NotionAnnotation): React.ReactNode => {
  const { bold, italic, underline, strikethrough, code, color, href } = annotation;
  
  const colorClass = getColorClass(color);
  const bgColorClass = getBackgroundColorClass(color);

  const styles = cn(
    bold && "font-bold",
    italic && "italic",
    underline && "underline",
    strikethrough && "line-through",
    code && "font-mono bg-muted rounded px-1 py-0.5",
    colorClass,
    bgColorClass
  );

  const content = (
    <span className={styles} key={`segment-${text}-${Date.now()}`}>
      {text}
    </span>
  );

  return href ? (
    <a href={href} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer" key={`link-${text}-${href}-${Date.now()}`}>
      {content}
    </a>
  ) : content;
};

// Helper function to get the correct text color class based on the color string
const getColorClass = (color?: string): string => {
  if (!color || color === "default" || color.includes("_background")) return '';
  
  switch (color) {
    case "red": return "text-red-500";
    case "blue": return "text-blue-500";
    case "green": return "text-green-500";
    case "yellow": return "text-yellow-500";
    case "orange": return "text-orange-500";
    case "purple": return "text-purple-500";
    case "pink": return "text-pink-500";
    case "gray": return "text-gray-500";
    case "brown": return "text-amber-500";
    default: return "";
  }
};

// Helper function to get the correct background color class based on the color string
const getBackgroundColorClass = (color?: string): string => {
  if (!color || !color.includes("_background")) return '';
  
  const colorName = color.replace('_background', '');
  switch (colorName) {
    case "red": return "bg-red-100";
    case "blue": return "bg-blue-100";
    case "green": return "bg-green-100";
    case "yellow": return "bg-yellow-100";
    case "orange": return "bg-orange-100";
    case "purple": return "bg-purple-100";
    case "pink": return "bg-pink-100";
    case "gray": return "bg-gray-100";
    case "brown": return "bg-amber-100";
    default: return "bg-gray-100";
  }
};

// Helper function to safely render an icon
export const renderIcon = (icon: any) => {
  if (!icon) return null;
  
  if (typeof icon === 'string') {
    return icon;
  }
  
  if (icon.emoji) {
    return icon.emoji;
  }
  
  if (icon.type === 'emoji' && icon.emoji) {
    return icon.emoji;
  }
  
  // For other icon types, return a generic representation
  return null;
};

// Helper function to render text with line breaks
export const renderTextWithLineBreaks = (block: any) => {
  return block.annotations && block.text ? 
    renderAnnotatedText(block.text, block.annotations) : 
    renderAnnotatedText(block.text || "");
};
