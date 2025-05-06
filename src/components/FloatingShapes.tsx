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
           ? `translateY(${-100 + wavePosition}%)` // 移除 translateX 和 scaleX
           : `translateY(${100 - wavePosition}%)` // 移除 translateX 和 scaleX
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
           d="M-60,0 C260,100 360,0 660,70 C960,140 1260,40 1380,20 L1440,120 L-60,120 Z" // 修改了起始點和控制點
           fill={color}
         />
       </svg>
     </div>
   );
 };

 export default FloatingShapes;