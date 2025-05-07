
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ContentItem {
  id: number;
  title: string;
  description: string;
  category: string;
  tags: string[];
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
}

// Mock database content - in a real app, this would come from Supabase
const mockContentDatabase: ContentItem[] = [
  {
    id: 1,
    title: "AI Product Management Excellence",
    description: "Comprehensive guide for HR professionals looking to hire top AI product management talent. Learn what skills to look for and how to assess candidates effectively.",
    category: "hr",
    tags: ["AI", "product management", "hiring", "talent acquisition"],
    imageUrl: "/placeholder.svg",
    ctaText: "Download Hiring Guide",
    ctaLink: "#"
  },
  {
    id: 2,
    title: "AI Implementation Strategy",
    description: "Strategic framework for business owners looking to implement AI solutions. This guide covers assessment, planning, team building, and execution phases.",
    category: "consultant",
    tags: ["AI implementation", "strategy", "consulting", "business transformation"],
    imageUrl: "/placeholder.svg",
    ctaText: "Book a Consultation",
    ctaLink: "#"
  },
  {
    id: 3,
    title: "Product Development Collaboration",
    description: "Case studies and methodologies for product development partnerships. Learn how my expertise can help bring your product vision to reality.",
    category: "product",
    tags: ["product development", "collaboration", "AI products", "case studies"],
    imageUrl: "/placeholder.svg",
    ctaText: "Explore Collaboration Options",
    ctaLink: "#"
  },
  {
    id: 4,
    title: "Portfolio Design Principles",
    description: "Design insights and principles behind this portfolio website. A resource for designers looking to create effective personal brand experiences.",
    category: "designer",
    tags: ["web design", "portfolio", "UX", "personal branding"],
    imageUrl: "/placeholder.svg",
    ctaText: "View Design Resources",
    ctaLink: "#"
  },
  {
    id: 5,
    title: "Visual Architecture Frameworks",
    description: "Structural and visual frameworks that inform both digital product and architectural design. Drawing parallels between software and physical architecture.",
    category: "architect",
    tags: ["architecture", "design frameworks", "visual systems", "structure"],
    imageUrl: "/placeholder.svg",
    ctaText: "Explore Design Frameworks",
    ctaLink: "#"
  }
];

interface ContentDisplayProps {
  userPurpose: string | null;
}

const ContentDisplay = ({ userPurpose }: ContentDisplayProps) => {
  const [filteredContent, setFilteredContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userPurpose) {
      setFilteredContent([]);
      return;
    }

    setIsLoading(true);
    
    // Simulate API call to filter content
    setTimeout(() => {
      // Simple filtering logic - in a real app, this would be more sophisticated
      let filtered: ContentItem[] = [];
      
      const purpose = userPurpose.toLowerCase();
      
      if (purpose.includes("hr") || purpose.includes("candidate") || purpose.includes("talent")) {
        filtered = mockContentDatabase.filter(item => 
          item.category === "hr" || item.tags.some(tag => purpose.includes(tag.toLowerCase())));
      } else if (purpose.includes("consultant") || purpose.includes("implementation") || purpose.includes("training")) {
        filtered = mockContentDatabase.filter(item => 
          item.category === "consultant" || item.tags.some(tag => purpose.includes(tag.toLowerCase())));
      } else if (purpose.includes("product") || purpose.includes("collaborate") || purpose.includes("business")) {
        filtered = mockContentDatabase.filter(item => 
          item.category === "product" || item.tags.some(tag => purpose.includes(tag.toLowerCase())));
      } else if (purpose.includes("designer") || purpose.includes("portfolio") || purpose.includes("website")) {
        filtered = mockContentDatabase.filter(item => 
          item.category === "designer" || item.tags.some(tag => purpose.includes(tag.toLowerCase())));
      } else if (purpose.includes("architect") || purpose.includes("architecture") || purpose.includes("design")) {
        filtered = mockContentDatabase.filter(item => 
          item.category === "architect" || item.tags.some(tag => purpose.includes(tag.toLowerCase())));
      } else {
        // If no specific matches, return top results
        filtered = mockContentDatabase.slice(0, 3);
      }
      
      setFilteredContent(filtered);
      setIsLoading(false);
    }, 1500); // Simulate loading time
  }, [userPurpose]);

  if (!userPurpose) {
    return null; // Don't render anything if no purpose provided yet
  }

  return (
    <section className="py-16 px-4 md:px-8 lg:px-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 animate-fade-up">
          <h2 className="text-3xl md:text-4xl font-bold text-beige-900 mb-4">Content Tailored For You</h2>
          <p className="text-beige-700">Based on your purpose: "{userPurpose}"</p>
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
        ) : filteredContent.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContent.map((item) => (
              <Card key={item.id} className="bg-white border-beige-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 animate-fade-up">
                {item.imageUrl && (
                  <div className="w-full h-40 bg-beige-200 overflow-hidden">
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>
                    {item.tags.map((tag, index) => (
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
                  <Button className="w-full bg-beige-800 hover:bg-beige-700 text-white" asChild>
                    <a href={item.ctaLink}>{item.ctaText || "Learn More"}</a>
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
  );
};

export default ContentDisplay;
