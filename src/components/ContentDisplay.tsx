
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import NotionRenderer from "@/components/NotionRenderer";
import { ContentItem } from "@/services/adminService";

interface ContentDisplayProps {
  content: any; // The content from the database
  className?: string;
  showFullContent?: boolean;
}

// This is the main ContentDisplay component
const ContentDisplay: React.FC<ContentDisplayProps> = ({
  content,
  className,
  showFullContent = false,
}) => {
  // Check if content is an array (Notion blocks format)
  const isNotionContent = Array.isArray(content);

  // Render content based on its format
  const renderContent = () => {
    if (!content) {
      return <p className="text-muted-foreground">No content available</p>;
    }

    if (isNotionContent) {
      return <NotionRenderer blocks={content} />;
    }

    // If it's a string, render it directly
    if (typeof content === "string") {
      return <div dangerouslySetInnerHTML={{ __html: content }} />;
    }

    // If it's an object, stringify it
    return <pre>{JSON.stringify(content, null, 2)}</pre>;
  };

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        {renderContent()}
      </CardContent>
    </Card>
  );
};

// Add a new ContentDisplayItem component that was being imported in About.tsx and Vista.tsx
interface ContentDisplayItemProps {
  content: ContentItem;
  className?: string;
}

export const ContentDisplayItem: React.FC<ContentDisplayItemProps> = ({ content, className }) => {
  return (
    <Card className={`h-full transition-all hover:shadow-md ${className}`}>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-2">{content.title}</h3>
        
        {content.description && (
          <p className="text-gray-600 mb-3 line-clamp-3">{content.description}</p>
        )}
        
        <div className="flex flex-wrap gap-2 mt-4">
          {content.category && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-beige-100 text-beige-800">
              {content.category}
            </span>
          )}
          
          {content.similarityScore && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {content.similarityScore}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentDisplay;
