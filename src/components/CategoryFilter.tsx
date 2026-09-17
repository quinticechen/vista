import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ContentItem } from "@/services/adminService";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  items: ContentItem[];
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  showCounts?: boolean;
  /** Collapse the category chips behind a "Filter" trigger that only opens on click,
   * matching the Figma "Money" design. Defaults to the existing always-expanded grid
   * so pages that don't opt in are unaffected. */
  collapsible?: boolean;
  /** Pill-shaped buttons, matching the Figma "Money" design. */
  rounded?: boolean;
}

export const CategoryFilter = ({
  items,
  selectedCategories,
  onCategoryChange,
  showCounts = true,
  collapsible = false,
  rounded = false,
}: CategoryFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  // Extract unique categories from items
  const getCategories = () => {
    const categoryMap = new Map<string, number>();
    
    items.forEach(item => {
      const category = item.category || 'Uncategorized';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
    
    return Array.from(categoryMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const categories = getCategories();
  const totalItems = items.length;
  const isAllSelected = selectedCategories.length === 0;

  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      // Remove category if already selected
      onCategoryChange(selectedCategories.filter(c => c !== category));
    } else {
      // Add category if not selected
      onCategoryChange([...selectedCategories, category]);
    }
  };

  const handleAllSelect = () => {
    onCategoryChange([]);
  };

  if (categories.length <= 1) {
    return null; // Don't show filter if there's only one category or no items
  }

  const chipClassName = cn("h-8", rounded && "rounded-full");

  const chips = (
    <>
      <Button
        variant={isAllSelected ? "default" : "outline"}
        size="sm"
        onClick={handleAllSelect}
        className={chipClassName}
      >
        All
        {showCounts && (
          <Badge variant="secondary" className="ml-2 text-xs">
            {totalItems}
          </Badge>
        )}
      </Button>

      {categories.map(([category, count]) => (
        <Button
          key={category}
          variant={selectedCategories.includes(category) ? "default" : "outline"}
          size="sm"
          onClick={() => handleCategoryToggle(category)}
          className={chipClassName}
        >
          {category}
          {showCounts && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {count}
            </Badge>
          )}
        </Button>
      ))}
    </>
  );

  if (!collapsible) {
    return <div className="flex flex-wrap gap-2 mb-6">{chips}</div>;
  }

  // Collapsed "Filter" trigger: transparent while nothing is selected, shows the
  // selected count once something is, and the category chips only appear once opened.
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={isAllSelected ? "Filter" : `Filter (${selectedCategories.length} selected)`}
          className={cn(
            "h-8 gap-1.5 px-2.5",
            rounded && "rounded-full",
            isAllSelected
              ? "bg-transparent"
              : "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
          )}
        >
          <Filter className="h-4 w-4" />
          {!isAllSelected && (
            <Badge
              variant="secondary"
              className="h-5 min-w-5 justify-center rounded-full px-1.5 text-xs"
            >
              {selectedCategories.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      {/* Fixed (viewport-clamped) width -- letting this size itself from the chip row's
          natural width made it stretch to nearly the full page, since an absolutely
          positioned popover's shrink-to-fit basis is the viewport, not the trigger row. */}
      <PopoverContent align="start" className="w-[min(360px,calc(100vw-2rem))] p-3">
        <div className="flex flex-wrap gap-2">{chips}</div>
      </PopoverContent>
    </Popover>
  );
};