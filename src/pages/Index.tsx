
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Hero from '@/components/Hero';
import PurposeInput from '@/components/PurposeInput';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { Toaster } from '@/components/ui/toaster';
import { getProfileByUrlParam } from '@/services/urlParamService';
import { toast } from '@/components/ui/sonner';

const Index = () => {
  const { urlParam } = useParams();
  const navigate = useNavigate();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProfileData = async () => {
      if (urlParam) {
        try {
          const profile = await getProfileByUrlParam(urlParam);
          setOwnerProfile(profile);
          
          if (!profile) {
            toast.error(`The page for /${urlParam} does not exist.`);
            navigate('/');
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          toast.error('Could not load page data');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [urlParam, navigate]);
  
  const handlePurposeSubmit = (purpose: string) => {
    // When we're on a custom URL parameter page, navigate to that user's vista page
    if (urlParam && ownerProfile) {
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
  
  // Show loading state while checking URL parameter
  if (loading && urlParam) {
    return (
      <div className="min-h-screen bg-beige-50 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-beige-50">
      <Toaster />
      <Header />
      
      {/* Use a fixed positioned container for the Hero */}
      <div className="fixed inset-0 z-0">
        <Hero 
          scrollToInput={scrollToInput} 
          scrollProgress={scrollProgress} 
          customTitle={urlParam ? `Welcome to ${urlParam}'s page` : undefined}
        />
      </div>
      
      {/* Add a container for the PurposeInput with proper z-index */}
      <div className="relative z-10">
        {/* Add spacer to push PurposeInput down one viewport height */}
        <div className="h-screen"></div>
        
        <PurposeInput 
          onPurposeSubmit={handlePurposeSubmit} 
          scrollProgress={scrollProgress}
          placeholder={urlParam ? `Search ${urlParam}'s content...` : undefined}
        />
      </div>
      
      {/* Footer with proper z-index to appear after PurposeInput */}
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};

export default Index;
