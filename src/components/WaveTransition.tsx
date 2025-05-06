import { motion } from "framer-motion";

 interface WaveTransitionProps {
   scrollProgress: number;
   position: "top" | "bottom";
   color?: string;
 }

 const WaveTransition = ({
   scrollProgress,
   position,
   color = "#EBE6D4"
 }: WaveTransitionProps) => {
   // Ensure the wave stays at the correct position
   const wavePosition = Math.min(100, scrollProgress * 10);

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
         className="w-full h-24"
         style={{
           transform: position === "bottom" ? "rotate(180deg)" : "none"
         }}
       >
         <path
           d="M-60,40 C240,100 400,20 720,60 C1040,100 1200,40 1500,0 L1440,120 L-60,120 Z"
           fill={color}
         />
       </svg>
     </div>
   );
 };

 export default WaveTransition;