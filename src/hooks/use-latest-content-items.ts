import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUserContentByUrlParam } from "@/services/urlParamService";
import { ContentItem } from "@/services/adminService";
import { processNotionContent, ContentItemFromDB } from "@/utils/notionContentProcessor";

// Shared by LatestArticlesPreview (the card grid) and LatestArticlesSection (the
// section wrapper, which also needs to know item count to decide whether to show
// itself/the Explore button at all) so they fetch once, not twice.
export function useLatestContentItems(urlParam?: string, limit = 3) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      try {
        let rawItems: ContentItem[] = [];

        if (urlParam) {
          rawItems = await getUserContentByUrlParam(urlParam);
        } else {
          const { data, error } = await supabase
            .from("content_items")
            .select("*")
            .neq("notion_page_status", "removed");
          if (error) throw error;
          rawItems = (data || []) as unknown as ContentItem[];
        }

        const processed = rawItems
          .filter((item) => item.notion_page_status !== 'removed')
          .map((item) => {
            const withParsedContent: ContentItemFromDB = { ...(item as any) };
            if (withParsedContent.content && typeof withParsedContent.content === 'string') {
              try {
                withParsedContent.content = JSON.parse(withParsedContent.content as unknown as string);
              } catch {
                withParsedContent.content = [];
              }
            }
            return processNotionContent(withParsedContent) as unknown as ContentItem;
          })
          .sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
          })
          .slice(0, limit);

        if (isMounted) setItems(processed);
      } catch (error) {
        console.error('useLatestContentItems - Error loading latest content:', error);
        if (isMounted) setItems([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [urlParam, limit]);

  return { items, isLoading };
}
