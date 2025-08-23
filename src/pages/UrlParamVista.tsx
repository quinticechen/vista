import { useState, useEffect } from "react";
import { useParams, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ContentDisplayItem } from "@/components/ContentDisplay";
import { toast } from "@/components/ui/sonner";
import { getProfileByUrlParam, getUserContentItems } from "@/services/urlParamService";
import { semanticSearch } from "@/services/adminService";
import { ContentItem } from "@/services/adminService";
import { processNotionContent } from "@/utils/notionContentProcessor";
import { Loader2 } from "lucide-react";
import { SearchCache } from "@/utils/searchCache";

const UrlParamVista = () => {
  const { urlParam } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [items, setItems] = useState<ContentItem[]>([]);
  const [allContentItems, setAllContentItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [showingSearchResults, setShowingSearchResults] = useState(false);
  
  // Check if we have search results from navigation state (from PurposeInput)
  const searchResults = location.state?.searchResults as ContentItem[] | undefined;
  const searchPurpose = location.state?.purpose as string | undefined;
  const searchTimestamp = location.state?.searchQuery;

  // Centralized content processing function to ensure consistency
  const processContentItem = (item: ContentItem): ContentItem => {
    console.log(`UrlParamVista - Processing content item ${item.id}: ${item.title}`);
    
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
    
    console.log(`UrlParamVista - After processing: orientation=${processed.orientation}, cover_image=${!!processed.cover_image}, preview_image=${!!processed.preview_image}`);
    return processed;
  };

  // Centralized content filtering function
  const filterActiveContent = (items: ContentItem[]): ContentItem[] => {
    return items.filter(item => item.notion_page_status !== 'removed');
  };

  // Centralized content processing pipeline
  const processContentItems = (items: ContentItem[]): ContentItem[] => {
    console.log(`UrlParamVista - Processing ${items.length} content items`);
    const filtered = filterActiveContent(items);
    const processed = filtered.map(processContentItem);
    console.log(`UrlParamVista - Processed ${processed.length} items after filtering`);
    return processed;
  };
  
  // Get initial search term from URL or navigation state
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        console.log("UrlParamVista - Loading data for UrlParamVista - Start");
        
        // Load owner profile first
        if (!urlParam) {
          navigate('/');
          return;
        }
        
        console.log(`UrlParamVista - Loading owner profile for URL parameter: ${urlParam}`);
        const profile = await getProfileByUrlParam(urlParam);
        
        if (!profile) {
          toast.error(`The page for /${urlParam} does not exist.`);
          navigate('/');
          return;
        }
        
        setOwnerProfile(profile);
        
        // Load all content items for this user (for "View All" functionality)
        const userId = profile.id;
        console.log(`UrlParamVista - Loading all content items for user ID: ${userId}`);
        let userContent = await getUserContentItems(userId);
        console.log('Raw content loaded:', userContent);
        
        // Apply consistent processing pipeline
        userContent = processContentItems(userContent);
        setAllContentItems(userContent);
        
        // Check for cached search results first
        const cachedSearch = SearchCache.load(urlParam);
        if (cachedSearch && SearchCache.isValid(cachedSearch)) {
          console.log(`UrlParamVista - Restoring cached search: ${cachedSearch.results.length} results for "${cachedSearch.query}"`);
          
          // Filter cached results to only include items from this user
          const userIdsSet = new Set(userContent.map((item: ContentItem) => item.id));
          const filteredCachedResults = cachedSearch.results.filter((item: ContentItem) => userIdsSet.has(item.id));
          
          setItems(filteredCachedResults);
          setShowingSearchResults(true);
          setSearchQuery(cachedSearch.query);
          
          if (cachedSearch.purpose) {
            toast.success(`Restored search results for: "${cachedSearch.purpose}"`, { duration: 3000 });
          }
        } else if (searchResults && searchResults.length > 0) {
          console.log(`UrlParamVista - Displaying ${searchResults.length} search results from PurposeInput for query: "${searchPurpose}"`);
          
          // Apply same processing pipeline to search results
          const processedSearchResults = processContentItems(searchResults);
          
          // Filter search results to only include items from this user
          const userIdsSet = new Set(userContent.map((item: ContentItem) => item.id));
          const filteredResults = processedSearchResults.filter((item: ContentItem) => userIdsSet.has(item.id));
          
          // Set items state for display
          setItems(filteredResults);
          setShowingSearchResults(true);
          
          if (searchPurpose) {
            // Save to cache for future navigation
            SearchCache.save({
              results: filteredResults,
              query: searchPurpose,
              timestamp: Date.now(),
              showingSearchResults: true,
              purpose: searchPurpose
            }, urlParam);
            
            if (filteredResults.length === 0) {
              toast.warning(`No content found with 50%+ relevance for "${searchPurpose}". Try different keywords.`, { duration: 5000 });
            } else {
              toast.success(`Found ${filteredResults.length} relevant items (50%+ similarity)`, { duration: 5000 });
            }
          }
        } else if (searchParams.get("search")) {
          // If we have a search term in URL params
          await performSearch(searchParams.get("search") || "");
        } else {
          // Default: show all processed content
          setItems(userContent);
          setShowingSearchResults(false);
        }
        
        console.log("UrlParamVista - Loading data for UrlParamVista - Complete");
      } catch (error) {
        console.error("UrlParamVista - Error loading data:", error);
        toast.error("Error loading content");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
    
    // Use sessionStorage to store the current search state
    const saveViewState = () => {
      if (items.length > 0) {
        try {
          sessionStorage.setItem(`vista-${urlParam}-items`, JSON.stringify(items));
          sessionStorage.setItem(`vista-${urlParam}-showing-search`, String(showingSearchResults));
          sessionStorage.setItem(`vista-${urlParam}-search-query`, searchQuery);
          sessionStorage.setItem(`vista-${urlParam}-search-purpose`, searchPurpose || '');
        } catch (e) {
          console.error("UrlParamVista - Error saving view state to sessionStorage:", e);
        }
      }
    };
    
    // Load the saved state on mount if available
    const loadViewState = () => {
      try {
        const savedItems = sessionStorage.getItem(`vista-${urlParam}-items`);
        const savedShowingSearch = sessionStorage.getItem(`vista-${urlParam}-showing-search`);
        const savedSearchQuery = sessionStorage.getItem(`vista-${urlParam}-search-query`);
        const savedSearchPurpose = sessionStorage.getItem(`vista-${urlParam}-search-purpose`);
        
        if (savedItems) {
          const parsedItems = JSON.parse(savedItems);
          if (parsedItems.length > 0) {
            console.log("UrlParamVista - Restored items from session storage:", parsedItems.length);
            setItems(parsedItems);
            
            if (savedShowingSearch === 'true') {
              setShowingSearchResults(true);
              console.log(`UrlParamVista - Restored search results view with query: ${savedSearchQuery || savedSearchPurpose}`);
            }
            
            if (savedSearchQuery) {
              setSearchQuery(savedSearchQuery);
            }
          }
        }
      } catch (e) {
        console.error("UrlParamVista - Error loading view state from sessionStorage:", e);
      }
    };
    
    // Initialize from session storage if we have it
    window.addEventListener('beforeunload', saveViewState);
    
    // Only load from session storage if we're not already getting results from location state
    if (!searchResults && !searchParams.get("search")) {
      loadViewState();
    }
    
    return () => {
      window.removeEventListener('beforeunload', saveViewState);
    };
  }, [urlParam, searchResults, searchPurpose, searchTimestamp, navigate, searchParams]);

  const performSearch = async (term: string) => {
    if (!term.trim()) {
      loadAllItems();
      return;
    }

    setIsLoading(true);
    console.log("UrlParamVista - Starting search on UrlParamVista page");
    try {
      if (!ownerProfile) {
        const profile = await getProfileByUrlParam(urlParam || "");
        if (!profile) {
          toast.error("Could not find the user profile");
          setIsLoading(false);
          return;
        }
        setOwnerProfile(profile);
      }

      // Get the user ID
      const userId = ownerProfile?.id;
      if (!userId) {
        setIsLoading(false);
        return;
      }

      // First get all content for this user if we don't have it yet
      if (allContentItems.length === 0) {
        let userContent = await getUserContentItems(userId);
        // Apply consistent processing pipeline
        userContent = processContentItems(userContent);
        setAllContentItems(userContent);
      }
      
      // Perform semantic search - this now returns items with 50%+ similarity
      console.log(`UrlParamVista - Performing semantic search with term: "${term}"`);
      let searchResults = await semanticSearch(term);
      
      console.log(`UrlParamVista - Search returned ${searchResults.length} results (50%+ similarity)`, searchResults);
      
      // Filter search results to only include items from this user
      const userIdsSet = new Set(allContentItems.map(item => item.id));
      const filteredResults = searchResults.filter(item => userIdsSet.has(item.id));
      
      console.log(`UrlParamVista - Found ${filteredResults.length} matching results from user's content`);
      setItems(filteredResults);
      setShowingSearchResults(true);
      
      // Save search results to cache
      SearchCache.save({
        results: filteredResults,
        query: term,
        timestamp: Date.now(),
        showingSearchResults: true
      }, urlParam);
      
      if (filteredResults.length === 0) {
        toast.warning(`No content found with 50%+ relevance for "${term}". Try different keywords.`, { duration: 5000 });
      } else {
        toast.success(`Found ${filteredResults.length} relevant items (50%+ similarity)`, { duration: 3000 });
      }
    } catch (error) {
      console.error("UrlParamVista - Search error:", error);
      toast.error("Error performing search");
      
      // Fall back to showing all user content if search fails
      loadAllItems();
    } finally {
      setIsLoading(false);
      console.log("UrlParamVista - Search complete on UrlParamVista page");
    }
  };

  const loadAllItems = () => {
    console.log("UrlParamVista - Loading all items in UrlParamVista");
    setItems(allContentItems);
    setShowingSearchResults(false);
    setSearchQuery("");
    navigate(`/${urlParam}/vista`, { replace: true });
    
    // Clear search cache when viewing all content
    SearchCache.clear(urlParam);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/${urlParam}/vista?search=${encodeURIComponent(searchQuery)}`);
    performSearch(searchQuery);
  };

  const handleClearSearch = () => {
    loadAllItems();
  };

  // Get sorted content items
  const getSortedItems = () => {
    // If showing search results, sort by similarity
    if (showingSearchResults) {
      return [...items].sort((a, b) => {
        if (a.similarity !== undefined && b.similarity !== undefined) {
          return b.similarity - a.similarity;
        }
        if (a.similarity !== undefined) return -1;
        if (b.similarity !== undefined) return 1;
        
        // Fall back to date sorting if similarity isn't available
        const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
        const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
    }

    // If not showing search results, sort by date
    return [...items].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
      const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  };

  const sortedItems = getSortedItems();
  console.log(`UrlParamVista rendering with ${sortedItems.length} items, isLoading=${isLoading}`);

  return (
    <div className="min-h-screen bg-beige-100 dark:bg-gray-900">
      <Header />
      
      <main className="container py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {urlParam ? `${urlParam}'s Content` : "Content Vista"}
          </h1>
          
          {searchPurpose && showingSearchResults ? (
            <p className="text-3xl font-bold mb-2">
              Content for: <span className="italic">"{searchPurpose}"</span>
            </p>
          ) : searchParams.get("search") ? (
            <p className="text-3xl font-bold mb-2">
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
              <span>Showing {sortedItems.length} content items</span>
            )}
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Searching for content...
            </p>
          </div>
        ) : sortedItems.length > 0 ? (
          <div className="flex flex-col gap-6">
            {sortedItems.map((item, index) => (
              <div key={item.id} className="group">
                <ContentDisplayItem
                  content={item}
                  urlPrefix={`/${urlParam}`}
                  index={index}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {showingSearchResults
                ? "No matching content found" 
                : "No content available"}
            </p>
          </div>
        )}
        
        {/* View All Content button moved to bottom of page */}
        {(showingSearchResults || searchParams.get("search")) && (
          <div className="text-center mt-12 pt-6 border-t border-gray-200">
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Want to explore all content?
            </p>
            <Button 
              onClick={handleClearSearch} 
              variant="outline"
              className="mx-auto"
            >
              View All Content
            </Button>
          </div>
        )}
      </main>
      
      <Footer userLanguage={ownerProfile?.default_language} 
              supportedLanguages={ownerProfile?.supported_ai_languages} />
    </div>
  );
};

export default UrlParamVista;
