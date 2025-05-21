
// Define the types for our simplified Notion blocks format
export type NotionAnnotation = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  color?: string;
  text?: string;
  start?: number;
  end?: number;
  href?: string;
};

export type NotionBlock = {
  id?: string;
  type: string;
  text?: string;
  list_type?: "numbered_list" | "bulleted_list";
  is_list_item?: boolean;
  checked?: boolean;
  media_url?: string;
  media_type?: "image" | "video" | "embed";
  caption?: string;
  language?: string;
  icon?: any;
  emoji?: string;
  annotations?: NotionAnnotation[];
  children?: NotionBlock[];
  url?: string; // For backward compatibility
  _counter?: number; // Added for numbered list counter support
  table_width?: number;
  has_row_header?: boolean;
  has_column_header?: boolean;
  is_heic?: boolean; // New property to indicate HEIC images
};

export interface NotionRendererProps {
  blocks: NotionBlock[];
  className?: string;
}
