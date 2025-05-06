
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface FloatingShapesProps {
  scrollProgress: number;
}

const shapes = [
  { 
    type: "circle", 
    initialSize: 40, 
    initialX: "10%", 
    initialY: "20%", 
    color: "rgba(203, 195, 174, 0.5)" 
  },
  { 
    type: "square", 
    initialSize: 25, 
    initialX: "85%", 
    initialY: "40%", 
    color: "rgba(227, 220, 195, 0.4)" 
  },
  { 
    type: "triangle", 
    initialSize: 35, 
    initialX: "70%", 
    initialY: "75%", 
    color: "rgba(178, 161, 122, 0.3)" 
  },
  { 
    type: "circle", 
    initialSize: 20, 
    initialX: "30%", 
    initialY: "65%", 
    color: "rgba(245, 245, 220, 0.4)" 
  },
];

const FloatingShapes = ({ scrollProgress }: FloatingShapesProps) => {
  // Make shapes more visible as user scrolls down
  const opacity = Math.min(1, scrollProgress * 2);

  // Generate a random floating animation delay for each shape
  const [delays, setDelays] = useState<number[]>([]);
  
  useEffect(() => {
    setDelays(shapes.map(() => Math.random() * 2));
  }, []);
  
  // Render a specific shape based on type
  const renderShape = (type: string, size: number, color: string) => {
    switch (type) {
      case "circle":
        return (
          <div 
            className="rounded-full" 
            style={{ 
              width: size, 
              height: size, 
              background: color 
            }}
          />
        );
      case "square":
        return (
          <div 
            className="rounded-md" 
            style={{ 
              width: size, 
              height: size, 
              background: color 
            }}
          />
        );
      case "triangle":
        return (
          <div 
            style={{ 
              width: 0,
              height: 0,
              borderLeft: `${size/2}px solid transparent`,
              borderRight: `${size/2}px solid transparent`,
              borderBottom: `${size}px solid ${color}`
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10" style={{ opacity }}>
      {shapes.map((shape, index) => (
        <motion.div
          key={index}
          initial={{ 
            x: shape.initialX, 
            y: shape.initialY,
            opacity: 0 
          }}
          animate={{ 
            y: [`${parseFloat(shape.initialY as string) - 5}%`, `${parseFloat(shape.initialY as string) + 5}%`],
            opacity: scrollProgress > 0.2 ? 1 : 0
          }}
          transition={{ 
            y: { 
              duration: 3 + delays[index], 
              repeat: Infinity, 
              repeatType: "reverse",
              ease: "easeInOut" 
            },
            opacity: { duration: 0.8 }
          }}
          className="absolute"
        >
          {renderShape(shape.type, shape.initialSize, shape.color)}
        </motion.div>
      ))}
    </div>
  );
};

export default FloatingShapes;
