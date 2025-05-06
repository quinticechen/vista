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
        // 使用一個包裝器 div 來應用偏移
        transform: position === "top"
          ? `translateY(${-100 + wavePosition}%)`
          : `translateY(${100 - wavePosition}%)`,
      }}
    >
      <div style={{
        transform: 'translateX(60px) scaleX(-1)', // 在這裡應用偏移和反轉
        width: 'calc(100% - 60px)', // 調整寬度以 компенсировать 偏移
        overflow: 'hidden', // 確保 SVG 不會溢出包裝器
        position: 'relative', // 添加相對定位
      }}>
        <svg
          viewBox={`0 0 1440 120`} // 保持原始 viewBox
          preserveAspectRatio="none"
          className="w-full h-24"
          style={{
            position: 'absolute', // 改為絕對定位
            top: 0,
            left: 0,
            width: '100%', // 確保 SVG 寬度填滿包裝器
            height: '100%', // 確保 SVG 高度填滿包裝器
            transform: position === "bottom" ? "rotate(180deg)" : "none",
            display: 'block',
          }}
        >
          <path
            d="M0,0 C320,100 420,0 720,70 C1020,140 1320,40 1440,20 L1440,120 L0,120 Z"
            fill={color}
          />
        </svg>
      </div>
    </div>
  );
};

export default FloatingShapes;
