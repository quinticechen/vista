
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ContentDisplay from "@/components/ContentDisplay";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "@/components/ui/sonner";

const Vista = () => {
  const [contentItems, setContentItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContentItems = async () => {
      try {
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
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <h1 className="text-3xl font-bold mb-6">Content Vista</h1>
        {loading ? (
          <div>Loading content...</div>
        ) : contentItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contentItems.map((item) => (
              <Link
                key={item.id}
                to={`/vista/${item.id}`}
                className="block group"
              >
                <ContentDisplay content={item} />
              </Link>
            ))}
          </div>
        ) : (
          <div>No content items found.</div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Vista;
