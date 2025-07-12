import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SEOHead from '@/components/SEOHead';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Search, Zap, Shield, Globe, BarChart3, Paintbrush } from 'lucide-react';

const VistaProductHome = () => {
  const navigate = useNavigate();
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollY / documentHeight;
      setScrollProgress(Math.min(Math.max(progress, 0), 1));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <Search className="h-8 w-8" />,
      title: "AI-Powered Search",
      description: "Semantic search that understands intent, not just keywords. Find relevant content instantly."
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Smart Personalization", 
      description: "Privacy-first content recommendations based on explicit user preferences, no tracking."
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Privacy-First Design",
      description: "GDPR compliant platform that respects user privacy while delivering personalized experiences."
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Multi-Language Support",
      description: "Automatic content translation and localization to reach global audiences effectively."
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Real-Time Analytics",
      description: "Track engagement, performance, and user behavior with comprehensive analytics dashboard."
    },
    {
      icon: <Paintbrush className="h-8 w-8" />,
      title: "Website Customization",
      description: "Beautiful, responsive templates with easy customization tools for brand consistency."
    }
  ];

  const seoData = {
    title: "Vista - AI-Powered Content Experience Platform | Transform Your Content Strategy",
    description: "Transform your content strategy with Vista's privacy-first AI platform. Get personalized content delivery, semantic search, and seamless Notion integration. Start free today.",
    keywords: ['AI content platform', 'content personalization', 'semantic search', 'privacy-first', 'content management', 'Notion integration'],
    canonicalUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/`,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Vista",
      "description": "AI-powered content experience platform for businesses",
      "url": typeof window !== 'undefined' ? window.location.origin : '',
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web"
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <SEOHead {...seoData} />
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 px-6 text-center">
        <div className="container mx-auto max-w-4xl">
          <Badge variant="secondary" className="mb-6">
            ✨ Privacy-First AI Content Platform
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Transform Your Content Strategy with AI
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Vista enables businesses to deliver personalized, privacy-compliant content experiences 
            through AI-powered search, seamless Notion integration, and beautiful website customization.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="text-lg px-8 py-6"
            >
              Get Started Free
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate('/about')}
              className="text-lg px-8 py-6"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Powerful Features for Modern Content Teams
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to create, manage, and deliver personalized content experiences
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <div className="text-primary mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            Why Choose Vista?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="p-6">
              <div className="text-4xl font-bold text-primary mb-2">30%</div>
              <div className="text-muted-foreground">Increase in engagement rates</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-primary mb-2">40%</div>
              <div className="text-muted-foreground">Reduction in content ops time</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-primary mb-2">100%</div>
              <div className="text-muted-foreground">Privacy compliant</div>
            </div>
          </div>
          
          <div className="bg-card p-8 rounded-lg border">
            <h3 className="text-2xl font-semibold mb-4">Ready to Transform Your Content?</h3>
            <p className="text-muted-foreground mb-6">
              Join forward-thinking businesses using Vista to deliver better content experiences.
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="text-lg px-8 py-6"
            >
              Start Your Free Trial
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default VistaProductHome;