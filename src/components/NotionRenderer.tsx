
import React from "react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";
import { NotionBlock, NotionRendererProps } from "./notion/types";
import { renderTextWithLineBreaks } from "./notion/utils/text-renderer";
import { ListRenderer, createListCounters, fixNumberedLists } from "./notion/components/ListRenderer";
import {
  HeadingRenderer,
  ParagraphRenderer,
  QuoteRenderer,
  TodoRenderer,
  CalloutRenderer,
  CodeRenderer,
  ToggleRenderer,
  TableRenderer,
  ColumnListRenderer,
  ColumnRenderer,
  EquationRenderer,
  MediaBlockRenderer,
  DefaultBlockRenderer,
  DividerRenderer
} from "./notion/components/BlockRenderers";

// Create a Map to track rendered blocks by ID to prevent duplicate rendering
const renderedBlocks = new Map<string, boolean>();

const NotionRenderer: React.FC<NotionRendererProps> = ({ blocks, className }) => {
  if (!blocks || !Array.isArray(blocks)) {
    return <div className="text-muted-foreground">No content available</div>;
  }

  // Reset the rendered blocks tracking on each new render
  renderedBlocks.clear();

  // Initialize list counters
  const listCounters = createListCounters();

  // Generate a unique ID for blocks that don't have one
  const getBlockId = (block: NotionBlock, index: number, path: string): string => {
    return block.id || `${path}-${index}-${block.type}-${Date.now()}`;
  };

  // Improved function to render nested content recursively
  const renderNestedContent = (block: NotionBlock, index: number, depth: number = 0, listPath: string = 'root'): React.ReactNode => {
    // Generate a unique ID for the block
    const blockId = getBlockId(block, index, listPath);
    
    // Check if we've already rendered this block
    if (renderedBlocks.has(blockId)) {
      console.log(`Preventing duplicate render of block: ${blockId}`, block);
      return null;
    }
    
    // Mark this block as rendered
    renderedBlocks.set(blockId, true);
    
    const { children } = block;
    
    // Special case for paragraphs that are direct children of list items
    if (block.type === "paragraph" && block.text && depth > 0) {
      return <ParagraphRenderer block={block} index={index} depth={depth} listPath={listPath} renderNested={renderNestedContent} />;
    }
    
    // First render the current block
    const blockContent = renderBlockContent(block, index, depth, listPath);
    
    // If there are no children, just return the block content
    if (!children || children.length === 0) {
      // For list items without children, we need to wrap them in the appropriate list tag
      if (block.is_list_item || block.type === "bulleted_list_item" || block.type === "numbered_list_item") {
        return (
          <li key={`${listPath}-item-${index}`} className="my-2" style={{ lineHeight: '1.6' }}>
            {renderTextWithLineBreaks(block)}
          </li>
        );
      }
      
      return blockContent;
    }
    
    // Process children based on their types
    const childrenElements: React.ReactNode[] = [];
    let currentChildListType: string | null = null;
    let childListItems: React.ReactNode[] = [];
    const childListPath = `${listPath}-${index}`;
    
    // Group the children by their list types
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      
      // Skip duplicated blocks
      const childId = getBlockId(child, i, childListPath);
      if (renderedBlocks.has(childId)) {
        console.log(`Skipping duplicate child block: ${childId}`);
        continue;
      }
      
      // Check if this is a list item
      if (child.is_list_item || child.type === "bulleted_list_item" || child.type === "numbered_list_item") {
        const listType = child.list_type || (child.type === "bulleted_list_item" ? "bulleted_list" : "numbered_list");
        
        // If starting a new list or changing list type
        if (currentChildListType !== listType) {
          // Render any existing list before starting a new one
          if (childListItems.length > 0) {
            childrenElements.push(
              <ListRenderer 
                key={`list-${childListPath}-${i}`}
                listType={currentChildListType} 
                items={childListItems} 
                depth={depth + 1} 
                listPath={childListPath} 
              />
            );
            childListItems = [];
          }
          
          currentChildListType = listType;
          // Reset counter for new numbered list
          if (listType === "numbered_list") {
            listCounters.resetCounter(childListPath);
          }
        }
        
        // Add the item to the current list
        const counter = listType === "numbered_list" ? listCounters.getNextCount(childListPath) : undefined;
        
        // Set the counter for use in rendering
        if (listType === "numbered_list" && child) {
          (child as NotionBlock & { _counter: number })._counter = counter || 0;
        }
        
        // Recursively render nested content
        childListItems.push(renderNestedContent(child, i, depth + 1, `${childListPath}-${i}`));
      } else {
        // If we hit a non-list item and have existing list items, render the list first
        if (childListItems.length > 0) {
          childrenElements.push(
            <ListRenderer 
              key={`list-final-${childListPath}-${i}`}
              listType={currentChildListType} 
              items={childListItems} 
              depth={depth + 1} 
              listPath={childListPath} 
            />
          );
          childListItems = [];
          currentChildListType = null;
        }
        
        // Render the non-list child
        childrenElements.push(renderNestedContent(child, i, depth + 1, `${childListPath}-${i}`));
      }
    }
    
    // Render any remaining list items
    if (childListItems.length > 0) {
      childrenElements.push(
        <ListRenderer 
          key={`list-remaining-${childListPath}`}
          listType={currentChildListType} 
          items={childListItems} 
          depth={depth + 1} 
          listPath={childListPath} 
        />
      );
    }
    
    // For list items, we want to include children within the li, otherwise we render as siblings
    if (block.is_list_item || block.type === "bulleted_list_item" || block.type === "numbered_list_item") {
      return (
        <li key={`${listPath}-list-${index}`} className="my-2" style={{ lineHeight: '1.6' }}>
          {renderTextWithLineBreaks(block)}
          {childrenElements.length > 0 && (
            // Consistent indentation for nested content within a list item
            <div className="mt-2 space-y-2">
              {childrenElements}
            </div>
          )}
        </li>
      );
    } else if (block.type === "toggle") {
      // Special handling for toggle blocks - already handled in ToggleRenderer
      return <ToggleRenderer block={block} index={index} listPath={listPath} renderNested={renderNestedContent} />;
    } else if (block.type === "callout") {
      // Special handling for callout blocks - already handled in CalloutRenderer
      return <CalloutRenderer block={block} index={index} listPath={listPath} renderNested={renderNestedContent} />;
    } else if (block.type === "column_list") {
      // Special handling for column lists to prevent duplication
      return <ColumnListRenderer block={block} index={index} listPath={`${listPath}-collist-${Date.now()}`} renderNested={renderNestedContent} />;
    } else {
      return (
        <React.Fragment key={`${listPath}-frag-${index}`}>
          {blockContent}
          {childrenElements.length > 0 && (
            <div className={depth > 0 ? "mt-2 space-y-2" : "space-y-2"}>
              {childrenElements}
            </div>
          )}
        </React.Fragment>
      );
    }
  };

  // Render just the content of a single block, without handling children
  const renderBlockContent = (block: NotionBlock, index: number, depth: number = 0, listPath: string = 'root'): React.ReactNode => {
    const { type } = block;
    
    // Special handling for list items - we now handle them differently
    if (block.is_list_item || block.type === "bulleted_list_item" || block.type === "numbered_list_item") {
      // List items are now handled in renderNestedContent and renderListGroup
      return null;
    }
    
    // Special handling for callout blocks - we want to prevent duplication
    // They will be fully rendered in renderNestedContent with children
    if (block.type === "callout" && block.children && block.children.length > 0) {
      // If callout has children, return null here and let renderNestedContent handle it
      return null;
    }

    // Handle media blocks (unified media approach)
    if (["image", "video", "embed", "media"].includes(type) || block.media_type) {
      return <MediaBlockRenderer block={block} index={index} listPath={listPath} renderNested={renderNestedContent} />;
    }

    // Handle other block types
    switch (type) {
      case "heading_1":
      case "heading_2":
      case "heading_3":
        return <HeadingRenderer block={block} index={index} listPath={listPath} renderNested={renderNestedContent} />;
      case "paragraph":
        return <ParagraphRenderer block={block} index={index} depth={depth} listPath={listPath} renderNested={renderNestedContent} />;
      case "quote":
        return <QuoteRenderer block={block} index={index} listPath={listPath} renderNested={renderNestedContent} />;
      case "to_do":
        return <TodoRenderer block={block} index={index} listPath={listPath} renderNested={renderNestedContent} />;
      case "divider":
        return <DividerRenderer index={index} listPath={listPath} />;
      case "callout":
        return <CalloutRenderer block={block} index={index} listPath={listPath} renderNested={renderNestedContent} />;
      case "code":
        return <CodeRenderer block={block} index={index} listPath={listPath} renderNested={renderNestedContent} />;
      case "toggle":
        return <ToggleRenderer block={block} index={index} listPath={listPath} renderNested={renderNestedContent} />;
      case "table":
        return <TableRenderer block={block} index={index} listPath={listPath} renderNested={renderNestedContent} />;
      case "column_list":
        return <ColumnListRenderer block={block} index={index} listPath={`${listPath}-col-${Date.now()}`} renderNested={renderNestedContent} />;
      case "column":
        return <ColumnRenderer block={block} index={index} listPath={listPath} renderNested={renderNestedContent} />;
      case "equation":
        return <EquationRenderer block={block} index={index} listPath={listPath} renderNested={renderNestedContent} />;
      case "div":
        // Special container type for nesting
        return null;
      default:
        return <DefaultBlockRenderer block={block} index={index} listPath={listPath} renderNested={renderNestedContent} />;
    }
  };

  // Group consecutive list items into their own lists
  const groupListItems = (blocks: NotionBlock[]) => {
    const result: React.ReactNode[] = [];
    let currentType: string | null = null;
    let currentItems: React.ReactNode[] = [];
    let listPath = 'root-grouped';
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      // Skip already rendered blocks
      const blockId = getBlockId(block, i, listPath);
      if (renderedBlocks.has(blockId)) {
        console.log(`Skipping duplicate top-level block: ${blockId}`);
        continue;
      }
      
      // Check if this block is a list item
      if (block.is_list_item || block.type === "bulleted_list_item" || block.type === "numbered_list_item") {
        const listType = block.list_type || (block.type === "bulleted_list_item" ? "bulleted_list" : "numbered_list");
        
        // If we're starting a new list or changing list type
        if (currentType !== listType) {
          // Render the current list if it exists
          if (currentItems.length > 0) {
            result.push(
              <ListRenderer 
                key={`list-grouped-${i}`}
                listType={currentType} 
                items={currentItems} 
                listPath={`${listPath}-${i}`} 
              />
            );
            currentItems = [];
          }
          
          // Start new list
          currentType = listType;
          
          // Reset counter for numbered lists
          if (listType === "numbered_list") {
            listCounters.resetCounter(`${listPath}-${i}`);
          }
        }
        
        // Add counter for numbered list items
        if (listType === "numbered_list") {
          const counter = listCounters.getNextCount(`${listPath}-${i}`);
          (block as NotionBlock & { _counter: number })._counter = counter;
        }
        
        // Render the list item and add it to current items
        currentItems.push(renderNestedContent(block, i, 0, `${listPath}-item-${i}`));
      } else {
        // This is not a list item, so render any pending list
        if (currentItems.length > 0) {
          result.push(
            <ListRenderer 
              key={`list-end-${i}`}
              listType={currentType} 
              items={currentItems} 
              listPath={`${listPath}-${i}`} 
            />
          );
          currentItems = [];
          currentType = null;
        }
        
        // Render this non-list block
        result.push(renderNestedContent(block, i, 0, `root-block-${i}`));
      }
    }
    
    // Render any remaining list items
    if (currentItems.length > 0) {
      result.push(
        <ListRenderer 
          key={`list-final`}
          listType={currentType} 
          items={currentItems} 
          listPath={`${listPath}-final`} 
        />
      );
    }
    
    return result;
  };

  // Error handling wrapper for the entire renderer
  try {
    // Fix numbered lists and group list items
    const fixedBlocks = fixNumberedLists(blocks);
    
    // Add timestamp to force re-render and prevent caching issues
    const renderKey = `notion-content-${Date.now()}`;
    
    return (
      <div className={cn("notion-content space-y-2", className)} key={renderKey}>
        {groupListItems(fixedBlocks)}
      </div>
    );
  } catch (error) {
    console.error("Error rendering Notion content:", error);
    toast.error("There was a problem rendering the content. Please try again later.");
    return (
      <div className="p-6 border border-red-300 bg-red-50 rounded-md">
        <h3 className="text-lg font-semibold text-red-600 mb-2">Error displaying content</h3>
        <p>There was a problem rendering the Notion content.</p>
      </div>
    );
  }
};

export default NotionRenderer;
