import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '@/components/Hero';
import PurposeInput from '@/components/PurposeInput';
import Footer from '@/components/Footer';
import { Toaster } from '@/components/ui/toaster';
import WaveTransition from '@/components/WaveTransition.tsx';
import FloatingShapes from '@/components/FloatingShapes.tsx';


const Index = () => {
  const [userPurpose, setUserPurpose] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const heroSectionRef = useRef<HTMLDivElement>(null);
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
      
      {/* Use a fixed positioned container for the Hero */}
      <div className="fixed inset-0 z-0">
        <Hero scrollToInput={scrollToInput} scrollProgress={scrollProgress} />
      </div>
      
      <div className="relative z-10">
        <div className="absolute top-0 left-0 w-full">
          <WaveTransition scrollProgress={scrollProgress} position="top" />
          <FloatingShapes scrollProgress={scrollProgress} position="top" />
        </div>
        {/* <div className="h-screen"></div> */}
        <div id="purpose-input" className="relative"> {/* 給 PurposeInput 一個相對定位 */}
          <PurposeInput
            onPurposeSubmit={handlePurposeSubmit}
            scrollProgress={scrollProgress}
          />
        </div>
      </div>
      
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};

export default Index;
