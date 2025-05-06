import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '@/components/Hero';
import PurposeInput from '@/components/PurposeInput';
import Footer from '@/components/Footer';
import { Toaster } from '@/components/ui/toaster';
import WaveTransition from './WaveTransition';
import FloatingShapes from './FloatingShapes';

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

      <div className="fixed inset-0 z-0">
        <Hero scrollToInput={scrollToInput} scrollProgress={scrollProgress} />
      </div>

      <div className="relative z-10">
        {/* PurposeInput 現在直接放在這裡，不再需要額外的 spacer */}
        <PurposeInput
          onPurposeSubmit={handlePurposeSubmit}
          scrollProgress={scrollProgress}
        />
      </div>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};

export default Index;