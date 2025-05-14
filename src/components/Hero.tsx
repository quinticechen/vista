
import { ArrowDown } from "lucide-react";
import { motion } from "framer-motion";

interface HeroProps {
  scrollToInput?: () => void;
  scrollProgress?: number;
  customTitle?: string;
  customSubtitle?: string;
}

const Hero = ({ scrollToInput, scrollProgress = 0, customTitle, customSubtitle }: HeroProps) => {
  return (
    <motion.section 
      className="min-h-screen flex flex-col justify-center items-center px-4 md:px-8 lg:px-16 py-16 bg-beige-50 relative"
      style={{ 
        opacity: 1 - scrollProgress * 0.7, // Fade out more slowly
        transform: `translateY(${scrollProgress * 30}px)` // Reduced movement
      }}
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-beige-300 transform -skew-y-6"></div>
      </div>
      
      <div className="text-center max-w-4xl mx-auto z-10 animate-fade-in">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-beige-900 mb-4 tracking-tight">
          {customTitle ? customTitle : "Chen Quintice"}
        </h1>
        <h2 className="text-xl md:text-2xl lg:text-3xl font-light text-beige-700 mb-8">
          {customSubtitle ? customSubtitle : "AI Product Management Expert & Consultant"}
        </h2>
        <p className="text-base md:text-lg text-beige-600 max-w-2xl mx-auto mb-12">
          Specialized in AI implementation strategies, team training, and product development 
          with over 10 years of experience helping businesses integrate cutting-edge technologies.
        </p>
      </div>
      
      {scrollToInput && (
        <motion.div 
          className="absolute bottom-20 left-1/2 transform -translate-x-1/2 cursor-pointer"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          onClick={scrollToInput}
          style={{ opacity: 1 - scrollProgress * 2 }}
        >
          <ArrowDown className="w-6 h-6 text-beige-600" />
        </motion.div>
      )}
    </motion.section>
  );
};

export default Hero;
