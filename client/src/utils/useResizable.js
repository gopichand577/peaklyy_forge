import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hook for smooth, draggable panel resizing with boundary constraints,
 * iframe/Monaco event safety, touch support, and localStorage persistence.
 */
export function useResizable({
  initialSplit = 50,
  min = 20,
  max = 80,
  direction = "horizontal", // 'horizontal' = width splitter (left/right), 'vertical' = height splitter (top/bottom)
  storageKey = null,
}) {
  const [split, setSplit] = useState(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved !== null) {
          const num = parseFloat(saved);
          if (!isNaN(num) && num >= min && num <= max) {
            return num;
          }
        }
      } catch {}
    }
    return initialSplit;
  });

  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const startResize = useCallback((e) => {
    if (e.button !== undefined && e.button !== 0) return; // Only primary mouse button
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const resetSplit = useCallback(() => {
    setSplit(initialSplit);
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, String(initialSplit));
      } catch {}
    }
  }, [initialSplit, storageKey]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      let clientPos;
      if (e.touches && e.touches.length > 0) {
        clientPos = direction === "horizontal" ? e.touches[0].clientX : e.touches[0].clientY;
      } else {
        clientPos = direction === "horizontal" ? e.clientX : e.clientY;
      }

      let newPercentage;
      if (direction === "horizontal") {
        const offset = clientPos - rect.left;
        newPercentage = (offset / rect.width) * 100;
      } else {
        const offset = clientPos - rect.top;
        newPercentage = (offset / rect.height) * 100;
      }

      // Constrain within min and max
      const clamped = Math.max(min, Math.min(max, newPercentage));
      setSplit(clamped);
    };

    const handleEnd = () => {
      setIsDragging(false);
      setSplit((current) => {
        if (storageKey) {
          try {
            localStorage.setItem(storageKey, String(current));
          } catch {}
        }
        return current;
      });
    };

    // Attach listeners to window
    window.addEventListener("mousemove", handleMove, { passive: false });
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd);
    window.addEventListener("touchcancel", handleEnd);

    // Prevent text selection across the page while dragging
    document.body.style.userSelect = "none";
    document.body.style.cursor = direction === "horizontal" ? "col-resize" : "row-resize";

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
      window.removeEventListener("touchcancel", handleEnd);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDragging, direction, min, max, storageKey]);

  return {
    split,
    setSplit,
    isDragging,
    startResize,
    resetSplit,
    containerRef,
  };
}
