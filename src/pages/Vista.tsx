
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ContentDisplayItem } from "@/components/ContentDisplay";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "@/components/ui/sonner";
import { ContentItem } from "@/services/adminService";
import { Loader2 } from "lucide-react";

const Vista = () => {
  const [contentItems, setContentItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  
  // Check if we have search results from the navigation state
  const searchResults = location.state?.searchResults as ContentItem[] | undefined;
  const searchPurpose = location.state?.purpose as string | undefined;
  const searchQuery = location.state?.searchQuery; // Used to force re-render

  useEffect(() => {
    console.log("Vista page mounted or search updated");
    const fetchContentItems = async () => {
      try {
        setLoading(true);
        
        // If we have search results from semantic search, use those
        if (searchResults && searchResults.length > 0) {
          console.log(`Displaying ${searchResults.length} search results for: "${searchPurpose}"`);
          console.log("First few results:", searchResults.slice(0, 3).map(r => ({
            title: r.title,
            similarity: r.similarity ? Math.round(r.similarity * 100) + '%' : 'N/A',
            id: r.id
          })));
          
          setContentItems(searchResults);
          
          toast.success(
            `Found ${searchResults.length} relevant items based on your purpose`,
            { duration: 5000 }
          );
        } else {
          console.log("No search results provided, fetching all content items");
          // Otherwise, fall back to fetching all content items
          const { data, error } = await supabase
            .from("content_items")
            .select("*");

          if (error) {
            throw error;
          }

          console.log(`Fetched ${data?.length || 0} content items from the database`);
          setContentItems(data || []);
          
          // If we had a search but it returned no results, show a message
          if (searchPurpose) {
            toast.warning(
              `No matches found for "${searchPurpose}". Showing all content instead.`,
              { duration: 5000 }
            );
          }
        }
      } catch (error) {
        console.error("Error fetching content:", error);
        toast.error("Failed to load content items");
      } finally {
        setLoading(false);
      }
    };

    fetchContentItems();
  }, [searchResults, searchPurpose, searchQuery]); // Add searchQuery to dependencies to force re-render

  // Sort content items by similarity if available
  const sortedItems = [...contentItems].sort((a, b) => {
    // If both have similarity scores, sort by similarity (descending)
    if (a.similarity !== undefined && b.similarity !== undefined) {
      return b.similarity - a.similarity;
    }
    // If only one has similarity score, prioritize that one
    if (a.similarity !== undefined) return -1;
    if (b.similarity !== undefined) return 1;
    // Otherwise, sort alphabetically by title
    return a.title?.localeCompare(b.title || '') || 0;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <h1 className="text-3xl font-bold mb-6">
          {searchPurpose ? (
            <>Content for: <span className="text-beige-700 italic">"{searchPurpose}"</span></>
          ) : (
            "Content Vista"
          )}
        </h1>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-beige-600" />
            <p className="mt-4 text-lg text-beige-700">Searching for relevant content...</p>
          </div>
        ) : sortedItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedItems.map((item) => (
              <div key={item.id} className="block group">
                <ContentDisplayItem 
                  content={{
                    ...item,
                    // If item has a similarity score, show it as a percentage in the UI
                    similarityScore: item.similarity !== undefined ? 
                      `${Math.round(item.similarity * 100)}% match` : undefined
                  }} 
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-xl text-gray-500 mb-4">No content items found.</p>
            {searchPurpose && (
              <p className="text-gray-400">
                Try adjusting your search or explore our general content.
              </p>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Vista;
