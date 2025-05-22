
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
    const textLength = text.length;
    // Create a map of character positions to their annotations
    const annotationMap = new Map<number, Set<NotionAnnotation>>();
    
    // Sort annotations by start position to ensure proper order
    const sortedAnnotations = [...annotations].sort((a, b) => (a.start || 0) - (b.start || 0));
    
    // Pre-process: prepare the annotation map for each character position
    for (let i = 0; i < textLength; i++) {
      annotationMap.set(i, new Set());
    }
    
    // For each annotation, mark all the characters it covers
    for (const annotation of sortedAnnotations) {
      const start = annotation.start || 0;
      const end = annotation.end || 0;
      
      // Skip if invalid positions or out of bounds
      if (end <= start || start >= textLength) continue;
      
      // Add this annotation to each covered character position
      for (let i = start; i < Math.min(end, textLength); i++) {
        const charAnnotations = annotationMap.get(i);
        if (charAnnotations) {
          charAnnotations.add(annotation);
        }
      }
    }
    
    // Process the text with annotations
    let segments: React.ReactNode[] = [];
    let currentSegment = "";
    let currentAnnotations: NotionAnnotation[] = [];
    
    // Process each character with its annotations
    for (let i = 0; i < textLength; i++) {
      const char = text[i];
      const charAnnotations = Array.from(annotationMap.get(i) || []);
      
      // Check if annotations changed
      const annotationsChanged = !areAnnotationSetsEqual(charAnnotations, currentAnnotations);
      
      if (annotationsChanged && currentSegment) {
        // Add the previous segment with its annotations
        segments.push(createAnnotatedSegment(currentSegment, currentAnnotations));
        currentSegment = "";
      }
      
      if (annotationsChanged) {
        // Update current annotations
        currentAnnotations = charAnnotations;
      }
      
      // Add character to current segment
      currentSegment += char;
    }
    
    // Add the final segment
    if (currentSegment) {
      segments.push(createAnnotatedSegment(currentSegment, currentAnnotations));
    }
    
    return segments.length > 0 ? segments : text;
  }
  
  // For backward compatibility with old annotation format
  return annotations.map((annotation, index) => {
    const { bold, italic, underline, strikethrough, code, color, text: annotationText, href } = annotation;
    
    // Use annotationText if available, otherwise this is the wrong format
    if (!annotationText) return null;
    
    // Handle styling classes properly
    let colorClass = '';
    let bgColorClass = '';
    
    if (color) {
      // Handle background colors correctly
      if (color.includes("_background")) {
        const colorName = color.replace('_background', '');
        switch (colorName) {
          case "red": bgColorClass = "bg-red-100"; break;
          case "blue": bgColorClass = "bg-blue-100"; break;
          case "green": bgColorClass = "bg-green-100"; break;
          case "yellow": bgColorClass = "bg-yellow-100"; break;
          case "orange": bgColorClass = "bg-orange-100"; break;
          case "purple": bgColorClass = "bg-purple-100"; break;
          case "pink": bgColorClass = "bg-pink-100"; break;
          case "gray": bgColorClass = "bg-gray-100"; break;
          case "brown": bgColorClass = "bg-amber-100"; break;
          default: bgColorClass = "bg-gray-100";
        }
      } else if (color !== "default") {
        // Handle text colors correctly
        switch (color) {
          case "red": colorClass = "text-red-500"; break;
          case "blue": colorClass = "text-blue-500"; break;
          case "green": colorClass = "text-green-500"; break;
          case "yellow": colorClass = "text-yellow-500"; break;
          case "orange": colorClass = "text-orange-500"; break;
          case "purple": colorClass = "text-purple-500"; break;
          case "pink": colorClass = "text-pink-500"; break;
          case "gray": colorClass = "text-gray-500"; break;
          case "brown": colorClass = "text-amber-500"; break;
          default: colorClass = "";
        }
      }
    }
    
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

// Helper function to check if two sets of annotations are functionally equivalent
const areAnnotationSetsEqual = (set1: NotionAnnotation[], set2: NotionAnnotation[]): boolean => {
  if (set1.length !== set2.length) return false;
  
  const compareAnnotationProperties = (a: NotionAnnotation, b: NotionAnnotation): boolean => {
    return (
      a.bold === b.bold &&
      a.italic === b.italic &&
      a.underline === b.underline &&
      a.strikethrough === b.strikethrough &&
      a.code === b.code &&
      a.color === b.color &&
      a.href === b.href
    );
  };
  
  // Check if every annotation in set1 has a matching one in set2
  return set1.every(a1 => set2.some(a2 => compareAnnotationProperties(a1, a2)));
};

// Helper function to create a styled span based on annotations
const createAnnotatedSegment = (text: string, annotations: NotionAnnotation[]): React.ReactNode => {
  if (annotations.length === 0) return text;
  
  // Combine all styling properties
  const bold = annotations.some(a => a.bold);
  const italic = annotations.some(a => a.italic);
  const underline = annotations.some(a => a.underline);
  const strikethrough = annotations.some(a => a.strikethrough);
  const code = annotations.some(a => a.code);
  const href = annotations.find(a => a.href)?.href;
  
  // Handle colors - priority to background colors
  let colorClass = '';
  let bgColorClass = '';
  
  // Find background color if any
  const bgColorAnnotation = annotations.find(a => a.color && a.color.includes('_background'));
  if (bgColorAnnotation && bgColorAnnotation.color) {
    const colorName = bgColorAnnotation.color.replace('_background', '');
    switch (colorName) {
      case "red": bgColorClass = "bg-red-100"; break;
      case "blue": bgColorClass = "bg-blue-100"; break;
      case "green": bgColorClass = "bg-green-100"; break;
      case "yellow": bgColorClass = "bg-yellow-100"; break;
      case "orange": bgColorClass = "bg-orange-100"; break;
      case "purple": bgColorClass = "bg-purple-100"; break;
      case "pink": bgColorClass = "bg-pink-100"; break;
      case "gray": bgColorClass = "bg-gray-100"; break;
      case "brown": bgColorClass = "bg-amber-100"; break;
      default: bgColorClass = "bg-gray-100";
    }
  }
  
  // Find text color if any
  const colorAnnotation = annotations.find(a => a.color && !a.color.includes('_background'));
  if (colorAnnotation && colorAnnotation.color && colorAnnotation.color !== "default") {
    switch (colorAnnotation.color) {
      case "red": colorClass = "text-red-500"; break;
      case "blue": colorClass = "text-blue-500"; break;
      case "green": colorClass = "text-green-500"; break;
      case "yellow": colorClass = "text-yellow-500"; break;
      case "orange": colorClass = "text-orange-500"; break;
      case "purple": colorClass = "text-purple-500"; break;
      case "pink": colorClass = "text-pink-500"; break;
      case "gray": colorClass = "text-gray-500"; break;
      case "brown": colorClass = "text-amber-500"; break;
      default: colorClass = "";
    }
  }

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
    <span className={styles} key={`segment-${text}`}>
      {text}
    </span>
  );

  return href ? (
    <a href={href} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer" key={`link-${text}-${href}`}>
      {content}
    </a>
  ) : content;
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
