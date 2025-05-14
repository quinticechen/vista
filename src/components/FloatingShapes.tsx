
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
        viewBox="0 0 1440 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className={`w-full h-[260px] ${color}`} // Use the color prop directly as a class
      >
        <path
          d="M-80,80 C180,-20 380,140 720,60 C1060,-40 1260,120 1520,40 L1440,260 L-80,260 Z"
        />
      </svg>
    </div>
  );
};

export default FloatingShapes;
