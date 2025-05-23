import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ContentDisplayItem } from "@/components/ContentDisplay";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "@/components/ui/sonner";
import { ContentItem, semanticSearch } from "@/services/adminService";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { processNotionContent } from "@/utils/notionContentProcessor";
import { SearchCache } from "@/utils/searchCache";

const Vista = () => {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [allContentItems, setAllContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showingSearchResults, setShowingSearchResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Check if we have search results from the navigation state
  const searchResults = location.state?.searchResults as ContentItem[] | undefined;
  const searchPurpose = location.state?.purpose as string | undefined;
  const searchTimestamp = location.state?.searchQuery; // Used to force re-render

  // Centralized content processing function to ensure consistency with UrlParamVista
  const processContentItem = (item: ContentItem): ContentItem => {
    console.log(`Processing content item ${item.id}: ${item.title}`);
    
    // Use the standard processor to handle orientation, images, etc.
    const processed = processNotionContent(item);
    
    // Ensure content is properly structured as an array
    if (processed.content && typeof processed.content === 'string') {
      try {
        processed.content = JSON.parse(processed.content);
      } catch (e) {
        console.error(`Error parsing content for ${item.id}:`, e);
        processed.content = [];
      }
    }
    
    if (!Array.isArray(processed.content)) {
      processed.content = [];
    }
    
    console.log(`After processing: orientation=${processed.orientation}, cover_image=${!!processed.cover_image}, preview_image=${!!processed.preview_image}`);
    return processed;
  };

  // Centralized content filtering function
  const filterActiveContent = (items: ContentItem[]): ContentItem[] => {
    return items.filter(item => item.notion_page_status !== 'removed');
  };

  // Centralized content processing pipeline
  const processContentItems = (items: ContentItem[]): ContentItem[] => {
    console.log(`Processing ${items.length} content items`);
    const filtered = filterActiveContent(items);
    const processed = filtered.map(processContentItem);
    console.log(`Processed ${processed.length} items after filtering`);
    return processed;
  };

  useEffect(() => {
    console.log("Vista page mounted or search updated");
    const fetchContentItems = async () => {
      try {
        setLoading(true);
        
        // Always fetch all content items for "View All" functionality
        const { data, error } = await supabase
          .from("content_items")
          .select("*")
          .neq("notion_page_status", "removed"); // Only get active items

        if (error) {
          throw error;
        }
        
        console.log(`Fetched ${data?.length || 0} content items from the database`);
        
        // Process the data to match ContentItem interface
        let processedData = (data || []).map((item: any) => ({
          ...item,
        })) as ContentItem[];
        
        // Apply consistent processing pipeline
        processedData = processContentItems(processedData);
        setAllContentItems(processedData);
        
        // Check for cached search results first
        const cachedSearch = SearchCache.load();
        if (cachedSearch && SearchCache.isValid(cachedSearch)) {
          console.log(`Vista - Restoring cached search: ${cachedSearch.results.length} results for "${cachedSearch.query}"`);
          
          const processedCachedResults = processContentItems(cachedSearch.results);
          setContentItems(processedCachedResults);
          setShowingSearchResults(true);
          setSearchQuery(cachedSearch.query);
          
          if (cachedSearch.purpose) {
            toast.success(`Restored search results for: "${cachedSearch.purpose}"`, { duration: 3000 });
          }
          return;
        }
        
        // Check for URL search parameter
        const urlSearchParam = searchParams.get("search");
        if (urlSearchParam) {
          setSearchQuery(urlSearchParam);
          await performSearch(urlSearchParam);
          return;
        }
        
        // If we have search results from semantic search, use those
        if (searchResults && searchResults.length > 0) {
          console.log(`Displaying ${searchResults.length} search results for: "${searchPurpose}"`);
          
          // Apply same processing pipeline to search results
          const processedSearchResults = processContentItems(searchResults);
          
          setContentItems(processedSearchResults);
          setShowingSearchResults(true);

          // Save to cache for future navigation
          SearchCache.save({
            results: processedSearchResults,
            query: searchPurpose || '',
            timestamp: Date.now(),
            showingSearchResults: true,
            purpose: searchPurpose
          });
    
          if (processedSearchResults.length === 0) {
            toast.warning(`No content found with 50%+ relevance for "${searchPurpose}". Try different keywords.`, { duration: 5000 });
          } else {
            toast.success(`Found ${processedSearchResults.length} relevant items (50%+ similarity)`, { duration: 5000 });
          }
        } else if (searchPurpose) {
          // If we had a search but it returned no results, show a message and empty content
          setContentItems([]);
          setShowingSearchResults(true);
          
          toast.warning(`No content found with 50%+ relevance for "${searchPurpose}". Try different keywords.`, { duration: 5000 });
        } else {
          // If no search results, use all content items
          setContentItems(processedData);
          setShowingSearchResults(false);
        }
      } catch (error) {
        console.error("Error fetching content:", error);
        toast.error("Failed to load content items");
        setContentItems([]);
        setShowingSearchResults(false);
      } finally {
        setLoading(false);
      }
    };
    
    fetchContentItems();
  }, [searchResults, searchPurpose, searchTimestamp, searchParams]);

  // Perform search using semantic search
  const performSearch = async (term: string) => {
    if (!term.trim()) {
      handleViewAll();
      return;
    }
    
    setLoading(true);
    try {
      console.log(`Vista - Performing semantic search with term: "${term}"`);
      // semanticSearch now returns items with 50%+ similarity and properly processed images
      let results = await semanticSearch(term.trim());
      
      if (results && results.length > 0) {
        console.log(`Vista - Found ${results.length} results for search: "${term}" (50%+ similarity)`);
        setContentItems(results);
        setShowingSearchResults(true);
        
        // Save search results to cache
        SearchCache.save({
          results,
          query: term,
          timestamp: Date.now(),
          showingSearchResults: true
        });
        
        toast.success(`Found ${results.length} relevant items (50%+ similarity)`, { duration: 3000 });
      } else {
        console.log(`Vista - No results found for search: "${term}"`);
        setContentItems([]);
        setShowingSearchResults(true);
        toast.warning(`No content found with 50%+ relevance for "${term}". Try different keywords.`, { duration: 5000 });
      }
    } catch (error) {
      console.error("Vista - Search error:", error);
      toast.error("Error performing search");
    } finally {
      setLoading(false);
    }
  };

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/vista?search=${encodeURIComponent(searchQuery)}`);
    performSearch(searchQuery);
  };

  // Handle "View All" button click
  const handleViewAll = () => {
    setContentItems(allContentItems);
    setShowingSearchResults(false);
    setSearchQuery("");
    
    // Clear the search state but keep on same page
    navigate('/vista', { replace: true });
    
    // Clear search cache when viewing all content
    SearchCache.clear();
  };

  // Get sorted content items - make sure the sort is applied directly before rendering
  const getSortedItems = () => {
    // If showing search results, sort by similarity
    if (showingSearchResults) {
      const sorted = [...contentItems].sort((a, b) => {
        if (a.similarity !== undefined && b.similarity !== undefined) {
          return b.similarity - a.similarity;
        }
        if (a.similarity !== undefined) return -1;
        if (b.similarity !== undefined) return 1;
        return a.title?.localeCompare(b.title || '') || 0;
      });
      return sorted;
    }

    // If not showing search results, sort by date
    return [...contentItems].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
      const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  };

  const sortedItems = getSortedItems();
  console.log(`Vista page rendering with ${sortedItems.length} content items, loading = ${loading}`);

  return (
    <div className="min-h-screen flex flex-col bg-beige-100 dark:bg-gray-900">
      <Header />
      
      <main className="flex-1 container py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Content Vista</h1>
          
          {searchPurpose && showingSearchResults ? (
            <p className="text-gray-600 dark:text-gray-400">
              Content for: <span className="italic">"{searchPurpose}"</span>
            </p>
          ) : searchParams.get("search") ? (
            <p className="text-gray-600 dark:text-gray-400">
              Search results for "{searchParams.get("search")}"
            </p>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              Browse all content
            </p>
          )}
        </div>
        
        <Card className="mb-8">
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                type="text"
                placeholder="Search content..."
                className="flex-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" className="bg-amber-500 hover:bg-amber-600">
                Search
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Search result controls */}
        <div className="mb-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {showingSearchResults && sortedItems.length > 0 ? (
              <span>Showing {sortedItems.length} relevant results sorted by relevance</span>
            ) : showingSearchResults && sortedItems.length === 0 ? (
              <span>No relevant content found for your search</span>
            ) : (
              <span>Showing all content items</span>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Searching for relevant content...</p>
          </div>
        ) : sortedItems.length > 0 ? (
          <div className="flex flex-col gap-6">
            {sortedItems.map((item, index) => (
              <div key={item.id} className="block group">
                <ContentDisplayItem 
                  content={item} 
                  index={index}
                />
              </div>
            ))}
          </div>
        ) : showingSearchResults ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-xl text-gray-500 mb-4">No relevant content found.</p>
            <p className="text-gray-400 mb-6">
              Try adjusting your search term or exploring our general content.
            </p>
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-xl text-gray-500 mb-4">No content items available.</p>
          </div>
        )}
        
        {/* View All Content button moved to bottom of page */}
        {(showingSearchResults || searchParams.get("search")) && (
          <div className="text-center mt-12 pt-6 border-t border-gray-200">
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Want to explore all content?
            </p>
            <Button 
              onClick={handleViewAll} 
              variant="outline"
              className="mx-auto"
            >
              View All Content
            </Button>
          </div>
        )}
        
        {/* About page link */}
        <div className="mt-12 text-center border-t pt-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Want to explore all our content in detail?</p>
          <Button 
            asChild
            variant="secondary"
          >
            <Link to="/about">Visit Our About Page</Link>
          </Button>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Vista;
