
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ClockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageAspectRatio } from "./ImageAspectRatio";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export interface ContentItem {
  id: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
  start_date?: string;
  end_date?: string;
  similarity?: number;
  content?: any[];
}

interface ContentDisplayItemProps {
  content: ContentItem;
  urlPrefix?: string;
}

export const ContentDisplayItem = ({ content, urlPrefix = "" }: ContentDisplayItemProps) => {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [aspectRatio, setAspectRatio] = useState(null);
  
  // Format date using local date format
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString();
  };
  
  // Get route to content detail
  const getDetailRoute = () => {
    if (urlPrefix) {
      return `${urlPrefix}/${content.id}`;
    }
    return `/vista/${content.id}`;
  };

  // Fetch the first media for this content item
  useEffect(() => {
    const fetchFirstMedia = async () => {
      try {
        setMediaUrl(null);
        setMediaType(null);
        setAspectRatio(null);
        
        if (content.content && content.content.length > 0) {
          for (const block of content.content) {
            if (block.type === 'image' && block.url) {
              setMediaUrl(block.url);
              setMediaType('image');
              return;
            } else if (block.type === 'video' && block.url) {
              setMediaUrl(block.url);
              setMediaType('video');
              setAspectRatio(16 / 9);
              return;
            }
          }
        }

        // Fallback to fetching from separate tables (adjust if needed)
        if (!mediaUrl) {
          let { data: imageData } = await supabase
            .from('image_contents')
            .select('image_url')
            .eq('content_id', content.id)
            .limit(1)
            .single();

          if (imageData?.image_url) {
            setMediaUrl(imageData.image_url);
            setMediaType('image');
            return;
          }

          let { data: videoData } = await supabase
            .from('video_contents')
            .select('thumbnail_url, video_url')
            .eq('content_id', content.id)
            .limit(1)
            .single();

          if (videoData?.thumbnail_url) {
            setMediaUrl(videoData.thumbnail_url);
            setMediaType('video');
            setAspectRatio(16 / 9); // 假設影片縮圖是 16:9
          } else if (videoData?.video_url) {
            setMediaUrl(videoData.video_url);
            setMediaType('video');
            setAspectRatio(16 / 9); // 假設影片是 16:9
          }
        }
      } catch (error) {
        console.error("Error fetching media:", error);
      }
    };

    fetchFirstMedia();
  }, [content.id, content.content]);

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        {/* 卡片的標題頭部，包含類別和日期 */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <Badge variant="outline" className="text-xs">
            {content.category || "Type"}
          </Badge>

          {(content.start_date || content.end_date) && (
            <div className="flex items-center text-xs text-muted-foreground">
              <CalendarIcon className="h-3 w-3 mr-1" />
              <span>
                {formatDate(content.start_date)}
                {content.end_date && content.start_date !== content.end_date && ` - ${formatDate(content.end_date)}`}
              </span>
            </div>
          )}
        </div>

        <h3 className="text-lg font-medium leading-tight group-hover:text-primary transition-colors duration-200">
          {content.title}
        </h3>
      </CardHeader>

      <CardContent className="pb-2 space-y-4 flex-1">
        {/* 條件式渲染圖片 */}
        {mediaUrl && mediaType === 'image' && (
          <div style={{ height: '340px', overflow: 'hidden' }}>
            <img
              src={mediaUrl}
              alt={content.title}
              style={{
                objectFit: 'cover',
                width: '100%',
                height: '100%',
              }}
            />
          </div>
        )}

        {/* 條件式渲染影片 */}
        {mediaUrl && mediaType === 'video' && (
          <div style={{ height: '340px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <video src={mediaUrl} controls style={{ maxHeight: '100%', maxWidth: '100%' }} />
          </div>
        )}

        {/* 顯示內容描述 */}
        {content.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {content.description}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex flex-col items-start pt-2 gap-2">
        {/* 卡片的底部，包含標籤和創建時間 */}
        <div className="flex flex-wrap gap-1 w-full">
          {content.tags && content.tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}

          {content.tags && content.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{content.tags.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between w-full mt-2">
          <div className="flex items-center text-xs text-muted-foreground">
            <ClockIcon className="h-3 w-3 mr-1" />
            <span>{formatDate(content.created_at)}</span>
          </div>

          {content.similarity !== undefined && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {Math.round(content.similarity * 100)}% match
            </span>
          )}
        </div>

        {/* "Learn More" 按鈕，使用 Link 元件導航 */}
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
    </Card>
  );
