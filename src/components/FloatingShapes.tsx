
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
  const wavePosition = Math.min(100, scrollProgress * 50);

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
        viewBox="0 0 1440 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className={`w-full h-24 ${color}`} // Use the color prop directly as a class
      >
        <path
          d="M-80,60 C180,10 380,110 720,50 C1060,-10 1260,90 1520,30 L1440,120 L-80,120 Z"
        />
      </svg>
    </div>
  );
};

export default FloatingShapes;
