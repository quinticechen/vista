
import { motion } from "framer-motion";

interface WaveTransitionProps {
  scrollProgress: number;
}

const WaveTransition = ({ scrollProgress }: WaveTransitionProps) => {
  // Ensure the wave stays at the top of the PurposeInput section
  const wavePosition = Math.min(100, scrollProgress * 10);
  
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
        <path
          d="M0,0 C320,100 420,0 720,70 C1020,140 1320,40 1440,20 L1440,120 L0,120 Z"
          fill="#EBE6D4" // beige-100 color
        />
      </svg>
    </div>
  );
};

export default WaveTransition;
