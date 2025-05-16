
import React from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/hooks/use-i18n";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { ContentItem } from "@/services/adminService";
import { Badge } from "@/components/ui/badge";
import { Json } from "@/integrations/supabase/types";

export interface ContentDisplayItemProps {
  content: ContentItem;
  urlPrefix?: string;
  index?: number;
  showStatus?: boolean;
}

// Helper function to check if content has media
const hasMediaInContent = (content: Json | any[] | undefined): boolean => {
  if (!content) return false;
  if (Array.isArray(content)) {
    return content.some((block: any) => 
      block?.media_type === 'image' || block?.media_type === 'video');
  }
  // Handle Json case - try to parse if it's a string
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed.some((block: any) => 
          block?.media_type === 'image' || block?.media_type === 'video');
      }
    } catch (e) {
      return false;
    }
  }
  return false;
};

// Helper function to find media block
const findMediaBlock = (content: Json | any[] | undefined): any => {
  if (!content) return null;
  if (Array.isArray(content)) {
    return content.find((block: any) => 
      block?.media_type === 'image' || block?.media_type === 'video');
  }
  // Handle Json case - try to parse if it's a string
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed.find((block: any) => 
          block?.media_type === 'image' || block?.media_type === 'video');
      }
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const ContentDisplayItem = ({ 
  content, 
  urlPrefix = '', 
  index = 0,
  showStatus = false 
}: ContentDisplayItemProps) => {
  const { t, i18n } = useI18n();
  const isRTL = i18n.language === 'ar';
  
  const mediaBlock = findMediaBlock(content.content);
  const mediaUrl = mediaBlock?.media_url;
  const isMediaRight = index % 2 === 0;
  
  // Function to get the correct detail route
  const getDetailRoute = () => {
    return `${urlPrefix}/content/${content.id}`;
  };

  return (
    <Card
      className={`group h-[400px] overflow-hidden flex ${mediaUrl ? 'w-full' : 'w-full'} flex-row hover:shadow-md transition-shadow duration-200`}
    > 
      {/* Text Content Section - Always present */}
      <div className={`${mediaUrl ? 'w-1/2' : 'w-full'} flex flex-col ${isMediaRight ? 'order-first' : 'order-last'}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2 mb-1">
            {content.category && (
              <Badge variant="outline" className="text-xs">
                {content.category}
              </Badge>
            )}

            {(content.start_date || content.end_date) && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                <span>
                  {formatDate(content.start_date)}
                  {content.end_date && content.start_date !== content.end_date && 
                    ` - ${formatDate(content.end_date)}`}
                </span>
              </div>
            )}
          </div>

          <h3 className="text-lg font-medium leading-tight group-hover:text-primary transition-colors duration-200">
            {content.title}
          </h3>
        </CardHeader>
        
        <CardContent className="pb-2 flex-grow">
          {/* Description display */}
          {content.description && (
            <p className="text-sm text-muted-foreground line-clamp-4">
              {content.description}
            </p>
          )}
        </CardContent>

        <CardFooter className="flex flex-col items-start pt-2 gap-2 mt-auto">
          <div className="flex flex-wrap gap-1 w-full">
            {content.tags && content.tags.slice(0, 3).map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}

            {content.tags && content.tags?.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{content.tags.length - 3}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between w-full mt-2">
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              <span>{formatDate(content.created_at)}</span>
            </div>

            {content.similarity !== undefined && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {Math.round(content.similarity * 100)}% match
              </span>
            )}
            
            {showStatus && (
              <div className="ml-auto">
                {content.notion_page_status === "removed" && (
                  <Badge variant="destructive" className="text-xs">
                    Removed
                  </Badge>
                )}
                {content.notion_page_status === "active" && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    Active
                  </Badge>
                )}
              </div>
            )}
          </div>

          <Button
            size="sm"
            className="w-full mt-2"
            asChild
          >
            <Link to={getDetailRoute()}>
              Learn More
            </Link>
          </Button>
        </CardFooter>
      </div>

      {/* Media Section - Only show if we have media */}
      {mediaUrl && (
        <div className={`w-1/2 relative ${isMediaRight ? 'order-last' : 'order-first'}`}>
          {mediaBlock?.media_type === 'image' ? (
            <img
              src={mediaUrl}
              alt={mediaBlock.caption || content.title}
              className="object-cover w-full h-full"
            />
          ) : mediaBlock?.media_type === 'video' ? (
            <video 
              src={mediaUrl} 
              controls 
              className="object-cover w-full h-full"
              playsInline
            >
              Your browser does not support the video tag.
            </video>
          ) : null}
        </div>
      )}
    </Card>
  );
};
