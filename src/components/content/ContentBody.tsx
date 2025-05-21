
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import NotionRenderer from "@/components/NotionRenderer";
import { ExtendedContentItem } from "@/utils/notionContentProcessor";

interface ContentBodyProps {
  content: ExtendedContentItem;
}

export const ContentBody: React.FC<ContentBodyProps> = ({ content }) => {
  return (
    <Card className="mb-8 border rounded-md shadow-sm">
      <CardContent className="p-6">
        {content?.content ? (
          <div className="prose prose-sm sm:prose max-w-none">
            <NotionRenderer blocks={content.content} />
          </div>
        ) : (
          <p className="text-gray-500 italic">No content available</p>
        )}
      </CardContent>
    </Card>
  );
};
