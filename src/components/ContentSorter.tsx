import { Button } from "@/components/ui/button";
import { Badge } from "@/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, Calendar, TrendingUp, Clock, Sparkles } from "lucide-react";

export type SortOption = 'relevance' | 'newest' | 'oldest' | 'popular';

interface ContentSorterProps {
  selectedSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  itemCount?: number;
}

export const ContentSorter = ({ 
  selectedSort, 
  onSortChange, 
  itemCount 
}: ContentSorterProps) => {
  const getSortLabel = (sort: SortOption) => {
    switch (sort) {
      case 'relevance':
        return 'Most Relevant';
      case 'newest':
        return 'Newest First';
      case 'oldest':
        return 'Oldest First';
      case 'popular':
        return 'Most Popular';
      default:
        return 'Sort By';
    }
  };

  const getSortIcon = (sort: SortOption) => {
    switch (sort) {
      case 'relevance':
        return <Sparkles className="w-4 h-4" />;
      case 'newest':
        return <Calendar className="w-4 h-4" />;
      case 'oldest':
        return <Clock className="w-4 h-4" />;
      case 'popular':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <ArrowUpDown className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex items-center gap-2 mb-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-2">
            {getSortIcon(selectedSort)}
            {getSortLabel(selectedSort)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onClick={() => onSortChange('relevance')}
            className={selectedSort === 'relevance' ? 'bg-accent' : ''}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Most Relevant
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => onSortChange('popular')}
            className={selectedSort === 'popular' ? 'bg-accent' : ''}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Most Popular
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => onSortChange('newest')}
            className={selectedSort === 'newest' ? 'bg-accent' : ''}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Newest First
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => onSortChange('oldest')}
            className={selectedSort === 'oldest' ? 'bg-accent' : ''}
          >
            <Clock className="w-4 h-4 mr-2" />
            Oldest First
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {itemCount !== undefined && (
        <Badge variant="secondary" className="text-xs">
          {itemCount} items
        </Badge>
      )}
    </div>
  );
};
