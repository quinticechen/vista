import { useState, useEffect } from "react";
import { useParams, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import PersonalHeader from "@//PersonalHeader";
import PersonalFooter from "@//PersonalFooter";
import { Button } from "@//ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ContentDisplayItem } from "@/components/ContentDisplay";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ContentSorter, SortOption } from "@/components/ContentSorter"; // Ensure ContentSorter is updated to include 'relevance'
import { toast } from "@/components/ui/sonner";
import { getProfileByUrlParam, getUserContentItems, getUserContentByUrlParam } from "@/services/urlParamService";
import { semanticSearch } from "@/services/adminService";
import { ContentItem } from "@/services/adminService";
import { processNotionContent } from "@/utils/notionContentProcessor";
import { Loader2 } from "lucide-react";
import { SearchCache } from "@/utils/searchCache";
import SEOHead from "@/components/SEOHead";
const vistaLogo = "/public/og-image.png";

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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  // Default sort option is now 'relevance' if there's a search query, otherwise 'newest'
  const initialSortOption: SortOption = searchParams.get("search") ? 'relevance' : 'newest';
  const [sortOption, setSortOption] = useState<SortOption>(initialSortOption);
  
  // Home page settings state for SEO
  const [homePageSettings, setHomePageSettings] = useState<any>(null);

  // Generate SEO data for URL param vista page
  const generateSEOData = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const canonicalUrl = `${baseUrl}/${urlParam}/vista`;
    // Use searchPurpose from state if available, otherwise fallback to URL search param
    const searchTerm = location.state?.purpose || searchParams.get("search") || searchPurpose;
    
    const websiteName = homePageSettings?.footerName || urlParam;
    const authorDescription = homePageSettings?.heroSubtitle || "Discover amazing content and insights";
    
    if (searchTerm) {
      return {
        title: `Search Results for "${searchTerm}" - ${websiteName}'s Content`,
        description: `Browse content and articles related to "${searchTerm}" from ${websiteName}. Find relevant insights and information.`,
        keywords: ['search results', searchTerm, 'content discovery', 'articles', 'insights'],
        canonicalUrl: `${canonicalUrl}?search=${encodeURIComponent(searchTerm)}`,
        ogImage: '/og-image.png',
        structuredData: {
          "@context": "https://schema.org",
          "@type": "SearchResultsPage",
          "name": `Search Results for "${searchTerm}"`,
          "url": canonicalUrl,
          "mainEntity": {
            "@type": "ItemList",
            "numberOfItems": items.length
          }
        }
      };
    }
    
    return {
      title: websiteName || 'Content Library',
      description: authorDescription,
      keywords: ['content library', 'articles', 'insights', 'browse content', 'curated resources'],
      canonicalUrl,
      ogImage: '/og-image.png',
      structuredData: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": `${websiteName}'s Content Library`,
        "url": canonicalUrl,
        "description": authorDescription
      }
    };
  };
  
  // Check if we have search results from navigation state (from PurposeInput)
  const searchResultsFromState = location.state?.searchResults as ContentItem[] | undefined;
  const searchPurposeFromState = location.state?.purpose as string | undefined;
  const searchTimestamp = location.state?.searchQuery; // This might be the original query used in PurposeInput

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
        
        // Fetch home page settings for SEO
        try {
          const { getHomePageSettingsByUrlParam } = await import('@/services/homePageService');
          const settings = await getHomePageSettingsByUrlParam(urlParam);
          setHomePageSettings(settings);
        } catch (error) {
          console.error('Error fetching home page settings:', error);
        }
        
        // Load all content items for this user (for "View All" functionality)
        console.log(`UrlParamVista - Loading all content items for URL parameter: ${urlParam}`);
        let userContent = await getUserContentByUrlParam(urlParam);
        console.log('Raw content loaded:', userContent);
        
        // Apply consistent processing pipeline
        userContent = processContentItems(userContent);
        setAllContentItems(userContent);
        
        // Determine initial search state
        const initialSearchQuery = searchParams.get("search") || searchPurposeFromState || "";
        setSearchQuery(initialSearchQuery); // Set search input value

        // Check for cached search results first
        const cachedSearch = SearchCache.load(urlParam);
        if (cachedSearch && SearchCache.isValid(cachedSearch)) {
          console.log(`UrlParamVista - Restoring cached search: ${cachedSearch.results.length} results for "${cachedSearch.query}"`);
          
          // Filter cached results to only include items from this user
          const userIdsSet = new Set(userContent.map((item: ContentItem) => item.id));
          const filteredCachedResults = cachedSearch.results.filter((item: ContentItem) => userIdsSet.has(item.id));
          
          setItems(filteredCachedResults);
          setShowingSearchResults(true);
          setSortOption('relevance'); // Default to relevance for cached search
          
          if (cachedSearch.purpose) {
            toast.success(`Restored search results for: "${cachedSearch.purpose}"`, { duration: 3000 });
          }
        } else if (searchResultsFromState && searchResultsFromState.length > 0) {
          console.log(`UrlParamVista - Displaying ${searchResultsFromState.length} search results from PurposeInput for query: "${searchPurposeFromState}"`);
          
          // Apply same processing pipeline to search results
          const processedSearchResults = processContentItems(searchResultsFromState);
          
          // Filter search results to only include items from this user
          const userIdsSet = new Set(userContent.map((item: ContentItem) => item.id));
          const filteredResults = processedSearchResults.filter((item: ContentItem) => userIdsSet.has(item.id));
          
          // Set items state for display
          setItems(filteredResults);
          setShowingSearchResults(true);
          setSortOption('relevance'); // Default to relevance for results from state
          
          if (searchPurposeFromState) {
            // Save to cache for future navigation
            SearchCache.save({
              results: filteredResults,
              query: searchPurposeFromState,
              timestamp: Date.now(),
              showingSearchResults: true,
              purpose: searchPurposeFromState
            }, urlParam);
            
            if (filteredResults.length === 0) {
              toast.warning(`No content found with 50%+ relevance for "${searchPurposeFromState}". Try different keywords.`, { duration: 5000 });
            } else {
              toast.success(`Found ${filteredResults.length} relevant items (50%+ similarity)`, { duration: 5000 });
            }
          }
        } else if (initialSearchQuery) { // If there's a search term in URL params or from state, perform search
          await performSearch(initialSearchQuery);
        } else {
          // Default: show all processed content
          setItems(userContent);
          setShowingSearchResults(false);
          setSortOption('newest'); // Default sort for non-search view
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
          sessionStorage.setItem(`vista-${urlParam}-search-purpose`, searchPurposeFromState || '');
          sessionStorage.setItem(`vista-${urlParam}-sort-option`, sortOption); // Save sort option
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
        const savedSortOption = sessionStorage.getItem(`vista-${urlParam}-sort-option`) as SortOption | null;
        
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
            if (savedSortOption && ['relevance', 'newest', 'oldest', 'popular'].includes(savedSortOption)) {
              setSortOption(savedSortOption);
            }
          }
        }
      } catch (e) {
        console.error("UrlParamVista - Error loading view state from sessionStorage:", e);
      }
    };
    
    // Only load from session storage if no initial search results from state or URL
    if (!searchResultsFromState && !searchParams.get("search") && !searchPurposeFromState) {
      loadViewState();
    }

    window.addEventListener('beforeunload', saveViewState);
    
    return () => {
      window.removeEventListener('beforeunload', saveViewState);
    };
  }, [urlParam, searchResultsFromState, searchPurposeFromState, searchTimestamp, navigate, searchParams, sortOption]); // Added sortOption to dependencies

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
        let userContent = await getUserContentByUrlParam(urlParam || "");
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
      setSortOption('relevance'); // Always default to relevance after a new search
      
      // Save search results to cache
      SearchCache.save({
        results: filteredResults,
        query: term,
        timestamp: Date.now(),
        showingSearchResults: true,
        purpose: term // Use the search term as the purpose for the cache
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
    setSelectedCategories([]);
    setSortOption('newest'); // Reset sort to 'newest' when viewing all
    
    // Clear search cache when viewing all content
    SearchCache.clear(urlParam);
    
    // Navigate without search params to ensure URL is clean
    // Use replace to avoid adding this "view all" state to history if it came from search
    navigate(`/${urlParam}/vista`, { replace: true });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Update URL and trigger search
    navigate(`/${urlParam}/vista?search=${encodeURIComponent(searchQuery)}`);
    performSearch(searchQuery);
  };

  const handleClearSearch = () => {
    loadAllItems();
  };

  // Handle category filter changes
  const handleCategoryChange = (categories: string[]) => {
    setSelectedCategories(categories);
  };

  // Handle sort changes
  const handleSortChange = (sort: SortOption) => {
    setSortOption(sort);
    // Update URL to reflect the new sort option if it's not the default relevance for search results
    if (showingSearchResults && sort === 'relevance') {
        // Keep the URL as is for relevance, it's the default for search
        return;
    }
    // If we are showing search results and the user selects a different sort option, update the URL
    if (showingSearchResults) {
        const currentSearchParams = new URLSearchParams(searchParams);
        currentSearchParams.set('sort', sort);
        navigate(`/${urlParam}/vista?${currentSearchParams.toString()}`, { replace: true });
    } else {
        // If not showing search results, just update the sort option state
        navigate(`/${urlParam}/vista`, { replace: true }); // Remove any existing search params if we are clearing search
    }
  };

  const getFilteredAndSortedItems = () => {
    let filteredItems = items;
    
    // Apply category filter - show items that match ANY selected category (OR logic)
    if (selectedCategories.length > 0) {
      filteredItems = items.filter(item => {
        const itemCategory = item.category || 'Uncategorized';
        return selectedCategories.includes(itemCategory);
      });
    }
    
    // Apply sorting
    const sortedItems = [...filteredItems].sort((a, b) => {
      // Explicitly handle 'relevance' sort
      if (sortOption === 'relevance') {
        // Ensure both items have similarity scores for relevance sorting
        // If one has similarity and the other doesn't, prioritize the one with similarity.
        if (a.similarity !== undefined && b.similarity === undefined) return -1;
        if (a.similarity === undefined && b.similarity !== undefined) return 1;
        // If both have similarity, sort by it descendingly
        if (a.similarity !== undefined && b.similarity !== undefined) {
          return b.similarity - a.similarity;
        }
        // If neither has similarity, fall back to date (newest first)
        const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
        const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      }

      // Handle 'newest' sort:
      // If showing search results, "newest" means "relevance then newest date".
      // If not showing search results, it's just newest date.
      if (sortOption === 'newest') {
        if (showingSearchResults) {
          // Prioritize similarity first, then date
          const similarityDiff = (b.similarity ?? 0) - (a.similarity ?? 0);
          if (Math.abs(similarityDiff) > 0.01) { // Only use similarity if there's a meaningful difference
            return similarityDiff;
          }
        }
        // Fallback to date sorting (newest first)
        const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
        const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      }
      
      // Handle 'oldest' sort
      if (sortOption === 'oldest') {
        const oldDateA = a.created_at ? new Date(a.created_at) : new Date(0);
        const oldDateB = b.created_at ? new Date(b.created_at) : new Date(0);
        return oldDateA.getTime() - oldDateB.getTime();
      }
      
      // Handle 'popular' sort
      if (sortOption === 'popular') {
        const visitorA = (a as any).visitor_count || 0;
        const visitorB = (b as any).visitor_count || 0;
        return visitorB - visitorA;
      }
      
      // Default case (should not be reached if all options are handled)
      return 0;
    });
    
    return sortedItems;
  };

  const sortedItems = getFilteredAndSortedItems();
  console.log(`UrlParamVista rendering with ${sortedItems.length} items, isLoading=${isLoading}, sortOption=${sortOption}`);

  const seoData = generateSEOData();

  return (
    <div className="min-h-screen bg-beige-100 dark:bg-gray-900">
      <SEOHead {...seoData} />
      <PersonalHeader />
      
      <main className="container py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {urlParam ? `${urlParam}'s Content` : "All Content on Vista"}
          </h1>
          
          {/* Conditional heading for search results */}
          {showingSearchResults && searchPurposeFromState && (
            <p className="text-2xl font-semibold mb-2 text-gray-700 dark:text-gray-300">
              Content for: <span className="italic">"{searchPurposeFromState}"</span>
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
              <span>Showing {sortedItems.length} relevant results{selectedCategories.length > 0 && ` in ${selectedCategories.length} categories`} sorted by {sortOption === 'relevance' ? 'relevance' : sortOption === 'newest' ? 'relevance & date' : sortOption === 'oldest' ? 'oldest first' : 'popularity'}</span>
            ) : showingSearchResults && sortedItems.length === 0 ? (
              <span>No relevant content found for your search{selectedCategories.length > 0 && ` in selected categories`}</span>
            ) : (
              <span>Showing {sortedItems.length} content items{selectedCategories.length > 0 && ` in ${selectedCategories.length} categories`}</span>
            )}
          </div>
        </div>
        
        {/* Category Filter and Content Sorter */}
        <div className="space-y-4">
          {/* Only show CategoryFilter if there are items to filter */}
          {items.length > 0 && (
            <CategoryFilter
              items={items}
              selectedCategories={selectedCategories}
              onCategoryChange={handleCategoryChange}
            />
          )}
          
          <ContentSorter
            selectedSort={sortOption}
            onSortChange={handleSortChange}
            itemCount={sortedItems.length}
          />
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              {showingSearchResults ? "Searching for content..." : "Loading content..."}
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
      
      <PersonalFooter userLanguage={ownerProfile?.default_language} 
              supportedLanguages={ownerProfile?.supported_ai_languages} />
    </div>
  );
};

export default UrlParamVista;
