
import { motion } from "framer-motion";

interface WaveTransitionProps {
  scrollProgress: number;
  position: "top" | "bottom";
  color?: string; // Now directly accepts Tailwind color classes
}

const WaveTransition = ({ 
  scrollProgress, 
  position, 
  color = "fill-beige-100" // Default to fill-beige-100
}: WaveTransitionProps) => {
  // scrollProgress is a 0-1 fraction (see UrlParam.tsx), so this needs *100, not *10,
  // to actually reach a full reveal (wavePosition=100 -> translateY 0%, flush with its
  // anchored edge). At *10 it topped out at wavePosition=10 -- the wave stayed almost
  // entirely hidden (90% translated off-screen) at every scroll position, which is
  // what made it look like a barely-there sliver, or to have vanished entirely once
  // its color matched what's around it.
  const wavePosition = Math.min(100, scrollProgress * 100);
  
  // Render the wave SVG differently based on position
  return (
    <div 
      className={`absolute ${position === "top" ? "top-0" : "bottom-0"} left-0 right-0 z-20 pointer-events-none w-full overflow-hidden`}
      style={{ 
        transform: position === "top" 
          ? `translateY(${-100 + wavePosition}%)` 
          : `translateY(${100 - wavePosition}%)`
      }}
    >
      <svg
        viewBox="0 0 1440 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className={`w-full h-24 ${color}`} // Use the color prop directly as a class
      >
        <path
          d="M0,0 C320,100 420,0 720,70 C1020,140 1320,40 1440,20 L1440,120 L0,120 Z"
        />
      </svg>
    </div>
  );
};

export default WaveTransition;
