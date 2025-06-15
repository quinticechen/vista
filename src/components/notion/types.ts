
// Define the types for our simplified Notion blocks format
export type NotionAnnotation = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  color?: string;
  background_color?: string; // Added background_color property
  text?: string;
  start?: number;
  end?: number;
  href?: string;
};

export type NotionTableCell = {
  text: string;
  annotations: NotionAnnotation[];
};

export type NotionTableRow = {
  cells: NotionTableCell[];
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
  rows?: NotionTableRow[]; // Added rows property for table data
  cells?: NotionTableCell[]; // Added cells property for table row data
  is_heic?: boolean; // New property to indicate HEIC images
  width?: number; // Width of the image
  height?: number; // Height of the image
  orientation?: 'portrait' | 'landscape' | 'square'; // Orientation of the image
  aspect_ratio?: number; // Aspect ratio of the image (width/height)
};

export interface NotionRendererProps {
  blocks: NotionBlock[];
  className?: string;
}
