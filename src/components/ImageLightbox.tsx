
import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

interface ImageLightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;

const clampScale = (value: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));

const getTouchDistance = (touches: React.TouchList) => {
  const a = touches[0];
  const b = touches[1];
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
};

// Full-screen image viewer: click a content image to open it, scroll/pinch to zoom,
// drag to pan once zoomed, Escape/backdrop/close-button to dismiss.
export const ImageLightbox: React.FC<ImageLightboxProps> = ({ src, alt, onClose }) => {
  const [scale, setScale] = useState(MIN_SCALE);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isInteracting, setIsInteracting] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const pinchRef = useRef<{ startDistance: number; startScale: number } | null>(null);

  // Lock page scroll while the lightbox is open.
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Close on Escape.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const resetIfAtMinScale = (next: number) => {
    if (next === MIN_SCALE) setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale((prev) => {
      const next = clampScale(prev - e.deltaY * 0.01);
      resetIfAtMinScale(next);
      return next;
    });
  };

  const handleDoubleClick = () => {
    setScale((prev) => {
      const next = prev > MIN_SCALE ? MIN_SCALE : 2;
      resetIfAtMinScale(next);
      return next;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale === MIN_SCALE) return;
    setIsInteracting(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, originX: position.x, originY: position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPosition({ x: dragRef.current.originX + dx, y: dragRef.current.originY + dy });
  };

  const stopDrag = () => {
    dragRef.current = null;
    setIsInteracting(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      setIsInteracting(true);
      pinchRef.current = { startDistance: getTouchDistance(e.touches), startScale: scale };
    } else if (e.touches.length === 1 && scale > MIN_SCALE) {
      setIsInteracting(true);
      dragRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        originX: position.x,
        originY: position.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      const ratio = distance / pinchRef.current.startDistance;
      const next = clampScale(pinchRef.current.startScale * ratio);
      setScale(next);
      resetIfAtMinScale(next);
    } else if (e.touches.length === 1 && dragRef.current) {
      const dx = e.touches[0].clientX - dragRef.current.startX;
      const dy = e.touches[0].clientY - dragRef.current.startY;
      setPosition({ x: dragRef.current.originX + dx, y: dragRef.current.originY + dy });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) pinchRef.current = null;
    if (e.touches.length === 0) {
      dragRef.current = null;
      setIsInteracting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center touch-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 z-10 text-white/80 hover:text-white p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
      >
        <X className="h-6 w-6" />
      </button>

      <div
        className={`w-full h-full overflow-hidden flex items-center justify-center ${
          scale > MIN_SCALE ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-out"
        }`}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={src}
          alt={alt || "Image"}
          className="max-w-[95vw] max-h-[95vh] object-contain select-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isInteracting ? "none" : "transform 0.15s ease-out",
          }}
          draggable={false}
        />
      </div>
    </div>
  );
};

export default ImageLightbox;
