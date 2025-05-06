
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '@/components/Hero';
import PurposeInput from '@/components/PurposeInput';
import Footer from '@/components/Footer';
import { Toaster } from '@/components/ui/toaster';
import WaveTransition from '@/components/WaveTransition';
import FloatingShapes from '@/components/FloatingShapes';

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
    <div className="min-h-screen bg-beige-50">
      <Toaster />
      
      {/* Use a fixed positioned container for the Hero */}
      <div className="fixed inset-0 z-0">
        <Hero scrollToInput={scrollToInput} scrollProgress={scrollProgress} />
      </div>
      
      {/* Add a container for the PurposeInput with proper z-index */}
      <div className="relative z-10">
        {/* Add spacer to push PurposeInput down one viewport height */}
        <div className="h-screen"></div>
        
        <PurposeInput 
          onPurposeSubmit={handlePurposeSubmit} 
          scrollProgress={scrollProgress} 
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
