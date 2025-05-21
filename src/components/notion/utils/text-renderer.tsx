
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
          {segment}
          {index < array.length - 1 && <br />}
        </React.Fragment>
      );
    });
    return segments;
  }
  
  if (!annotations || annotations.length === 0) {
    return text;
  }

  // If we have the text and annotations are in the new format with start/end positions
  if (annotations.some(a => a.start !== undefined && a.end !== undefined)) {
    // Create spans for each annotation with proper styling
    let segments: React.ReactNode[] = [];
    
    // Sort annotations by start position to ensure proper order
    const sortedAnnotations = [...annotations].sort((a, b) => (a.start || 0) - (b.start || 0));
    
    // Create a segment for each part of the text that has annotations
    let lastEnd = 0;
    
    for (const annotation of sortedAnnotations) {
      const start = annotation.start || 0;
      const end = annotation.end || 0;
      
      // Add any text before this annotation
      if (start > lastEnd) {
        segments.push(text.substring(lastEnd, start));
      }
      
      // Skip if invalid positions
      if (end <= start) continue;
      
      // Extract the text for this annotation
      const annotatedText = text.substring(start, end);
      
      // Determine styling classes
      const isBackgroundColor = annotation.color && annotation.color.includes("_background");
      const colorName = annotation.color ? annotation.color.replace('_background', '') : '';
      const textColorClass = !isBackgroundColor && annotation.color ? `text-${colorName}-500` : '';
      const bgColorClass = isBackgroundColor ? `bg-${colorName}-100` : '';
      
      const styles = cn(
        annotation.bold && "font-bold",
        annotation.italic && "italic",
        annotation.underline && "underline",
        annotation.strikethrough && "line-through",
        annotation.code && "font-mono bg-muted rounded px-1 py-0.5",
        textColorClass,
        bgColorClass
      );
      
      // Create the styled span
      const styledSpan = (
        <span key={`annotation-${start}-${end}`} className={styles}>
          {annotatedText}
        </span>
      );
      
      // Add the span directly or wrap in a link if needed
      if (annotation.href) {
        segments.push(
          <a 
            key={`link-${start}-${end}`} 
            href={annotation.href}
            className="text-blue-500 hover:underline" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            {styledSpan}
          </a>
        );
      } else {
        segments.push(styledSpan);
      }
      
      lastEnd = end;
    }
    
    // Add any remaining text
    if (lastEnd < text.length) {
      segments.push(text.substring(lastEnd));
    }
    
    return segments.length > 0 ? segments : text;
  }
  
  // For backward compatibility with old annotation format
  return annotations.map((annotation, index) => {
    const { bold, italic, underline, strikethrough, code, color, text: annotationText, href } = annotation;
    
    // Use annotationText if available, otherwise this is the wrong format
    if (!annotationText) return null;
    
    // Handle background colors
    const isBackgroundColor = color && color.includes("_background");
    const colorName = color ? color.replace('_background', '') : '';
    const bgColorClass = isBackgroundColor ? `bg-${colorName}-100` : "";
    
    const styles = cn(
      bold && "font-bold",
      italic && "italic",
      underline && "underline",
      strikethrough && "line-through",
      code && "font-mono bg-muted rounded px-1 py-0.5",
      color && !isBackgroundColor && color !== "default" && `text-${colorName}-500`,
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

// Helper function to render text with line breaks
export const renderTextWithLineBreaks = (block: any) => {
  return block.annotations && block.text ? 
    renderAnnotatedText(block.text, block.annotations) : 
    renderAnnotatedText(block.text || "");
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
