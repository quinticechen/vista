
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
    return applyPositionalAnnotations(text, annotations);
  }
  
  // Legacy format - whole text has specific annotations
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

// New function to apply positional annotations correctly
const applyPositionalAnnotations = (text: string, annotations: NotionAnnotation[]): React.ReactNode[] => {
  // Filter for valid positional annotations
  const validAnnotations = annotations.filter(
    a => typeof a.start === 'number' && 
         typeof a.end === 'number' && 
         a.start >= 0 && 
         a.end <= text.length && 
         a.start < a.end
  );
  
  if (validAnnotations.length === 0) return [text];
  
  // Create a map of character positions to track where annotations start and end
  const positions: {[position: number]: {starts: NotionAnnotation[], ends: NotionAnnotation[]}} = {};
  
  // Initialize the positions map
  for (let i = 0; i <= text.length; i++) {
    positions[i] = { starts: [], ends: [] };
  }
  
  // Register all annotation start and end positions
  validAnnotations.forEach(annotation => {
    if (annotation.start !== undefined && annotation.end !== undefined) {
      positions[annotation.start].starts.push(annotation);
      positions[annotation.end].ends.push(annotation);
    }
  });
  
  // Process the text character by character
  const result: React.ReactNode[] = [];
  let activeAnnotations: NotionAnnotation[] = [];
  let currentSegment = '';
  let lastPos = 0;
  
  // Process each position in the text
  for (let i = 0; i <= text.length; i++) {
    // Process annotation endings first (to ensure correct nesting)
    if (positions[i].ends.length > 0) {
      // Add the current segment with current active annotations
      if (currentSegment) {
        result.push(createStyledSegment(currentSegment, activeAnnotations));
        currentSegment = '';
      }
      
      // Remove ended annotations from active set
      positions[i].ends.forEach(endedAnno => {
        activeAnnotations = activeAnnotations.filter(a => a !== endedAnno);
      });
    }
    
    // Process annotation starts
    if (positions[i].starts.length > 0) {
      // Add any text segment before this with previous active annotations
      if (currentSegment) {
        result.push(createStyledSegment(currentSegment, activeAnnotations));
        currentSegment = '';
      }
      
      // Add new annotations to active set
      activeAnnotations = [...activeAnnotations, ...positions[i].starts];
    }
    
    // Add the current character to the current segment (if not at the end)
    if (i < text.length) {
      currentSegment += text[i];
    }
    
    lastPos = i;
  }
  
  // Add any remaining text
  if (currentSegment) {
    result.push(createStyledSegment(currentSegment, activeAnnotations));
  }
  
  return result;
};

// Helper function to create a styled segment based on multiple annotations
const createStyledSegment = (text: string, annotations: NotionAnnotation[]): React.ReactNode => {
  if (!annotations.length) return text;
  
  // Merge annotation styles
  let isBold = false;
  let isItalic = false;
  let isUnderline = false;
  let isStrikethrough = false;
  let isCode = false;
  let hasHref = false;
  let href = '';
  let color: string | undefined;
  
  annotations.forEach(anno => {
    if (anno.bold) isBold = true;
    if (anno.italic) isItalic = true;
    if (anno.underline) isUnderline = true;
    if (anno.strikethrough) isStrikethrough = true;
    if (anno.code) isCode = true;
    if (anno.color) color = anno.color;
    if (anno.href) {
      hasHref = true;
      href = anno.href;
    }
  });

  const colorClass = getColorClass(color);
  const bgColorClass = getBackgroundColorClass(color);
  
  const styles = cn(
    isBold && "font-bold",
    isItalic && "italic",
    isUnderline && "underline",
    isStrikethrough && "line-through",
    isCode && "font-mono bg-muted rounded px-1 py-0.5",
    colorClass,
    bgColorClass
  );
  
  const content = (
    <span className={styles} key={`segment-${text}-${Date.now()}`}>
      {text}
    </span>
  );
  
  return hasHref ? (
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
