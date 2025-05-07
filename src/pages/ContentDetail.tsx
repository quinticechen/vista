
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";

const ContentDetail = () => {
  const { contentId } = useParams<{ contentId: string }>();
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchContentDetail = async () => {
      if (!contentId) return;

      try {
        const { data, error } = await supabase
          .from("content_items")
          .select("*")
          .eq("id", contentId)
          .single();

        if (error) {
          throw error;
        }

        setContent(data);
      } catch (error) {
        console.error("Error fetching content detail:", error);
        toast.error("Failed to load content details");
        navigate("/vista");
      } finally {
        setLoading(false);
      }
    };

    fetchContentDetail();
  }, [contentId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <div>Loading content...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <div>Content not found</div>
          <Button onClick={() => navigate("/vista")} className="mt-4">
            Back to Content List
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <Button
          variant="outline"
          onClick={() => navigate("/vista")}
          className="mb-6"
        >
          ← Back to Content List
        </Button>

        <div className="space-y-6">
          <h1 className="text-3xl font-bold">{content.title}</h1>
          
          {content.category && (
            <div className="inline-block bg-muted px-3 py-1 rounded-full text-sm font-medium">
              {content.category}
            </div>
          )}
          
          {content.description && (
            <p className="text-lg text-muted-foreground">{content.description}</p>
          )}
          
          {content.tags && content.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {content.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="bg-secondary px-2 py-1 rounded-md text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {content.start_date && (
              <div>
                <p className="font-semibold">Start Date</p>
                <p>{new Date(content.start_date).toLocaleDateString()}</p>
              </div>
            )}
            
            {content.end_date && (
              <div>
                <p className="font-semibold">End Date</p>
                <p>{new Date(content.end_date).toLocaleDateString()}</p>
              </div>
            )}
          </div>
          
          {content.notion_url && (
            <div>
              <p className="font-semibold">Notion Link</p>
              <a
                href={content.notion_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                View in Notion
              </a>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContentDetail;
