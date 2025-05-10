import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ContentDisplayItem } from "@/components/ContentDisplay";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "@/components/ui/sonner";
import { ContentItem } from "@/services/adminService";

const Vista = () => {
  const [contentItems, setContentItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  
  // Check if we have search results from the navigation state
  const searchResults = location.state?.searchResults as ContentItem[] | undefined;
  const searchPurpose = location.state?.purpose as string | undefined;

  useEffect(() => {
    const fetchContentItems = async () => {
      try {
        // If we have search results from semantic search, use those
        if (searchResults && searchResults.length > 0) {
          setContentItems(searchResults);
          setLoading(false);
          
          toast.success(
            `Found ${searchResults.length} relevant items based on your purpose`,
            { duration: 5000 }
          );
          return;
        }
        
        // Otherwise, fall back to fetching all content items
        const { data, error } = await supabase
          .from("content_items")
          .select("*");

        if (error) {
          throw error;
        }

        setContentItems(data || []);
      } catch (error) {
        console.error("Error fetching content:", error);
        toast.error("Failed to load content items");
      } finally {
        setLoading(false);
      }
    };

    fetchContentItems();
  }, [searchResults]);

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
          <div className="flex justify-center py-8">
            <div className="animate-pulse text-lg">Loading content...</div>
          </div>
        ) : contentItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contentItems.map((item) => (
              <Link
                key={item.id}
                to={`/vista/${item.id}`}
                className="block group"
              >
                <ContentDisplayItem content={item} />
              </Link>
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
