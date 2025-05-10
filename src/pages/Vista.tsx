import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ContentDisplayItem } from "@/components/ContentDisplay";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "@/components/ui/sonner";
import { ContentItem } from "@/services/adminService";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Vista = () => {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [allContentItems, setAllContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showingSearchResults, setShowingSearchResults] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Check if we have search results from the navigation state
  const searchResults = location.state?.searchResults as ContentItem[] | undefined;
  const searchPurpose = location.state?.purpose as string | undefined;
  const searchQuery = location.state?.searchQuery; // Used to force re-render

  useEffect(() => {
    console.log("Vista page mounted or search updated");
    const fetchContentItems = async () => {
      try {
        setLoading(true);

        // Always fetch all content items for "View All" functionality
        const { data, error } = await supabase
          .from("content_items")
          .select("*");

        if (error) {
          throw error;
        }

        console.log(`Fetched ${data?.length || 0} content items from the database`);

        // Process the data to match ContentItem interface
        const processedData = (data || []).map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          category: item.category,
          tags: item.tags,
          embedding: item.embedding,
          created_at: item.created_at,
          updated_at: item.updated_at,
          similarity: item.similarity, // Ensure similarity is included
        })) as ContentItem[];

        setAllContentItems(processedData);

        // If we have search results from semantic search, use those
        if (searchResults && searchResults.length > 0) {
          console.log(`Displaying ${searchResults.length} search results for: "${searchPurpose}"`);
          console.log("Displaying search results:", searchResults.map(r => ({
            title: r.title,
            similarity: r.similarity ? Math.round(r.similarity * 100) + '%' : 'N/A'
          })));
          setContentItems(searchResults); // Use the full searchResults
          setShowingSearchResults(true);
          toast.success(
            `Found ${searchResults.length} relevant items based on your search`,
            { duration: 5000 }
          );
        } else if (searchPurpose) {
          // If we had a search but it returned no results, show a message and empty content
          setContentItems([]);
          setShowingSearchResults(true);
          toast.warning(
            `No matches found for "${searchPurpose}". Try a different search.`,
            { duration: 5000 }
          );
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
  }, [searchResults, searchPurpose, searchQuery]); // Include searchQuery to force re-render

  // Handle "View All" button click
  const handleViewAll = () => {
    setContentItems(allContentItems);
    setShowingSearchResults(false);

    // Clear the search state but keep on same page
    navigate('/vista', { replace: true });

    toast.info("Showing all content items", { duration: 3000 });
  };

  // Handle "Back to Search Results" button click
  const handleBackToResults = () => {
    if (searchResults && searchResults.length > 0) {
      setContentItems(searchResults); // Use the full searchResults
      setShowingSearchResults(true);
    }
  };

  // Get sorted content items - make sure the sort is applied directly before rendering
  const getSortedItems = () => {
    // If showing search results, sort by similarity
    if (showingSearchResults) {
      return [...contentItems].sort((a, b) => {
        if (a.similarity !== undefined && b.similarity !== undefined) {
          return b.similarity - a.similarity;
        }
        if (a.similarity !== undefined) return -1;
        if (b.similarity !== undefined) return 1;
        return a.title?.localeCompare(b.title || '') || 0;
      });
    }

    // If not showing search results, just return the content items
    return contentItems;
  };

  const sortedItems = getSortedItems();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <h1 className="text-3xl font-bold mb-6">
          {searchPurpose && showingSearchResults ? (
            <>Content for: <span className="text-beige-700 italic">"{searchPurpose}"</span></>
          ) : (
            "Content Vista"
          )}
        </h1>

        {/* Search result controls */}
        <div className="mb-6 flex justify-between items-center">
          {showingSearchResults && sortedItems.length > 0 ? (
            <div className="text-sm text-beige-600">
              Showing {sortedItems.length} relevant results sorted by relevance
            </div>
          ) : showingSearchResults && sortedItems.length === 0 ? (
            <div className="text-sm text-beige-600">
              No relevant content found for your search
            </div>
          ) : (
            <div className="text-sm text-beige-600">
              Showing all content items
            </div>
          )}

          <div>
            {showingSearchResults ? (
              <Button
                onClick={handleViewAll}
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

        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-beige-600" />
            <p className="mt-4 text-lg text-beige-700">Searching for relevant content...</p>
          </div>
        ) : showingSearchResults ? (
          sortedItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedItems.map((item) => (
                <div key={item.id} className="block group">
                  <ContentDisplayItem
                    content={{
                      ...item,
                      similarityScore: item.similarity !== undefined
                        ? `${Math.round(item.similarity * 100)}% match`
                        : undefined
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-xl text-gray-500 mb-4">No relevant content found.</p>
              <p className="text-gray-400 mb-6">
                Try adjusting your search term or exploring our general content.
              </p>
              <Button onClick={handleViewAll} variant="secondary">
                View All Content
              </Button>
            </div>
          )
        ) : sortedItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedItems.map((item) => (
              <div key={item.id} className="block group">
                <ContentDisplayItem content={item} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-xl text-gray-500 mb-4">No content items available.</p>
          </div>
        )}

        {/* About page link */}
        <div className="mt-12 text-center border-t pt-8">
          <p className="text-beige-600 mb-4">Want to explore all our content in detail?</p>
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