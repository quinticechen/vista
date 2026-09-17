import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Hero from '@/components/Hero';
import PurposeInput from '@/components/PurposeInput';
import PersonalHeader from '@/components/PersonalHeader';
import PersonalFooter from '@/components/PersonalFooter';
import SEOHead from '@/components/SEOHead';
import SEOContent from '@/components/SEOContent';
import { Toaster } from '@/components/ui/toaster';
import { getProfileByUrlParam } from '@/services/urlParamService';
import { getHomePageSettingsByUrlParam, DEFAULT_HOME_PAGE_SETTINGS } from '@/services/homePageService';
import { toast } from '@/components/ui/sonner';
import { truncateDescription } from '@/lib/utils';

const Index = () => {
  const { urlParam } = useParams();
  const navigate = useNavigate();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [homePageSettings, setHomePageSettings] = useState<any>(DEFAULT_HOME_PAGE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [profileNotFound, setProfileNotFound] = useState(false);
  
  // SEO data generation
  const generateSEOData = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const currentPath = urlParam ? `/${urlParam}` : '/';
    const canonicalUrl = `${baseUrl}${currentPath}`;
    
    if (urlParam && homePageSettings) {
      // User-specific SEO using this user's admin/home-page settings:
      // Title -> heroTitle, Description -> heroSubtitle + heroDescription,
      // Keywords -> interactiveTitle + interactiveSubtitle (the "Interactive Section" fields).
      const heroName = homePageSettings.heroTitle || homePageSettings.footerName || urlParam;
      // "{topic} | Brand" -- keeps the page's own identity front and center for
      // search results while still surfacing the platform it's built on.
      const title = `${heroName} | Vista Content Platform`;
      const description = truncateDescription(
        [homePageSettings.heroSubtitle, homePageSettings.heroDescription].filter(Boolean).join(' ') ||
          "Discover amazing content and insights"
      );
      const keywords = [homePageSettings.interactiveTitle, homePageSettings.interactiveSubtitle]
        .filter(Boolean);

      return {
        title,
        description,
        keywords: keywords.length > 0 ? keywords : [urlParam, 'personalized content'],
        canonicalUrl,
        ogImage: '/og-image.png',
        siteName: heroName,
        structuredData: {
          "@context": "https://schema.org",
          "@type": "Person",
          "name": heroName,
          "url": canonicalUrl,
          "description": description
        }
      };
    }
    
    // Default home page SEO
    return {
      title: "Vista AI Content Create Platform",
      description: "Transform Your Content Strategy with AI and Notion Database",
      keywords: ['Vista', 'Notion', 'Content Create'],
      canonicalUrl,
      ogImage: '/og-image.png',
      structuredData: {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Vista AI Content Create Platform",
        "url": canonicalUrl,
        "description": "Transform Your Content Strategy with AI and Notion Database"
      }
    };
  };
  
  useEffect(() => {
    const fetchProfileData = async () => {
      if (urlParam) {
        try {
          console.log(`Fetching profile for URL parameter: ${urlParam}`);
          const profile = await getProfileByUrlParam(urlParam);
          
          if (!profile) {
            console.log(`No profile found for URL parameter: ${urlParam}`);
            setProfileNotFound(true);
            toast.error(`The page for /${urlParam} does not exist.`);
          } else {
            console.log(`Profile found for ${urlParam}:`, profile);
            setOwnerProfile(profile);
            
            // Fetch home page settings for this URL parameter
            const settings = await getHomePageSettingsByUrlParam(urlParam);
            if (settings) {
              setHomePageSettings(settings);
            }
            
            setProfileNotFound(false);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          setProfileNotFound(true);
          toast.error(`Could not load page for /${urlParam}. Please check if this page exists.`);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [urlParam]);
  
  const handlePurposeSubmit = (purpose: string) => {
    // Prevent search if profile not found for URL parameter routes
    if (urlParam && profileNotFound) {
      toast.error(`Cannot search - the page for /${urlParam} does not exist.`);
      return;
    }
    
    // When we're on a custom URL parameter page, navigate to that user's vista page
    if (urlParam) {
      navigate(`/${urlParam}/vista?search=${encodeURIComponent(purpose)}`);
    } else {
      // Default behavior - navigate to the global vista page
      navigate(`/vista?search=${encodeURIComponent(purpose)}`);
    }
  };
  
  const scrollToInput = () => {
    const element = document.getElementById('purpose-input');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      // Calculate progress (0 to 1) based on scroll position
      const progress = Math.min(Math.max(scrollY / viewportHeight, 0), 1);
      setScrollProgress(progress);
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Initial call to set initial state
    handleScroll();
    
    // Clean up
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Show loading state only briefly while checking URL parameter
  if (loading && urlParam) {
    return (
      <div className="min-h-screen bg-beige-50 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  // Show error state for non-existent URL parameter profiles
  if (urlParam && profileNotFound) {
    return (
      <div className="min-h-screen bg-beige-50 flex items-center justify-center">
        <SEOHead
          title="Page Not Found - Vista Content Platform"
          description="The requested page could not be found. Please check the URL or return to our homepage."
          noIndex={true}
        />
        <Toaster />
        <SEOContent
          h1="Page Not Found"
          h2={`The page for /${urlParam} does not exist`}
        >
          <p className="text-gray-600 mb-4">Please check the URL or return to our homepage.</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Go to Home
          </button>
        </SEOContent>
      </div>
    );
  }
  
  const seoData = generateSEOData();
  
  return (
    <div className="min-h-screen bg-beige-50">
      <SEOHead {...seoData} />
      <Toaster />
{/*       <PersonalHeader /> */}
      
      {/* Use a fixed positioned container for the Hero */}
      <div className="fixed inset-0 z-0">
        <Hero 
          scrollToInput={scrollToInput} 
          scrollProgress={scrollProgress}
          customTitle={homePageSettings.heroTitle}
          customSubtitle={homePageSettings.heroSubtitle}
          customDescription={homePageSettings.heroDescription}
        />
      </div>
      
      {/* Add a container for the PurposeInput with proper z-index */}
      <div className="relative z-10 pointer-events-none">
        {/* Add spacer to push PurposeInput down one viewport height */}
        <div className="h-screen pointer-events-none"></div>
        
        <PurposeInput 
          onPurposeSubmit={handlePurposeSubmit} 
          scrollProgress={scrollProgress}
          placeholder={homePageSettings.customInputPlaceholder || `Search ${urlParam || ''}'s content...`}
          interactiveTitle={homePageSettings.interactiveTitle}
          interactiveSubtitle={homePageSettings.interactiveSubtitle}
          submitButtonText={homePageSettings.submitButtonText}
          optionButtons={homePageSettings.optionButtons}
        />
      </div>
      
      {/* Footer with proper z-index to appear after PurposeInput */}
      <div className="relative z-10">
        <PersonalFooter 
          userLanguage={ownerProfile?.default_language} 
          supportedLanguages={ownerProfile?.supported_ai_languages}
        />
      </div>
    </div>
  );
};

export default Index;
