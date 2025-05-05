
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '@/components/Hero';
import PurposeInput from '@/components/PurposeInput';
import Footer from '@/components/Footer';
import { Toaster } from '@/components/ui/toaster';

const Index = () => {
  const [userPurpose, setUserPurpose] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const handlePurposeSubmit = (purpose: string) => {
    setUserPurpose(purpose);
    // Navigate to Vista page with the purpose data
    navigate("/vista", { state: { purpose } });
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
  
  return (
    <div className="min-h-screen bg-beige-50" ref={heroSectionRef}>
      <Toaster />
      
      <div className="relative">
        {/* Add a wrapper with relative positioning */}
        <Hero scrollToInput={scrollToInput} scrollProgress={scrollProgress} />
        <div className="sticky top-0 w-full min-h-screen">
          <PurposeInput 
            onPurposeSubmit={handlePurposeSubmit} 
            scrollProgress={scrollProgress} 
          />
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Index;
