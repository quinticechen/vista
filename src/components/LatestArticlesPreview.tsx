import { ContentDisplayItem } from "@/components/ContentDisplay";
import { ContentItem } from "@/services/adminService";

interface LatestArticlesPreviewProps {
  items: ContentItem[];
  /** Scope urlPrefix to one creator's content; omit for the global vista list. */
  urlParam?: string;
}

// The card grid itself: 3 side by side on desktop (matching the option-button row's
// width/breakpoints above it on the home pages), stacked on mobile. Each card always
// uses the vista list's mobile card style (ContentDisplayItem's forceMobileLayout)
// regardless of viewport, since even the desktop grid cells here are much narrower
// than the full-width article list this is teasing. Data fetching lives in
// useLatestContentItems / LatestArticlesSection, not here, so this stays a plain
// presentational grid.
export const LatestArticlesPreview = ({ items, urlParam }: LatestArticlesPreviewProps) => {
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((item, index) => (
        <ContentDisplayItem
          key={item.id}
          content={item}
          index={index}
          urlPrefix={urlParam ? `/${urlParam}` : ''}
          forceMobileLayout
        />
      ))}
    </div>
  );
};

export default LatestArticlesPreview;
