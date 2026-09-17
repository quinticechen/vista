
import React from "react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Clock, Eye } from "lucide-react";
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

  // Created/Updated collapse into a single entry (Updated <- Created) when both exist.
  const hasTime = !!content?.created_at || !!content?.updated_at;
  const timeLabel = content?.updated_at && content.updated_at !== content.created_at
    ? `${formatDate(content.updated_at)} ← ${formatDate(content.created_at)}`
    : formatDate(content?.created_at);

  return (
    <div className="mb-6 md:mb-9">
      {content?.description && (
        <p className="text-lg mb-3 md:mb-6">{content.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {content?.category && (
          <Badge variant="outline">{content.category}</Badge>
        )}

        {hasTime && (
          <div className="flex items-center text-sm text-muted-foreground gap-1">
            <Clock className="h-4 w-4" />
            <span>{timeLabel}</span>
          </div>
        )}

        <div className="flex items-center text-sm text-muted-foreground gap-1">
          <Eye className="h-4 w-4" />
          <span>{formatVisitorCount((content as any)?.visitor_count)}</span>
        </div>

        {content?.tags && content.tags.length > 0 && content.tags.map((tag: string, index: number) => (
          <Badge key={index} variant="secondary">{tag}</Badge>
        ))}
      </div>
    </div>
  );
};
