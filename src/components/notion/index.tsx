
import NotionRenderer from "../NotionRenderer";
import { NotionBlock, NotionRendererProps } from "./types";

export {
  NotionRenderer
};

// Export types using 'export type' syntax for TypeScript isolatedModules compatibility
export type { NotionBlock, NotionRendererProps };

// Re-export subcomponents if needed
export * from "./components/ListRenderer";
export * from "./components/MediaRenderer";
