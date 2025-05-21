
import React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { NotionBlock } from "../types";
import { renderTextWithLineBreaks, renderIcon } from "../utils/text-renderer";
import { ImageRenderer, VideoRenderer, EmbedRenderer } from "./MediaRenderer";

interface BlockRendererProps {
  block: NotionBlock;
  index: number;
  depth?: number;
  listPath?: string;
  renderNested: (block: NotionBlock, index: number, depth: number, listPath: string) => React.ReactNode;
}

// Component for headings
export const HeadingRenderer: React.FC<BlockRendererProps> = ({ block, index, listPath }) => {
  const { type, emoji } = block;
  
  switch (type) {
    case "heading_1":
      return (
        <h1 key={`h1-${listPath}-${index}`} className="text-3xl font-bold mt-8 mb-4">
          {emoji && <span className="mr-2">{renderIcon({emoji})}</span>}
          {renderTextWithLineBreaks(block)}
        </h1>
      );
    case "heading_2":
      return (
        <h2 key={`h2-${listPath}-${index}`} className="text-2xl font-bold mt-6 mb-3">
          {emoji && <span className="mr-2">{renderIcon({emoji})}</span>}
          {renderTextWithLineBreaks(block)}
        </h2>
      );
    case "heading_3":
      return (
        <h3 key={`h3-${listPath}-${index}`} className="text-xl font-bold mt-5 mb-2">
          {emoji && <span className="mr-2">{renderIcon({emoji})}</span>}
          {renderTextWithLineBreaks(block)}
        </h3>
      );
    default:
      return null;
  }
};

// Component for paragraphs
export const ParagraphRenderer: React.FC<BlockRendererProps> = ({ block, index, depth, listPath }) => {
  // Set consistent 4px spacing
  const className = "my-1";
  
  return (
    <p key={`p-${listPath}-${index}`} className={className} style={{ lineHeight: '1.6' }}>
      {renderTextWithLineBreaks(block)}
    </p>
  );
};

// Component for quote blocks
export const QuoteRenderer: React.FC<BlockRendererProps> = ({ block, index, listPath }) => {
  return (
    <blockquote key={`quote-${listPath}-${index}`} className="border-l-4 border-muted pl-4 py-1 my-1 italic" style={{ lineHeight: '1.6' }}>
      {renderTextWithLineBreaks(block)}
    </blockquote>
  );
};

// Component for to-do blocks
export const TodoRenderer: React.FC<BlockRendererProps> = ({ block, index, listPath }) => {
  const { checked } = block;
  
  return (
    <div key={`todo-${listPath}-${index}`} className="flex items-start gap-2 my-1" style={{ lineHeight: '1.6' }}>
      <input 
        type="checkbox" 
        checked={checked} 
        readOnly 
        className="mt-1"
      />
      <span className={cn(checked && "line-through text-muted-foreground")}>
        {renderTextWithLineBreaks(block)}
      </span>
    </div>
  );
};

// Component for callout blocks
export const CalloutRenderer: React.FC<BlockRendererProps> = ({ block, index, listPath, renderNested }) => {
  const { icon, emoji, children } = block;
  
  return (
    <div key={`callout-${listPath}-${index}`} className="bg-muted p-4 rounded-md my-1 flex gap-3 items-start" style={{ lineHeight: '1.6' }}>
      {(icon || emoji) && (
        <div className="text-xl flex-shrink-0 mt-0.5">{renderIcon(icon) || emoji}</div>
      )}
      <div className="flex-1 space-y-1">
        {!children || children.length === 0 ? 
          renderTextWithLineBreaks(block) : 
          children.map((child, idx) => renderNested(child, idx, 0, `${listPath}-callout-${idx}`))
        }
      </div>
    </div>
  );
};

// Component for code blocks
export const CodeRenderer: React.FC<BlockRendererProps> = ({ block, index, listPath }) => {
  const { text, language } = block;
  
  return (
    <pre key={`code-${listPath}-${index}`} className="bg-muted p-4 rounded-md my-1 overflow-x-auto" style={{ lineHeight: '1.6' }}>
      <code className={language ? `language-${language}` : ""}>
        {text}
      </code>
    </pre>
  );
};

// Component for toggle blocks
export const ToggleRenderer: React.FC<BlockRendererProps> = ({ block, index, listPath, renderNested }) => {
  const { emoji, children } = block;
  
  return (
    <Collapsible key={`toggle-${listPath}-${index}`} className="my-1 border border-muted rounded-md">
      <CollapsibleTrigger className="p-3 w-full flex items-center justify-between text-left font-medium hover:bg-muted/50" style={{ lineHeight: '1.6' }}>
        <div className="flex items-center">
          {emoji && <span className="mr-2">{renderIcon({emoji})}</span>}
          <span>{renderTextWithLineBreaks(block)}</span>
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
      </CollapsibleTrigger>
      <CollapsibleContent className="p-3 pt-0 border-t space-y-1">
        {children && children.map((child, idx) => 
          renderNested(child, idx, 0, `${listPath}-toggle-${idx}`)
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

// Component for table blocks
export const TableRenderer: React.FC<BlockRendererProps> = ({ block, index, listPath }) => {
  const { children, has_column_header, has_row_header } = block;
  
  if (!children || children.length === 0) return null;
  
  return (
    <div key={`table-${listPath}-${index}`} className="my-4 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 border">
        <tbody>
          {children.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`} className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              {row.children && row.children.map((cell, cellIndex) => {
                const isHeader = (has_column_header && rowIndex === 0) || 
                                (has_row_header && cellIndex === 0);
                const CellTag = isHeader ? 'th' : 'td';
                return (
                  <CellTag 
                    key={`cell-${cellIndex}`}
                    className={cn(
                      "px-4 py-2 border text-left",
                      isHeader && "font-semibold bg-gray-100"
                    )}
                  >
                    {cell.text && renderTextWithLineBreaks(cell)}
                  </CellTag>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Component for column lists
export const ColumnListRenderer: React.FC<BlockRendererProps> = ({ block, index, listPath, renderNested }) => {
  const { children } = block;
  
  if (!children || children.length === 0) return null;
  
  // Determine the column count and use appropriate grid classes
  const columnCount = children.length;
  const columnClass = cn(
    "grid gap-4", 
    columnCount === 2 && "grid-cols-1 md:grid-cols-2",
    columnCount === 3 && "grid-cols-1 md:grid-cols-3",
    columnCount === 4 && "grid-cols-1 sm:grid-cols-2 md:grid-cols-4",
    columnCount > 4 && "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
  );
  
  return (
    <div key={`column-list-${listPath}-${index}`} className={`my-1 ${columnClass}`}>
      {children.map((column, colIndex) => (
        <div key={`column-${colIndex}`} className="flex flex-col space-y-1">
          {column.children && column.children.map((child, childIndex) => (
            renderNested(child, childIndex, 0, `${listPath}-col-${colIndex}-${childIndex}`)
          ))}
        </div>
      ))}
    </div>
  );
};

// Component for column blocks
export const ColumnRenderer: React.FC<BlockRendererProps> = ({ block, index, listPath, renderNested }) => {
  const { children } = block;
  
  if (!children || children.length === 0) return null;
  
  return (
    <div key={`column-${listPath}-${index}`} className="flex flex-col space-y-1">
      {children.map((child, childIndex) => (
        renderNested(child, childIndex, 0, `${listPath}-column-${childIndex}`)
      ))}
    </div>
  );
};

// Component for equation blocks
export const EquationRenderer: React.FC<BlockRendererProps> = ({ block, index, listPath }) => {
  const { text } = block;
  
  return (
    <div key={`equation-${listPath}-${index}`} className="my-2 px-2 py-1 bg-gray-50 font-mono text-sm overflow-x-auto">
      {text && <code>{text}</code>}
    </div>
  );
};

// Media block renderer that delegates to specialized renderers
export const MediaBlockRenderer: React.FC<BlockRendererProps> = ({ block, index, listPath }) => {
  const { type, media_type, media_url, url, caption, text, is_heic } = block;
  
  // Handle both formats: older format uses media_url, newer format might use url
  const imageUrl = media_url || url;
  
  // For different media types
  if (media_type === "image" || type === "image" || (type === "media" && block.media_type === "image")) {
    return <ImageRenderer 
      type="image"
      url={url}
      media_url={media_url}
      caption={caption}
      text={text}
      is_heic={is_heic}
      index={index}
      listPath={listPath}
    />;
  }
  
  if (media_type === "video" || type === "video" || (type === "media" && block.media_type === "video")) {
    return <VideoRenderer
      type="video"
      url={url}
      media_url={media_url}
      caption={caption}
      text={text}
      index={index}
      listPath={listPath}
    />;
  }
  
  if (media_type === "embed" || type === "embed" || (type === "media" && block.media_type === "embed")) {
    return <EmbedRenderer
      type="embed"
      media_url={media_url}
      caption={caption}
      text={text}
      index={index}
      listPath={listPath}
    />;
  }
  
  return null;
};

// Default block renderer for simple text blocks
export const DefaultBlockRenderer: React.FC<BlockRendererProps> = ({ block, index, listPath }) => {
  if (block.text) {
    return (
      <div key={`default-${listPath}-${index}`} className="my-1" style={{ lineHeight: '1.6' }}>
        {renderTextWithLineBreaks(block)}
      </div>
    );
  }
  return null;
};

// Divider renderer
export const DividerRenderer: React.FC<{ index: number, listPath: string }> = ({ index, listPath }) => {
  return <hr key={`divider-${listPath}-${index}`} className="my-3 border-t border-gray-400" />;
};
