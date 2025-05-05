
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Footer from '@/components/Footer';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
}

interface TextContent {
  body: string;
  format: string;
}

interface ImageContent {
  image_url: string;
  alt_text: string;
  caption: string;
}

interface VideoContent {
  video_url: string;
  provider: string;
  thumbnail_url: string;
}

interface ProductService {
  name: string;
  price: number;
  details: string;
  image_url: string;
}

interface Testimonial {
  author_name: string;
  author_title: string;
  author_avatar: string;
  quote: string;
  rating: number;
}

const ContentDetail = () => {
  const { contentId } = useParams();
  const [content, setContent] = useState<ContentItem | null>(null);
  const [textContent, setTextContent] = useState<TextContent | null>(null);
  const [imageContent, setImageContent] = useState<ImageContent | null>(null);
  const [videoContent, setVideoContent] = useState<VideoContent | null>(null);
  const [productService, setProductService] = useState<ProductService | null>(null);
  const [testimonial, setTestimonial] = useState<Testimonial | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchContentData = async () => {
      if (!contentId) return;
      
      setIsLoading(true);
      try {
        // Fetch main content item
        const { data: contentData, error: contentError } = await supabase
          .from('content_items')
          .select('*')
          .eq('id', contentId)
          .single();

        if (contentError) throw contentError;
        setContent(contentData);

        // Fetch text content
        const { data: textData } = await supabase
          .from('text_contents')
          .select('*')
          .eq('content_id', contentId)
          .maybeSingle();
        
        setTextContent(textData);

        // Fetch image content
        const { data: imageData } = await supabase
          .from('image_contents')
          .select('*')
          .eq('content_id', contentId)
          .maybeSingle();
        
        setImageContent(imageData);

        // Fetch video content
        const { data: videoData } = await supabase
          .from('video_contents')
          .select('*')
          .eq('content_id', contentId)
          .maybeSingle();
        
        setVideoContent(videoData);

        // Fetch product/service
        const { data: productData } = await supabase
          .from('product_services')
          .select('*')
          .eq('content_id', contentId)
          .maybeSingle();
        
        setProductService(productData);

        // Fetch testimonial
        const { data: testimonialData } = await supabase
          .from('testimonials')
          .select('*')
          .eq('content_id', contentId)
          .maybeSingle();
        
        setTestimonial(testimonialData);
        
      } catch (error) {
        console.error('Error fetching content details:', error);
        toast({
          title: 'Error loading content details',
          description: 'Unable to load the requested content.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchContentData();
  }, [contentId, toast]);

  const goBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-beige-50 py-16 px-4 md:px-8 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-10 w-3/4 mb-6" />
          <Skeleton className="h-6 w-full mb-4" />
          <Skeleton className="h-48 w-full mb-8" />
          <Skeleton className="h-6 w-1/2 mb-4" />
          <Skeleton className="h-24 w-full mb-6" />
          <Skeleton className="h-12 w-36" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-beige-50 py-16 px-4 md:px-8 lg:px-16 flex flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Content Not Found</h2>
          <p className="mb-6">The content you're looking for doesn't exist or has been removed.</p>
          <Button onClick={goBack} className="bg-beige-800 hover:bg-beige-700 text-white">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beige-50">
      <div className="py-16 px-4 md:px-8 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <Button 
            onClick={goBack} 
            variant="ghost" 
            className="mb-6 hover:bg-beige-200"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          
          <h1 className="text-3xl md:text-4xl font-bold text-beige-900 mb-4">{content.title}</h1>
          
          <div className="mb-6">
            {content.tags && content.tags.map((tag, index) => (
              <span key={index} className="inline-block bg-beige-100 text-beige-800 text-xs px-2 py-1 rounded mr-2 mb-2">
                {tag}
              </span>
            ))}
          </div>
          
          <div className="prose max-w-none mb-8">
            <p className="text-lg text-beige-800 mb-6">{content.description}</p>
            
            {/* Text Content */}
            {textContent && (
              <Card className="p-6 mb-8 bg-white">
                <div className="prose max-w-none">
                  <p>{textContent.body}</p>
                </div>
              </Card>
            )}
            
            {/* Image Content */}
            {imageContent && (
              <div className="mb-8">
                <img 
                  src={imageContent.image_url} 
                  alt={imageContent.alt_text || content.title} 
                  className="w-full rounded-lg shadow-md"
                />
                {imageContent.caption && (
                  <p className="mt-2 text-sm text-beige-600 text-center">{imageContent.caption}</p>
                )}
              </div>
            )}
            
            {/* Video Content */}
            {videoContent && (
              <div className="mb-8 aspect-video">
                <iframe
                  src={videoContent.video_url}
                  className="w-full h-full rounded-lg"
                  allowFullScreen
                  title={content.title}
                ></iframe>
              </div>
            )}
            
            {/* Product/Service */}
            {productService && (
              <Card className="p-6 mb-8 bg-white">
                <div className="flex flex-col md:flex-row gap-6">
                  {productService.image_url && (
                    <div className="md:w-1/3">
                      <img 
                        src={productService.image_url} 
                        alt={productService.name} 
                        className="w-full rounded-md"
                      />
                    </div>
                  )}
                  <div className="md:w-2/3">
                    <h3 className="text-xl font-bold mb-2">{productService.name}</h3>
                    {productService.price && (
                      <p className="text-lg font-semibold text-beige-900 mb-4">${productService.price}</p>
                    )}
                    <p className="text-beige-700">{productService.details}</p>
                    <Button className="mt-4 bg-beige-800 hover:bg-beige-700 text-white">
                      Learn More
                    </Button>
                  </div>
                </div>
              </Card>
            )}
            
            {/* Testimonial */}
            {testimonial && (
              <Card className="p-6 mb-8 bg-beige-100">
                <div className="flex flex-col items-center text-center">
                  <blockquote className="text-lg italic mb-4">"{testimonial.quote}"</blockquote>
                  <div className="flex items-center">
                    {testimonial.author_avatar && (
                      <img 
                        src={testimonial.author_avatar} 
                        alt={testimonial.author_name} 
                        className="w-12 h-12 rounded-full mr-3"
                      />
                    )}
                    <div>
                      <p className="font-semibold">{testimonial.author_name}</p>
                      {testimonial.author_title && (
                        <p className="text-sm text-beige-600">{testimonial.author_title}</p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
          
          <div className="mt-12">
            <h3 className="text-xl font-bold mb-4">Interested in learning more?</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="bg-beige-800 hover:bg-beige-700 text-white">
                Contact Me
              </Button>
              <Button variant="outline" className="border-beige-500 text-beige-800 hover:bg-beige-100">
                View Related Content
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ContentDetail;
