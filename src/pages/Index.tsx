
import { useState, useRef } from 'react';
import Hero from '@/components/Hero';
import PurposeInput from '@/components/PurposeInput';
import ContentDisplay from '@/components/ContentDisplay';
import Footer from '@/components/Footer';
import { Toaster } from '@/components/ui/toaster';

const Index = () => {
  const [userPurpose, setUserPurpose] = useState<string | null>(null);
  const purposeInputRef = useRef<HTMLElement | null>(null);
  
  const handlePurposeSubmit = (purpose: string) => {
    setUserPurpose(purpose);
  };
  
  const scrollToInput = () => {
    const element = document.getElementById('purpose-input');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  return (
    <div className="min-h-screen bg-beige-50">
      <Toaster />
      
      <Hero scrollToInput={scrollToInput} />
      
      <PurposeInput onPurposeSubmit={handlePurposeSubmit} />
      
      {userPurpose && <ContentDisplay userPurpose={userPurpose} />}
      
      <Footer />
    </div>
  );
};

export default Index;
