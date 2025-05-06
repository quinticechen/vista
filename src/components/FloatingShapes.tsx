import { motion } from "framer-motion";

interface FloatingShapesProps {
  scrollProgress: number;
  position: "top" | "bottom";
  color?: string;
}

const FloatingShapes = ({
  scrollProgress,
  position,
  color = "#EBE6D4"
}: FloatingShapesProps) => {
  // Ensure the wave stays at the correct position
  const wavePosition = Math.min(100, scrollProgress * 10);

  // Render the wave SVG differently based on position
  return (
    <div
      className={`absolute ${position === "top" ? "top-0" : "bottom-0"} left-0 right-0 z-20 pointer-events-none w-full overflow-hidden`}
      style={{
        transform: position === "top"
          ? `translateY(${-100 + wavePosition}%) translateX(60px) scaleX(-1)`  // Added translateX(60px) and scaleX(-1)
          : `translateY(${100 - wavePosition}%) translateX(60px) scaleX(-1)` // Added translateX(60px) and scaleX(-1)
      }}
    >
      <svg
        viewBox="0 0 1440 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="w-full h-24"
        style={{
          transform: position === "bottom" ? "rotate(180deg)" : "none"
        }}
      >
        <path
          d="M0,0 C320,100 420,0 720,70 C1020,140 1320,40 1440,20 L1440,120 L0,120 Z"
          fill={color}
        />
      </svg>
    </div>
  );
};

export default FloatingShapes;
