
import React from "react";
import NotionRenderer from "@/components/NotionRenderer";
import { ExtendedContentItem } from "@/utils/notionContentProcessor";

interface ContentBodyProps {
  content: ExtendedContentItem;
}

// No border/background/padding of its own -- the content fills the article's content
// area directly, relying on the page's own padding (set in UrlParamContentDetail).
export const ContentBody: React.FC<ContentBodyProps> = ({ content }) => {
  return (
    <div className="mb-8 notion-content-wrapper">
      {content?.content ? (
        <div className="prose prose-sm sm:prose max-w-none">
          <NotionRenderer blocks={content.content as any[]} />
        </div>
      ) : (
        <p className="text-gray-500 italic">No content available</p>
      )}
    </div>
  );
};
