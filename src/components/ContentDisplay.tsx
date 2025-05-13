
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import NotionRenderer from "@/components/NotionRenderer";

interface ContentDisplayProps {
  content: any; // The content from the database
  className?: string;
  showFullContent?: boolean;
}

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

export default ContentDisplay;
