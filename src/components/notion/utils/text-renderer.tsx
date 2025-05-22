
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

  // Filter valid annotations
  const validAnnotations = annotations.filter(annotation => {
    // Check if this annotation has valid positional data
    const hasValidPositions = 
      typeof annotation.start === 'number' && 
      typeof annotation.end === 'number' &&
      annotation.start >= 0 && 
      annotation.end <= text.length && 
      annotation.start < annotation.end;
      
    // Check if this is a legacy annotation with text property
    const isLegacyValid = annotation.text && typeof annotation.text === 'string';
    
    return hasValidPositions || isLegacyValid;
  });

  if (validAnnotations.length === 0) return text;

  // Create a mapping of positions to style changes
  const positions: { [position: number]: React.ReactNode[] } = {};
  
  // Initialize all positions
  for (let i = 0; i <= text.length; i++) {
    positions[i] = [];
  }
  
  // Process annotations
  validAnnotations.forEach((annotation, annotationIndex) => {
    // Determine annotation boundaries
    let start = 0;
    let end = text.length;
    
    // Use positional data if available
    if (typeof annotation.start === 'number' && typeof annotation.end === 'number') {
      start = Math.max(0, Math.min(text.length, annotation.start));
      end = Math.max(start, Math.min(text.length, annotation.end));
    } 
    // Use text search as fallback
    else if (annotation.text) {
      const annotationText = annotation.text;
      const textIndex = text.indexOf(annotationText);
      if (textIndex >= 0) {
        start = textIndex;
        end = textIndex + annotationText.length;
      }
    }

    // Create styled segment for this annotation
    const segment = text.substring(start, end);
    if (segment) {
      const styledSegment = createStyledNode(segment, annotation, annotationIndex);
      // Add this segment to the position map
      positions[start].push(styledSegment);
    }
  });

  // Build final result by traversing the positions
  const result: React.ReactNode[] = [];
  let currentPosition = 0;
  let plainTextBuffer = '';

  while (currentPosition <= text.length) {
    if (positions[currentPosition].length > 0) {
      // If we have a styled segment at this position
      
      // First flush any plain text buffer
      if (plainTextBuffer) {
        result.push(plainTextBuffer);
        plainTextBuffer = '';
      }
      
      // Add all styled segments at this position
      positions[currentPosition].forEach(styledSegment => {
        result.push(styledSegment);
      });
      
      // Move position past this segment
      // We need to find the next position after all segments
      const nextPositions = Object.keys(positions)
        .map(Number)
        .filter(pos => pos > currentPosition)
        .sort((a, b) => a - b);
      
      if (nextPositions.length > 0) {
        currentPosition = nextPositions[0];
      } else {
        // No more positions, exit loop
        break;
      }
    } else {
      // No styled segments at this position, add to plain text buffer
      if (currentPosition < text.length) {
        plainTextBuffer += text[currentPosition];
      }
      currentPosition++;
    }
  }
  
  // Add any remaining plain text
  if (plainTextBuffer) {
    result.push(plainTextBuffer);
  }
  
  return result;
};

// Create a styled React node for a text segment based on its annotation
const createStyledNode = (text: string, annotation: NotionAnnotation, index: number): React.ReactNode => {
  const { bold, italic, underline, strikethrough, code, color, href } = annotation;
  const uniqueKey = `styled-${text}-${index}-${Date.now()}`;
  
  // Get style classes
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
    <span key={uniqueKey} className={styles}>
      {text}
    </span>
  );
  
  // If this is a link, wrap in an anchor tag
  if (href) {
    // Clean the href if needed (remove angle brackets)
    const cleanHref = href.replace(/^<|>$/g, '');
    return (
      <a 
        key={`link-${uniqueKey}`} 
        href={cleanHref} 
        className="text-blue-500 hover:underline" 
        target="_blank" 
        rel="noopener noreferrer"
      >
        {content}
      </a>
    );
  }
  
  return content;
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
