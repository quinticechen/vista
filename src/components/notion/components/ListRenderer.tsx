
import React from "react";
import { NotionBlock } from "../types";

interface ListRendererProps {
  listType: string | null;
  items: React.ReactNode[];
  depth?: number;
  listPath?: string;
}

export const ListRenderer: React.FC<ListRendererProps> = ({ 
  listType, 
  items, 
  depth = 0, 
  listPath = 'root'
}) => {
  if (!listType || items.length === 0) return null;
  
  // Set consistent spacing and indentation based on depth
  const className = "my-4 space-y-3";
  
  // Apply proper indentation based on depth - each level gets one full-width space
  const indentClass = depth > 0 ? `ml-8` : '';
  
  if (listType === "numbered_list") {
    return (
      <ol 
        key={`numbered-list-${listPath}`} 
        className={`list-decimal ${indentClass} pl-6 ${className}`}
        style={{ lineHeight: '1.6' }}
      >
        {items}
      </ol>
    );
  } else if (listType === "bulleted_list") {
    return (
      <ul 
        key={`bulleted-list-${listPath}`} 
        className={`list-disc ${indentClass} pl-6 ${className}`}
        style={{ lineHeight: '1.6' }}
      >
        {items}
      </ul>
    );
  }
  
  return null;
};

// Helper function for managing numbered list counters
export const createListCounters = () => {
  const counters = new Map<string, number>();
  
  const getNextCount = (listId: string) => {
    const current = counters.get(listId) || 0;
    const next = current + 1;
    counters.set(listId, next);
    return next;
  };
  
  const resetCounter = (listId: string) => {
    counters.set(listId, 0);
  };
  
  return { getNextCount, resetCounter };
};

// Helper function to fix the numbered list auto-increment issues
export const fixNumberedLists = (content: NotionBlock[]): NotionBlock[] => {
  // Deep clone the content to avoid mutating the original
  const fixedContent = JSON.parse(JSON.stringify(content));
  
  // Process blocks recursively to handle nested lists
  const processBlocks = (blocks: NotionBlock[], path: string = 'root') => {
    let currentListType: string | null = null;
    let currentCount = 0;
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      // Process this block if it's a list item
      if (block.type === "numbered_list_item" || 
          (block.is_list_item && block.list_type === "numbered_list")) {
        
        // Start or continue a numbered list
        if (currentListType !== "numbered_list") {
          currentListType = "numbered_list";
          currentCount = 0;
        }
        
        // Increment the counter and assign it
        currentCount++;
        (block as NotionBlock & { _counter: number })._counter = currentCount;
      } else if (block.type === "bulleted_list_item" || 
               (block.is_list_item && block.list_type === "bulleted_list")) {
        // Encountered a different list type
        currentListType = "bulleted_list";
      } else {
        // Not a list item, reset tracking
        currentListType = null;
      }
      
      // Process children recursively
      if (block.children && block.children.length > 0) {
        processBlocks(block.children, `${path}-${i}`);
      }
    }
  };
  
  // Start processing from top-level blocks
  processBlocks(fixedContent);
  
  return fixedContent;
};
