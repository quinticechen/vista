
import { motion } from "framer-motion";

 interface FloatingShapesProps {
   scrollProgress: number;
   position: "top" | "bottom";
   color?: string;
   opacity?: number;
 }

 const FloatingShapes = ({
   scrollProgress,
   position,
   color = "#EBE6D4",
   opacity = 0.5
 }: FloatingShapesProps) => {
   // Ensure the wave stays at the correct position
   const wavePosition = Math.min(100, scrollProgress * 50);

   // Determine Tailwind color class based on the color prop
   const getColorClass = () => {
     switch(color) {
       case "#EBE6D4":
         return "fill-beige-100";
       case "#F5F5DC":
         return "fill-beige-50";
       default:
         // If it's not one of our predefined colors, fallback to the color prop
         return "";
     }
   };

   const colorClass = getColorClass();

   // Render the wave SVG differently based on position
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
         className={`w-full h-24 ${colorClass}`}
         style={{
           transform: position === "bottom" ? "rotate(180deg)" : "none",
           fill: colorClass ? undefined : color // Use the color prop only if no Tailwind class is found
         }}
       >
         <path
           d="M-80,60 C180,10 380,110 720,50 C1060,-10 1260,90 1520,30 L1440,120 L-80,120 Z"
           className={colorClass}
         />
       </svg>
     </div>
   );
 };

 export default FloatingShapes;
