
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

  // Get initial search term from URL or navigation state
  useEffect(() => {
    const loadData = async () => {
      try {
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
        const userContent = await getUserContentItems(userId);
        setAllContentItems(userContent);
        
        // Check if we have search results from PurposeInput
        if (searchResults && searchResults.length > 0) {
          console.log(`Displaying ${searchResults.length} search results from PurposeInput for query: "${searchPurpose}"`);
          
          // Filter search results to only include items from this user
          const userIdsSet = new Set(userContent.map((item: any) => item.id));
          const filteredResults = searchResults.filter((item: any) => userIdsSet.has(item.id));
          
          setItems(filteredResults);
          setShowingSearchResults(true);
          
          if (searchPurpose) {
            toast.success(`Found ${filteredResults.length} relevant items based on your search`, { duration: 5000 });
          }
        } else if (searchPurpose) {
          // If we had a search but it returned no results
          setItems([]);
          setShowingSearchResults(true);
          toast.warning(`No matches found for "${searchPurpose}". Showing all content instead.`, { duration: 5000 });
          setItems(userContent);
        } else if (searchParams.get("search")) {
          // If we have a search term in URL params
          performSearch(searchParams.get("search") || "");
        } else {
          // Default: show all content
          setItems(userContent);
          setShowingSearchResults(false);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Error loading content");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [urlParam, searchResults, searchPurpose, searchTimestamp, navigate, searchParams]);

  const performSearch = async (term: string) => {
    if (!term.trim()) {
      loadAllItems();
      return;
    }

    setIsLoading(true);
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
        const userContent = await getUserContentItems(userId);
        setAllContentItems(userContent);
      }
      
      // If we have user content, perform a semantic search
      if (allContentItems.length > 0) {
        try {
          console.log(`Performing semantic search with term: "${term}"`);
          const searchResults = await semanticSearch(term);
          
          // Filter search results to only include items from this user
          const userIdsSet = new Set(allContentItems.map(item => item.id));
          const filteredResults = searchResults.filter(item => userIdsSet.has(item.id));
          
          console.log(`Found ${filteredResults.length} matching results from user's content`);
          setItems(filteredResults);
          setShowingSearchResults(true);
          
          if (filteredResults.length === 0) {
            toast.warning(`No matches found for "${term}". Try different keywords.`, { duration: 5000 });
          }
        } catch (error) {
          console.error("Semantic search error:", error);
          toast.error("Error performing semantic search");
          
          // Fall back to showing all user content if search fails
          setItems(allContentItems);
          setShowingSearchResults(false);
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
    }
  };

  const loadAllItems = () => {
    setItems(allContentItems);
    setShowingSearchResults(false);
    setSearchQuery("");
    navigate(`/${urlParam}/vista`, { replace: true });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/${urlParam}/vista?search=${encodeURIComponent(searchQuery)}`);
    performSearch(searchQuery);
  };

  const handleClearSearch = () => {
    loadAllItems();
  };

  const handleBackToResults = () => {
    if (searchResults && searchResults.length > 0) {
      // Filter search results to only include items from this user
      const userIdsSet = new Set(allContentItems.map(item => item.id));
      const filteredResults = searchResults.filter(item => userIdsSet.has(item.id));
      
      setItems(filteredResults);
      setShowingSearchResults(true);
    }
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

  return (
    <div className="min-h-screen bg-beige-100 dark:bg-gray-900">
      {/* <Header /> */}
      
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
              {(showingSearchResults || searchParams.get("search")) && (
                <Button type="button" variant="outline" onClick={handleClearSearch}>
                  View All
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
        
        {/* Search result controls */}
        <div className="mb-6 flex justify-between items-center">
          {showingSearchResults && sortedItems.length > 0 ? (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {sortedItems.length} relevant results sorted by relevance
            </div>
          ) : showingSearchResults && sortedItems.length === 0 ? (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              No relevant content found for your search
            </div>
          ) : (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing all content items
            </div>
          )}
          
          <div>
            {showingSearchResults ? (
              <Button 
                onClick={handleClearSearch} 
                variant="outline"
                className="text-sm"
              >
                View All Content
              </Button>
            ) : searchResults && searchResults.length > 0 ? (
              <Button 
                onClick={handleBackToResults} 
                variant="outline"
                className="text-sm"
              >
                Back to Search Results
              </Button>
            ) : null}
          </div>
        </div>
        
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Searching for content...
            </p>
          </div>
        ) : sortedItems.length > 0 ? (
          <div className="flex flex-col gap-6">
            {sortedItems.map((item, index) => (
              <div
                key={item.id}
                className={`group ${
                  item.mediaUrl
                    ? index % 2 === 0
                      ? "flex flex-row h-[400px]" // Media on the right
                      : "flex flex-row-reverse h-[400px]" // Media on the left
                    : "flex flex-col" // No media
                }`}
              >
                <ContentDisplayItem
                  content={item}
                  urlPrefix={`/${urlParam}/vista`}
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
            <Button 
              onClick={handleClearSearch} 
              variant="outline"
              className="mt-4"
            >
              View all content
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
