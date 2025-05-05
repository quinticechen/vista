
import { motion } from "framer-motion";

interface WaveTransitionProps {
  scrollProgress: number;
}

const WaveTransition = ({ scrollProgress }: WaveTransitionProps) => {
  // Control the position of the wave based on scroll progress
  const waveOffset = Math.min(100, scrollProgress * 150);
  
  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none" style={{ transform: `translateY(${-waveOffset}%)` }}>
      <svg
        viewBox="0 0 1440 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="w-full h-24"
      >
        <motion.path
          d="M0,0 C320,100 420,0 720,70 C1020,140 1320,40 1440,20 L1440,120 L0,120 Z"
          fill="#EBE6D4" // beige-100 color
          animate={{
            d: `M0,0 C${320 + scrollProgress * 100},${100 - scrollProgress * 20} ${420 - scrollProgress * 50},${scrollProgress * 50} ${720 - scrollProgress * 100},${70 + scrollProgress * 50} C${1020 + scrollProgress * 50},${140 - scrollProgress * 40} ${1320 - scrollProgress * 20},${40 + scrollProgress * 40} 1440,${20 + scrollProgress * 20} L1440,120 L0,120 Z`
          }}
        />
      </svg>
    </div>
  );
};

export default WaveTransition;
