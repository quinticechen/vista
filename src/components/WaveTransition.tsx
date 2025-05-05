
import { motion } from "framer-motion";

interface WaveTransitionProps {
  scrollProgress: number;
}

const WaveTransition = ({ scrollProgress }: WaveTransitionProps) => {
  // Ensure the wave stays at the top of the PurposeInput section
  const wavePosition = Math.min(100, scrollProgress * 100);
  
  return (
    <div 
      className="absolute top-0 left-0 right-0 z-20 pointer-events-none w-full overflow-hidden"
      style={{ 
        transform: `translateY(${-100 + wavePosition}%)` 
      }}
    >
      <svg
        viewBox="0 0 1440 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="w-full h-24"
      >
        <motion.path
          d="M0,120 C320,20 420,120 720,50 C1020,-20 1320,80 1440,100 L1440,0 L0,0 Z"
          fill="#EBE6D4" // beige-100 color
          animate={{
            d: `M0,120 C${320 + scrollProgress * 100},${20 + scrollProgress * 20} ${420 - scrollProgress * 50},${120 - scrollProgress * 50} ${720 - scrollProgress * 100},${50 - scrollProgress * 50} C${1020 + scrollProgress * 50},${-20 + scrollProgress * 40} ${1320 - scrollProgress * 20},${80 - scrollProgress * 40} 1440,${100 - scrollProgress * 20} L1440,0 L0,0 Z`
          }}
        />
      </svg>
    </div>
  );
};

export default WaveTransition;
