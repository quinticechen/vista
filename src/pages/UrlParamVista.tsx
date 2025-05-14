
import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
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

const UrlParamVista = () => {
  const { urlParam } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [items, setItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);

  // Get initial search term from URL
  useEffect(() => {
    const searchTerm = searchParams.get("search");
    if (searchTerm) {
      setSearchQuery(searchTerm);
      performSearch(searchTerm);
    } else {
      loadAllItems();
    }

    // Load owner profile
    if (urlParam) {
      loadOwnerProfile();
    }
  }, [searchParams, urlParam]);

  const loadOwnerProfile = async () => {
    if (!urlParam) return;
    
    try {
      const profile = await getProfileByUrlParam(urlParam);
      
      if (!profile) {
        toast.error(`The page for /${urlParam} does not exist.`);
        navigate('/');
        return;
      }
      
      setOwnerProfile(profile);
      
      // When profile is loaded, fetch all their content items if no search term
      if (!searchParams.get("search")) {
        loadAllItems();
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Error loading profile data");
    }
  };

  const loadAllItems = async () => {
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

      // Get all content for this user
      const userId = ownerProfile?.id;
      if (!userId) {
        setIsLoading(false);
        return;
      }

      const contentItems = await getUserContentItems(userId);
      setItems(contentItems);
    } catch (error) {
      console.error("Error loading items:", error);
      toast.error("Error loading content items");
    } finally {
      setIsLoading(false);
    }
  };

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

      // First get all content for this user
      const userContent = await getUserContentItems(userId);
      
      // If we have user content, perform a semantic search
      if (userContent && userContent.length > 0) {
        try {
          const searchResults = await semanticSearch(term);
          
          // Filter search results to only include items from this user
          const userIds = new Set(userContent.map(item => item.id));
          const filteredResults = searchResults.filter(item => userIds.has(item.id));
          
          setItems(filteredResults);
        } catch (error) {
          console.error("Semantic search error:", error);
          toast.error("Error performing semantic search");
          
          // Fall back to showing all user content if search fails
          setItems(userContent);
        }
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Error performing search");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/${urlParam}/vista?search=${encodeURIComponent(searchQuery)}`);
    performSearch(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    navigate(`/${urlParam}/vista`);
    loadAllItems();
  };

  const sortedItems = [...items].sort((a, b) => {
    // First sort by similarity if present (for search results)
    if (a.similarity !== undefined && b.similarity !== undefined) {
      return b.similarity - a.similarity;
    }
    
    // Then sort by date
    const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
    const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="container py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {urlParam ? `${urlParam}'s Content` : "Content Vista"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {searchParams.get("search") 
              ? `Search results for "${searchParams.get("search")}"` 
              : "Browse all content"}
          </p>
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
              {searchParams.get("search") && (
                <Button type="button" variant="outline" onClick={handleClearSearch}>
                  Clear
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
        
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Searching for content...
            </p>
          </div>
        ) : sortedItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedItems.map((item) => (
              <div key={item.id} className="block group">
                <ContentDisplayItem 
                  content={item} 
                  urlPrefix={`/${urlParam}/vista`}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {searchParams.get("search") 
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
      
      <Footer />
    </div>
  );
};

export default UrlParamVista;
