
import { motion } from "framer-motion";

interface FloatingShapesProps {
  scrollProgress: number;
  position: "top" | "bottom";
  color?: string; // Now directly accepts Tailwind color classes
  opacity?: number;
}

const FloatingShapes = ({
  scrollProgress,
  position,
  color = "fill-beige-100", // Default to fill-beige-100
  opacity = 0.5
}: FloatingShapesProps) => {
  // Ensure the shapes appear with correct positioning
  const wavePosition = Math.min(100, scrollProgress * 70);

  // Render the shapes SVG differently based on position
  return (
    <div
      className={`absolute ${position === "top" ? "top-0" : "bottom-0"} left-0 right-0 z-20 pointer-events-none w-full overflow-hidden`}
      style={{
        transform: position === "top"
          ? `translateY(${-100 + wavePosition}%)`
          : `translateY(${100 - wavePosition}%)`,
        opacity: opacity 
      }}
    >
      <svg
        viewBox="0 0 1440 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className={`w-full h-24 ${color}`} // Use the color prop directly as a class
      >
        {/* d="M-80,60 C180,10 380,110 720,50 C1060,-10 1260,90 1520,30 L1440,120 L-80,120 Z" */}
        {/* d="M-80,100 C180,-30 380,150 720,90 C1060,-50 1260,130 1520,70 L1440,120 L-80,120 Z" */}
        {/* d="M-80,80 C180,-20 380,140 720,60 C1060,-40 1260,120 1520,40 L1440,160 L1440,160 L-80,160 L-80,160 Z" */}
        <path
          d="M-0,100 C180,20 380,200 720,100 C1060,-20 1260,200 1520,80 L1440,200 L-0,200 Z"
        />
      </svg>
      {/* <div 
        className="absolute inset-0 bg-beige-100 z-0"
      ></div> */}
    </div>
  );
};

export default FloatingShapes;
