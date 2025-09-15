import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContentItem } from "@/services/adminService";

interface CategoryFilterProps {
  items: ContentItem[];
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  showCounts?: boolean;
}

export const CategoryFilter = ({ 
  items, 
  selectedCategories, 
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

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <Button
        variant={isAllSelected ? "default" : "outline"}
        size="sm"
        onClick={handleAllSelect}
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
          variant={selectedCategories.includes(category) ? "default" : "outline"}
          size="sm"
          onClick={() => handleCategoryToggle(category)}
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