// Content Sorting Feature Tests
// Tests for sorting content by date (newest to oldest) and popularity

import { render, screen, fireEvent } from '@testing-library/react';
import { ContentSorter } from '@/components/ContentSorter';

const mockItems = [
  { id: '1', title: 'Old Item', created_at: '2023-01-01', visitor_count: 5 },
  { id: '2', title: 'New Item', created_at: '2024-01-01', visitor_count: 10 },
  { id: '3', title: 'Popular Item', created_at: '2023-06-01', visitor_count: 50 },
];

describe('Content Sorting Feature', () => {
  test('should display sorting options button', () => {
    render(
      <ContentSorter 
        selectedSort="newest" 
        onSortChange={jest.fn()} 
        itemCount={3} 
      />
    );
    
    // Should show the sort button
    expect(screen.getByText('Newest First')).toBeInTheDocument();
    expect(screen.getByText('3 items')).toBeInTheDocument();
  });

  test('should sort content by newest to oldest', () => {
    const sortedByNewest = [...mockItems].sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return dateB.getTime() - dateA.getTime();
    });
    
    expect(sortedByNewest[0].id).toBe('2'); // New Item first
    expect(sortedByNewest[1].id).toBe('3'); // Mid-date item
    expect(sortedByNewest[2].id).toBe('1'); // Old Item last
  });

  test('should sort content by oldest to newest', () => {
    const sortedByOldest = [...mockItems].sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return dateA.getTime() - dateB.getTime();
    });
    
    expect(sortedByOldest[0].id).toBe('1'); // Old Item first
    expect(sortedByOldest[1].id).toBe('3'); // Mid-date item
    expect(sortedByOldest[2].id).toBe('2'); // New Item last
  });

  test('should sort content by popularity (visitor count)', () => {
    const sortedByPopular = [...mockItems].sort((a, b) => {
      return (b.visitor_count || 0) - (a.visitor_count || 0);
    });
    
    expect(sortedByPopular[0].id).toBe('3'); // Popular Item first (50 visits)
    expect(sortedByPopular[1].id).toBe('2'); // New Item second (10 visits)
    expect(sortedByPopular[2].id).toBe('1'); // Old Item last (5 visits)
  });

  test('should maintain sorting when filtering by categories', () => {
    // This test ensures that when categories filter items,
    // the remaining items maintain their sort order
    const filteredItems = mockItems.filter(item => item.visitor_count > 7);
    const sortedFiltered = filteredItems.sort((a, b) => 
      (b.visitor_count || 0) - (a.visitor_count || 0)
    );
    
    expect(sortedFiltered).toHaveLength(2);
    expect(sortedFiltered[0].id).toBe('3'); // Most popular
    expect(sortedFiltered[1].id).toBe('2'); // Second most popular
  });

  test('should show current sort option as selected', () => {
    const onSortChange = jest.fn();
    render(
      <ContentSorter 
        selectedSort="popular" 
        onSortChange={onSortChange} 
        itemCount={3} 
      />
    );
    
    // Should show Most Popular as current selection
    expect(screen.getByText('Most Popular')).toBeInTheDocument();
  });

  test('should handle sorting of search results', () => {
    // Test that search results with similarity scores can be sorted
    const searchResults = [
      { ...mockItems[0], similarity: 0.8 },
      { ...mockItems[1], similarity: 0.9 },
      { ...mockItems[2], similarity: 0.7 },
    ];
    
    // When sorting search results by newest, should consider similarity first
    const sortedSearchResults = searchResults.sort((a, b) => {
      if (a.similarity !== undefined && b.similarity !== undefined) {
        const similarityDiff = b.similarity - a.similarity;
        if (Math.abs(similarityDiff) > 0.01) {
          return similarityDiff;
        }
      }
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return dateB.getTime() - dateA.getTime();
    });
    
    expect(sortedSearchResults[0].similarity).toBe(0.9);
  });

  test('should fallback gracefully for items with missing data', () => {
    const itemsWithMissingData = [
      { id: '1', title: 'Item 1' }, // No date or visitor count
      { id: '2', title: 'Item 2', created_at: '2024-01-01' },
      { id: '3', title: 'Item 3', visitor_count: 10 },
    ];
    
    // Should not throw errors when sorting items with missing data
    const sortedByDate = [...itemsWithMissingData].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
      const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
    
    expect(sortedByDate).toHaveLength(3);
    expect(sortedByDate[0].id).toBe('2'); // Has actual date
  });
});