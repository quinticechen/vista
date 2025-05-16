import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { ContentItem } from "@/services/adminService";
import { Badge } from "@/components/ui/badge";

export interface ContentDisplayItemProps {
  content: ContentItem;
  urlPrefix?: string;
  index?: number;
  showStatus?: boolean;
}

export const ContentDisplayItem = ({ 
  content, 
  urlPrefix = '', 
  index = 0,
  showStatus = false 
}: ContentDisplayItemProps) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const hasMedia = content.content && content.content.some((block: any) => block.media_type === 'image' || block.media_type === 'video');
  const shouldAlternate = index !== undefined && index % 2 === 1;

  const renderMedia = () => {
    if (!content.content) return null;

    const mediaBlock = content.content.find((block: any) => block.media_type === 'image' || block.media_type === 'video');

    if (!mediaBlock) return null;

    if (mediaBlock.media_type === 'image') {
      return (
        <img
          src={mediaBlock.media_url}
          alt={mediaBlock.caption || content.title}
          className="object-cover w-full h-full"
        />
      );
    }

    if (mediaBlock.media_type === 'video') {
      return (
        <video src={mediaBlock.media_url} controls className="object-cover w-full h-full">
          Your browser does not support the video tag.
        </video>
      );
    }

    return null;
  };

  const renderTags = () => {
    if (!content.tags || content.tags.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2">
        {content.tags.map((tag, index) => (
          <Badge key={index} variant="secondary">
            {tag}
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <Card
      key={content.id}
      className={`overflow-hidden transition-shadow hover:shadow-lg ${
        isRTL ? "rtl" : "ltr"
      }`}
    >
      <div className="flex flex-col lg:flex-row">
        {/* Media section (conditionally rendered) */}
        {hasMedia && (
          <div
            className={`relative w-full lg:w-2/5 h-auto lg:h-[400px] flex-shrink-0 ${
              shouldAlternate ? "order-last" : ""
            }`}
          >
            {renderMedia()}
          </div>
        )}

        {/* Content section */}
        <div className={`w-full ${hasMedia ? "lg:w-3/5" : "lg:w-full"} p-4 lg:p-6 flex flex-col justify-between`}>
          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              {content.category && (
                <Badge variant="outline" className="text-xs">
                  {content.category}
                </Badge>
              )}
              {showStatus && content.notion_page_status === "removed" && (
                <Badge variant="destructive" className="text-xs">
                  Removed from Notion
                </Badge>
              )}
              {showStatus && content.notion_page_status === "active" && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  Active in Notion
                </Badge>
              )}
            </div>

            <h2 className="text-xl md:text-2xl font-bold mb-2 group-hover:text-amber-600 transition-colors">
              <Link
                to={`${urlPrefix}/content/${content.id}`}
                className="hover:underline"
              >
                {content.title}
              </Link>
            </h2>

            {content.description && (
              <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                {content.description}
              </p>
            )}

            {renderTags()}
          </div>

          <div className="mt-auto pt-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {formatDate(content.created_at)}
            </div>

            <Link
              to={`${urlPrefix}/content/${content.id}`}
              className="text-amber-600 hover:text-amber-800 font-medium hover:underline flex items-center"
            >
              {t("common.readMore")}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
};
