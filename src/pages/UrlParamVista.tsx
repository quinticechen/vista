
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

  // Function to normalize content - ensure arrays and parsed JSON
  const normalizeContent = (item: ContentItem): ContentItem => {
    const normalized = { ...item };
    
    // If content is a string, try to parse it
    if (normalized.content && typeof normalized.content === 'string') {
      try {
        normalized.content = JSON.parse(normalized.content);
      } catch (e) {
        console.error(`Error parsing content for ${item.id}:`, e);
      }
    }
    
    // If it's not an array at this point, make it an empty array
    if (!Array.isArray(normalized.content)) {
      normalized.content = [];
    }
    
    return normalized;
  };

  // Function to thoroughly process content to ensure all properties are detected
  const deepProcessContent = (item: ContentItem): ContentItem => {
    console.log(`Deep processing content for ${item.id}: ${item.title}`);
    
    // First process with the standard processor
    const processed = processNotionContent(item);
    
    // Then normalize to ensure proper structure
    const normalized = normalizeContent(processed);
    
    // Log after processing
    console.log(`Content structure after processing:`, normalized.content);
    
    return normalized;
  };
  
  // Get initial search term from URL or navigation state
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        console.log("Loading data for UrlParamVista - Start");
        
        // Load owner profile first
        if (!urlParam) {
          navigate('/');
          return;
        }
        
        console.log(`Loading owner profile for URL parameter: ${urlParam}`);
        const profile = await getProfileByUrlParam(urlParam);
        
        if (!profile) {
          toast.error(`The page for /${urlParam} does not exist.`);
          navigate('/');
          return;
        }
        
        setOwnerProfile(profile);
        
        // Load all content items for this user (for "View All" functionality)
        const userId = profile.id;
        console.log(`Loading all content items for user ID: ${userId}`);
        let userContent = await getUserContentItems(userId);
        console.log('Content loaded:', userContent);
        
        // Process each content item to ensure proper orientation detection and media
        userContent = userContent.map((item: ContentItem) => {
          console.log(`Processing item ${item.id}: ${item.title}`);
          const processed = deepProcessContent(item);
          console.log(`After processing: orientation=${processed.orientation}, has cover image=${!!processed.cover_image}`);
          return processed;
        });
        
        // Filter out any removed items - only show active content
        userContent = userContent.filter(item => 
          item.notion_page_status !== 'removed'
        );
        
        setAllContentItems(userContent);
        
        // Check if we have search results from PurposeInput
        if (searchResults && searchResults.length > 0) {
          console.log(`Displaying ${searchResults.length} search results from PurposeInput for query: "${searchPurpose}"`);
          
          // Filter search results to only include items from this user
          const userIdsSet = new Set(userContent.map((item: ContentItem) => item.id));
          let filteredResults = searchResults.filter((item: ContentItem) => userIdsSet.has(item.id));
          
          // Filter out any removed items
          filteredResults = filteredResults.filter(item => item.notion_page_status !== 'removed');
          
          // Process each search result to ensure proper orientation detection and media
          filteredResults = filteredResults.map((item: ContentItem) => {
            console.log(`Processing search result ${item.id}: ${item.title}`);
            // Use deep processing for search results
            const processed = deepProcessContent(item);
            console.log(`After processing search result: orientation=${processed.orientation}, has cover image=${!!processed.cover_image}`);
            return processed;
          });
          
          // Set items state for display
          setItems(filteredResults);
          setShowingSearchResults(true);
          
          if (searchPurpose) {
            toast.success(`Found ${filteredResults.length} relevant items based on your search`, { duration: 5000 });
          }
        } else if (searchPurpose) {
          // If we had a search but it returned no results
          toast.warning(`No matches found for "${searchPurpose}". Showing all content instead.`, { duration: 5000 });
          setItems(userContent);
          setShowingSearchResults(false);
        } else if (searchParams.get("search")) {
          // If we have a search term in URL params
          await performSearch(searchParams.get("search") || "");
        } else {
          // Default: show only active content
          setItems(userContent);
          setShowingSearchResults(false);
        }
        
        console.log("Loading data for UrlParamVista - Complete");
      } catch (error) {
        console.error("Error loading data:", error);
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
          console.error("Error saving view state to sessionStorage:", e);
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
            console.log("Restored items from session storage:", parsedItems.length);
            setItems(parsedItems);
            
            if (savedShowingSearch === 'true') {
              setShowingSearchResults(true);
              console.log(`Restored search results view with query: ${savedSearchQuery || savedSearchPurpose}`);
            }
            
            if (savedSearchQuery) {
              setSearchQuery(savedSearchQuery);
            }
          }
        }
      } catch (e) {
        console.error("Error loading view state from sessionStorage:", e);
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
    console.log("Starting search on UrlParamVista page");
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
        // Filter out removed items
        userContent = userContent.filter(item => item.notion_page_status !== 'removed');
        // Process content items for proper orientation detection
        userContent = userContent.map((item: ContentItem) => deepProcessContent(item));
        setAllContentItems(userContent);
      }
      
      // If we have user content, perform a semantic search
      if (allContentItems.length > 0) {
        try {
          console.log(`Performing semantic search with term: "${term}"`);
          let searchResults = await semanticSearch(term);
          
          // Log search results for debugging
          console.log(`Search returned ${searchResults.length} results (before filtering)`, searchResults);
          
          // Process search results for proper orientation detection and media detection
          searchResults = searchResults.map((item: ContentItem) => {
            console.log(`Processing search result ${item.id}: ${item.title}`);
            const processed = deepProcessContent(item);
            console.log(`After processing search result: orientation=${processed.orientation}, has cover image=${!!processed.cover_image}`);
            return processed;
          });
          
          // Filter search results to only include items from this user and only active items
          const userIdsSet = new Set(allContentItems.map(item => item.id));
          const filteredResults = searchResults.filter(item => {
            const isUserItem = userIdsSet.has(item.id);
            const isActive = item.notion_page_status !== 'removed';
            return isUserItem && isActive;
          });
          
          console.log(`Found ${filteredResults.length} matching results from user's content`);
          setItems(filteredResults);
          setShowingSearchResults(true);
          
          if (filteredResults.length === 0) {
            toast.warning(`No matches found for "${term}". Try different keywords.`, { duration: 5000 });
          }
          
          // Store the search state in session storage
          try {
            sessionStorage.setItem(`vista-${urlParam}-items`, JSON.stringify(filteredResults));
            sessionStorage.setItem(`vista-${urlParam}-showing-search`, 'true');
            sessionStorage.setItem(`vista-${urlParam}-search-query`, term);
          } catch (e) {
            console.error("Error saving search state to sessionStorage:", e);
          }
        } catch (error) {
          console.error("Semantic search error:", error);
          toast.error("Error performing semantic search");
          
          // Fall back to showing all user content if search fails
          loadAllItems();
        }
      } else {
        setItems([]);
        setShowingSearchResults(true);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Error performing search");
    } finally {
      setIsLoading(false);
      console.log("Search complete on UrlParamVista page");
    }
  };

  const loadAllItems = () => {
    console.log("Loading all items in UrlParamVista");
    setItems(allContentItems);
    setShowingSearchResults(false);
    setSearchQuery("");
    navigate(`/${urlParam}/vista`, { replace: true });
    
    // Clear search-specific session storage
    try {
      sessionStorage.setItem(`vista-${urlParam}-showing-search`, 'false');
      sessionStorage.setItem(`vista-${urlParam}-search-query`, '');
      sessionStorage.setItem(`vista-${urlParam}-search-purpose`, '');
    } catch (e) {
      console.error("Error clearing search state in sessionStorage:", e);
    }
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
