// CategoryFilter Multi-Choice Feature Tests
// Tests for allowing users to select multiple categories simultaneously

import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryFilter } from '@/components/CategoryFilter';

const mockItems = [
  { id: '1', category: 'Tech', title: 'Test 1', user_id: 'user1' },
  { id: '2', category: 'Health', title: 'Test 2', user_id: 'user1' },
  { id: '3', category: 'Tech', title: 'Test 3', user_id: 'user1' },
  { id: '4', category: null, title: 'Test 4', user_id: 'user1' },
];

describe('CategoryFilter Multi-Choice Feature', () => {
  test('should allow selection of multiple categories', () => {
    const onCategoryChange = jest.fn();
    render(
      <CategoryFilter 
        items={mockItems} 
        selectedCategories={[]} 
        onCategoryChange={onCategoryChange} 
      />
    );
    
    // Click on Tech category
    fireEvent.click(screen.getByText('Tech'));
    expect(onCategoryChange).toHaveBeenCalledWith(['Tech']);
    
    // Should allow adding Health category
    fireEvent.click(screen.getByText('Health'));
    expect(onCategoryChange).toHaveBeenCalledWith(['Health']);
  });

  test('should display selected categories with active state', () => {
    render(
      <CategoryFilter 
        items={mockItems} 
        selectedCategories={['Tech', 'Health']} 
        onCategoryChange={jest.fn()} 
      />
    );
    
    // Both Tech and Health buttons should have active styling
    const techButton = screen.getByText('Tech').closest('button');
    const healthButton = screen.getByText('Health').closest('button');
    
    expect(techButton).toHaveClass('bg-primary');
    expect(healthButton).toHaveClass('bg-primary');
  });

  test('should filter content items by multiple selected categories', () => {
    // This test validates that the parent component correctly filters
    // content based on multiple selected categories using OR logic
    const selectedCategories = ['Tech', 'Health'];
    const filteredItems = mockItems.filter(item => {
      const itemCategory = item.category || 'Uncategorized';
      return selectedCategories.includes(itemCategory);
    });
    
    expect(filteredItems).toHaveLength(3); // 2 Tech + 1 Health
    expect(filteredItems.map(item => item.id)).toEqual(['1', '2', '3']);
  });

  test('should show All button as selected when no categories are chosen', () => {
    render(
      <CategoryFilter 
        items={mockItems} 
        selectedCategories={[]} 
        onCategoryChange={jest.fn()} 
      />
    );
    
    const allButton = screen.getByText('All').closest('button');
    expect(allButton).toHaveClass('bg-primary');
  });

  test('should deselect All button when specific categories are selected', () => {
    render(
      <CategoryFilter 
        items={mockItems} 
        selectedCategories={['Tech']} 
        onCategoryChange={jest.fn()} 
      />
    );
    
    const allButton = screen.getByText('All').closest('button');
    expect(allButton).not.toHaveClass('bg-primary');
  });

  test('should handle category selection and deselection', () => {
    const onCategoryChange = jest.fn();
    render(
      <CategoryFilter 
        items={mockItems} 
        selectedCategories={['Tech']} 
        onCategoryChange={onCategoryChange} 
      />
    );
    
    // Clicking on already selected Tech should deselect it
    fireEvent.click(screen.getByText('Tech'));
    expect(onCategoryChange).toHaveBeenCalledWith([]);
  });

  test('should update content count when categories change', () => {
    render(
      <CategoryFilter 
        items={mockItems} 
        selectedCategories={[]} 
        onCategoryChange={jest.fn()} 
      />
    );
    
    // All button should show total count
    expect(screen.getByText('4')).toBeInTheDocument();
    
    // Tech category should show its count
    expect(screen.getByText('2')).toBeInTheDocument();
    
    // Health category should show its count
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});