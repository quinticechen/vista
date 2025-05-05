
import { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
}

const Vista = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const userPurpose = location.state?.purpose || '';

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      try {
        // Fetch content from Supabase
        const { data, error } = await supabase
          .from('content_items')
          .select('*');

        if (error) {
          throw error;
        }

        if (data) {
          // Filter content based on user purpose
          let filteredContent = data;
          
          if (userPurpose) {
            const purpose = userPurpose.toLowerCase();
            filteredContent = data.filter(item => {
              // Check if category or tags match the purpose
              return (
                item.category && purpose.includes(item.category) || 
                (item.tags && item.tags.some(tag => purpose.includes(tag.toLowerCase())))
              );
            });
            
            // If no matches, return top results
            if (filteredContent.length === 0) {
              filteredContent = data.slice(0, 3);
            }
          }
          
          setContent(filteredContent);
        }
      } catch (error) {
        console.error('Error fetching content:', error);
        toast({
          title: 'Error loading content',
          description: 'Unable to load content tailored to your needs.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [userPurpose, toast]);

  const handleCardClick = (contentId: string) => {
    navigate(`/vista/${contentId}`);
  };

  return (
    <div className="min-h-screen bg-beige-50">
      <section className="py-16 px-4 md:px-8 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 animate-fade-up">
            <h2 className="text-3xl md:text-4xl font-bold text-beige-900 mb-4">Content Tailored For You</h2>
            {userPurpose && <p className="text-beige-700">Based on your purpose: "{userPurpose}"</p>}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-white border-beige-200">
                  <CardHeader>
                    <Skeleton className="h-6 w-2/3 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-32 w-full mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-10 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : content.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {content.map((item) => (
                <Card 
                  key={item.id} 
                  className="bg-white border-beige-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 animate-fade-up cursor-pointer"
                  onClick={() => handleCardClick(item.id)}
                >
                  <CardHeader>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>
                      {item.tags && item.tags.map((tag, index) => (
                        <span key={index} className="inline-block bg-beige-100 text-beige-800 text-xs px-2 py-1 rounded mr-2 mb-2">
                          {tag}
                        </span>
                      ))}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-beige-700">{item.description}</p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full bg-beige-800 hover:bg-beige-700 text-white">
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-beige-100 rounded-lg animate-fade-up">
              <h3 className="text-xl font-medium text-beige-800 mb-2">No exact matches found</h3>
              <p className="text-beige-700 mb-6">Let me help you find what you're looking for.</p>
              <Button className="bg-beige-800 hover:bg-beige-700 text-white">Contact Me</Button>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Vista;
