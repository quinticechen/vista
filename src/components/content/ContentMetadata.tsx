
import React from "react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Clock, Calendar, Tag, Eye } from "lucide-react";
import { ExtendedContentItem } from "@/utils/notionContentProcessor";

interface ContentMetadataProps {
  content: ExtendedContentItem;
}

export const ContentMetadata: React.FC<ContentMetadataProps> = ({ content }) => {
  // Function to format visitor count for display
  const formatVisitorCount = (count: number | null | undefined) => {
    if (!count) return 0;
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <div className="mb-6">
      {content?.category && (
        <Badge variant="outline" className="mb-2 mr-2">{content.category}</Badge>
      )}
      
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="mr-1 h-4 w-4" />
          <span>Created: {formatDate(content?.created_at)}</span>
        </div>
        
        {content?.updated_at && content.updated_at !== content.created_at && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-1 h-4 w-4" />
            <span>Updated: {formatDate(content?.updated_at)}</span>
          </div>
        )}
        
        {content?.start_date && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="mr-1 h-4 w-4" />
            <span>Starts: {formatDate(content?.start_date)}</span>
          </div>
        )}
        
        {content?.end_date && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="mr-1 h-4 w-4" />
            <span>Ends: {formatDate(content?.end_date)}</span>
          </div>
        )}
        
        {/* Display visitor count */}
        <div className="flex items-center text-sm text-muted-foreground">
          <Eye className="mr-1 h-4 w-4" />
          <span>Views: {formatVisitorCount((content as any)?.visitor_count)}</span>
        </div>
      </div>
      
      {content?.description && (
        <p className="text-lg mb-6">{content.description}</p>
      )}
      
      {content?.tags && content.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="flex items-center mr-1">
            <Tag className="h-4 w-4 mr-1" />
          </span>
          {content.tags.map((tag: string, index: number) => (
            <Badge key={index} variant="secondary">{tag}</Badge>
          ))}
        </div>
      )}
    </div>
  );
};
