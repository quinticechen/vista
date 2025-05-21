
import React from "react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Clock, Calendar, Tag } from "lucide-react";
import { ExtendedContentItem } from "@/utils/notionContentProcessor";

interface ContentMetadataProps {
  content: ExtendedContentItem;
}

export const ContentMetadata: React.FC<ContentMetadataProps> = ({ content }) => {
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
