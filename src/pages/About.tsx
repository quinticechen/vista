
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ContentDisplayItem } from "@/components/ContentDisplay";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "@/components/ui/sonner";
import { ContentItem } from "@/services/adminService";
import { Loader2 } from "lucide-react";

const About = () => {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchAllContent = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from("content_items")
          .select("*")
          .order('title', { ascending: true });

        if (error) {
          throw error;
        }

        console.log(`Fetched ${data?.length || 0} content items for About page`);
        setContentItems(data || []);
      } catch (error) {
        console.error("Error fetching content for About page:", error);
        toast.error("Failed to load content items");
      } finally {
        setLoading(false);
      }
    };

    fetchAllContent();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <h1 className="text-3xl font-bold mb-6">About Our Content</h1>
        <p className="text-lg text-beige-700 mb-8">
          Explore our complete collection of resources, insights, and expertise across all categories.
        </p>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-beige-600" />
            <p className="mt-4 text-lg text-beige-700">Loading all content...</p>
          </div>
        ) : contentItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contentItems.map((item) => (
              <div key={item.id} className="block group">
                <ContentDisplayItem content={item} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-xl text-gray-500">No content items available.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default About;
