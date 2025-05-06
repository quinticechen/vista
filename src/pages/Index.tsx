
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PurposeInput from '@/components/PurposeInput';
import Footer from '@/components/Footer';
import { Toaster } from '@/components/ui/toaster';
import WaveTransition from '@/components/WaveTransition';
import FloatingShapes from '@/components/FloatingShapes';
import Hero from '@/components/Hero';

const Index = () => {
  const [userPurpose, setUserPurpose] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const navigate = useNavigate();

  const handlePurposeSubmit = (purpose: string) => {
    setUserPurpose(purpose);
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
      const progress = Math.min(Math.max(scrollY / viewportHeight, 0), 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-beige-50">
      <Toaster />

      {/* Hero Section (fixed at the top) */}
      <div className="fixed inset-0 z-0">
        <Hero scrollToInput={scrollToInput} scrollProgress={scrollProgress} />
      </div>

      {/* Container for the scrolling content */}
      <div className="relative z-10 pt-screen"> {/* Add padding-top to push content below Hero */}
        {/* Wave and Shapes positioned above PurposeInput */}
        <div className="absolute top-0 left-0 w-full">
          <WaveTransition scrollProgress={scrollProgress} position="top" />
          <FloatingShapes scrollProgress={scrollProgress} position="top" />
        </div>
        <div id="purpose-input" className="relative">
          <PurposeInput
            onPurposeSubmit={handlePurposeSubmit}
            scrollProgress={scrollProgress}
          />
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default Index;
