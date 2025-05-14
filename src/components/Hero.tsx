
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import FloatingShapes from './FloatingShapes';
import TranslatedText from './TranslatedText';

interface HeroProps {
  scrollToInput: () => void;
  scrollProgress: number;
  customTitle?: string; // Add custom title prop
}

const Hero = ({ scrollToInput, scrollProgress, customTitle }: HeroProps) => {
  return (
    <div className={cn("relative h-screen w-full overflow-hidden", 
      scrollProgress > 0.1 && "pointer-events-none"
    )}>
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-white to-amber-50/80 dark:from-gray-950 dark:to-gray-900/90"></div>
      
      {/* Animated floating shapes */}
      <div 
        className={cn("absolute inset-0 transition-opacity duration-1000",
          scrollProgress > 0.5 ? "opacity-0" : "opacity-100"
        )}
      >
        <FloatingShapes scrollProgress={scrollProgress} position="bottom" />
      </div>
      
      {/* Content container */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
        <h1 
          className={cn(
            "text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight transition-all duration-1000 text-gray-900 dark:text-gray-100",
            scrollProgress > 0 && "transform translate-y-[-100px] scale-90",
            scrollProgress > 0.3 && "transform translate-y-[-150px] scale-75 opacity-50",
            scrollProgress > 0.6 && "opacity-0"
          )}
        >
          {customTitle ? (
            <span>{customTitle}</span>
          ) : (
            <TranslatedText keyword="hero.title">Tailored Brand Flow</TranslatedText>
          )}
        </h1>
        
        <p 
          className={cn(
            "mt-6 text-lg sm:text-xl md:text-2xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto transition-all duration-1000",
            scrollProgress > 0 && "transform translate-y-[-100px] scale-90",
            scrollProgress > 0.3 && "transform translate-y-[-120px] scale-75 opacity-50",
            scrollProgress > 0.6 && "opacity-0"
          )}
        >
          <TranslatedText keyword="hero.subtitle">
            Elevate your brand with AI-driven content personalized to your business purpose.
          </TranslatedText>
        </p>
        
        <button
          onClick={scrollToInput}
          className={cn(
            "mt-12 px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-full font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50 transition-all duration-300",
            scrollProgress > 0 && "transform translate-y-[-50px] scale-95",
            scrollProgress > 0.3 && "opacity-0 pointer-events-none"
          )}
        >
          <TranslatedText keyword="hero.getStarted">Get Started</TranslatedText>
        </button>
      </div>
    </div>
  );
};

export default Hero;
