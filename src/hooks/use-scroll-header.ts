import { useState, useEffect, useRef } from "react";

interface UseScrollHeaderOptions {
  /**
   * Minimum scroll distance before triggering hide/show
   * @default 8
   */
  threshold?: number;
  /**
   * Scroll position near the top where header should always remain visible
   * @default 50
   */
  topOffset?: number;
  /**
   * If true, keeps the header visible (e.g. when menu or modal is open)
   * @default false
   */
  isLocked?: boolean;
}

export function useScrollHeader({
  threshold = 8,
  topOffset = 50,
  isLocked = false,
}: UseScrollHeaderOptions = {}) {
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollY = useRef(0);
  const isLockedRef = useRef(isLocked);

  useEffect(() => {
    isLockedRef.current = isLocked;
    if (isLocked) {
      setIsVisible(true);
    }
  }, [isLocked]);

  useEffect(() => {
    // Initial sync
    const initialScrollY = Math.max(0, window.scrollY);
    lastScrollY.current = initialScrollY;
    setIsScrolled(initialScrollY > 10);

    const handleScroll = () => {
      if (isLockedRef.current) return;

      const currentScrollY = Math.max(0, window.scrollY);
      const prevScrollY = lastScrollY.current;
      const diff = currentScrollY - prevScrollY;

      setIsScrolled(currentScrollY > 10);

      // Always show when near the very top of the page
      if (currentScrollY <= topOffset) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // Ignore small jitter
      if (Math.abs(diff) < threshold) {
        return;
      }

      // Scrolling down -> hide header
      if (diff > 0 && currentScrollY > topOffset) {
        setIsVisible(false);
      }
      // Scrolling up -> show header
      else if (diff < 0) {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [threshold, topOffset]);

  return { isVisible, isScrolled };
}
