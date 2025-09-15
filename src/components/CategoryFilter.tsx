import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContentItem } from "@/services/adminService";

interface CategoryFilterProps {
  items: ContentItem[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  showCounts?: boolean;
}

export const CategoryFilter = ({ 
  items, 
  selectedCategory, 
  onCategoryChange, 
  showCounts = true 
}: CategoryFilterProps) => {
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

  if (categories.length <= 1) {
    return null; // Don't show filter if there's only one category or no items
  }

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <Button
        variant={selectedCategory === null ? "default" : "outline"}
        size="sm"
        onClick={() => onCategoryChange(null)}
        className="h-8"
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
          variant={selectedCategory === category ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryChange(category)}
          className="h-8"
        >
          {category}
          {showCounts && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {count}
            </Badge>
          )}
        </Button>
      ))}
    </div>
  );
};