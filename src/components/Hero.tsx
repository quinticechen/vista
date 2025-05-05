
import { ArrowDown } from "lucide-react";
import { motion } from "framer-motion";
import WaveTransition from "./WaveTransition";

interface HeroProps {
  scrollToInput: () => void;
  scrollProgress: number;
}

const Hero = ({ scrollToInput, scrollProgress }: HeroProps) => {
  return (
    <motion.section 
      className="min-h-screen flex flex-col justify-center items-center px-4 md:px-8 lg:px-16 py-16 relative"
      style={{ 
        opacity: 1 - scrollProgress, 
        transform: `translateY(${scrollProgress * 50}px)` 
      }}
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-beige-300 transform -skew-y-6"></div>
      </div>
      
      <div className="text-center max-w-4xl mx-auto z-10 animate-fade-in">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-beige-900 mb-4 tracking-tight">
          Chen Quintice
        </h1>
        <h2 className="text-xl md:text-2xl lg:text-3xl font-light text-beige-700 mb-8">
          AI Product Management Expert & Consultant
        </h2>
        <p className="text-base md:text-lg text-beige-600 max-w-2xl mx-auto mb-12">
          Specialized in AI implementation strategies, team training, and product development 
          with over 10 years of experience helping businesses integrate cutting-edge technologies.
        </p>
        
        <button 
          className="flex items-center justify-center px-6 py-3 rounded-md bg-beige-800 text-beige-50 hover:bg-beige-700 transition-all duration-300 mx-auto group"
          onClick={scrollToInput}
        >
          Tell me why you're here
          <ArrowDown className="ml-2 w-4 h-4 group-hover:translate-y-1 transition-transform duration-300" />
        </button>
      </div>
      
      <motion.div 
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 cursor-pointer"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        onClick={scrollToInput}
        style={{ opacity: 1 - scrollProgress * 2 }}
      >
        <ArrowDown className="w-6 h-6 text-beige-600" />
      </motion.div>

      {/* Add the wave transition */}
      <WaveTransition scrollProgress={scrollProgress} />
    </motion.section>
  );
};

export default Hero;
