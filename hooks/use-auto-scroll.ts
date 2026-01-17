'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseAutoScrollOptions {
  enabled?: boolean;
  speed?: number; // pixels per second
  pauseOnHover?: boolean;
  pauseOnInteraction?: boolean;
  onToggle?: (enabled: boolean) => void;
}

interface UseAutoScrollReturn {
  isEnabled: boolean;
  isPaused: boolean;
  toggleAutoScroll: () => void;
  pauseAutoScroll: () => void;
  resumeAutoScroll: () => void;
  containerRef: (node: HTMLDivElement | null) => void;
}

// Extend HTMLDivElement to safely store the observer
interface ScrollableElement extends HTMLDivElement {
  _resizeObserver?: ResizeObserver;
}

export function useAutoScroll(options: UseAutoScrollOptions = {}): UseAutoScrollReturn {
  const {
    speed: initialSpeed = 30, // Default speed fallback
    pauseOnHover = true, // Default to true for desktop friendliness
    pauseOnInteraction = true,
    onToggle,
  } = options;

  const containerRef = useRef<ScrollableElement>(null);

  // Flag to distinguish internal vs external scroll events
  // This is critical to prevent "fighting" on mobile
  const isAutoScrolling = useRef(false);

  // Initialize state lazily
  const [isEnabled, setIsEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return false;
    try {
      const savedPreference = localStorage.getItem('famio-auto-scroll-enabled');
      if (savedPreference !== null) return savedPreference === 'true';
    } catch (error) { }
    return true; // Default enabled
  });

  const [speed, setSpeed] = useState(() => {
    if (typeof window === 'undefined') return initialSpeed;
    try {
      const savedSpeed = localStorage.getItem('famio-auto-scroll-speed');
      if (savedSpeed !== null) {
        const parsedSpeed = parseInt(savedSpeed, 10);
        return isNaN(parsedSpeed) ? initialSpeed : parsedSpeed;
      }
    } catch (error) { }
    return initialSpeed;
  });

  const [isPaused, setIsPaused] = useState(false);

  // Refs for synchronous loop control (Zero Latency)
  const isPausedRef = useRef(false);
  const isEnabledRef = useRef(isEnabled);
  const speedRef = useRef(speed);

  useEffect(() => { isEnabledRef.current = isEnabled; }, [isEnabled]);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastTimestampRef = useRef<number | undefined>(undefined);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Helper to sync state and ref
  const setPaused = useCallback((paused: boolean) => {
    isPausedRef.current = paused;
    setIsPaused(paused);
  }, []);

  // Listen for localStorage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'famio-auto-scroll-enabled' && e.newValue !== null) {
        setIsEnabled(e.newValue === 'true');
      }
      if (e.key === 'famio-auto-scroll-speed' && e.newValue !== null) {
        const newSpeed = parseInt(e.newValue, 10);
        if (!isNaN(newSpeed)) setSpeed(newSpeed);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Track when container is scrollable using ResizeObserver
  const [containerReady, setContainerReady] = useState(false);

  const callbackRef = useCallback((node: HTMLDivElement | null) => {
    // Cleanup previous observer if node is changing
    const prevNode = containerRef.current;
    if (prevNode && prevNode._resizeObserver) {
      prevNode._resizeObserver.disconnect();
    }

    containerRef.current = node as ScrollableElement;

    if (node) {
      console.log('[Auto-Scroll] ✅ Container mounted');

      const checkScrollability = () => {
        const isScrollable = node.scrollHeight > node.clientHeight;
        if (isScrollable) {
          setContainerReady(true);
        }
      };

      // Initial check
      checkScrollability();

      // Observe size changes (content loading, window resize)
      const observer = new ResizeObserver(() => {
        checkScrollability();
      });

      observer.observe(node);

      // Store on node for cleanup
      (node as ScrollableElement)._resizeObserver = observer;

    } else {
      setContainerReady(false);
    }
  }, []);


  // The Animation Loop
  const animate = useCallback((timestamp: number) => {
    if (!containerRef.current || isPausedRef.current || !isEnabledRef.current) {
      lastTimestampRef.current = undefined;
      return;
    }

    if (!lastTimestampRef.current) {
      lastTimestampRef.current = timestamp;
    }

    const deltaTime = timestamp - lastTimestampRef.current;

    // Cap delta time to prevent huge jumps if tab was inactive
    const safeDelta = Math.min(deltaTime, 50);

    const pixelsToScroll = (speedRef.current * safeDelta) / 1000;
    const container = containerRef.current;


    // Loop logic
    if (container.scrollHeight - container.scrollTop - container.clientHeight < 1) {
      // Reset to top
      isAutoScrolling.current = true; // Mark as internal
      container.scrollTo({ top: 0 });
      lastTimestampRef.current = undefined;
    } else {
      // Perform Scroll
      isAutoScrolling.current = true; // Mark as internal
      container.scrollTop += pixelsToScroll;
    }

    lastTimestampRef.current = timestamp;
    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);


  // Interaction Handler
  const handleInteraction = useCallback(() => {
    // Ignore if this event was triggered by our own scroll
    if (isAutoScrolling.current) {
      isAutoScrolling.current = false;
      return;
    }

    // User Interaction detected
    if (!isPausedRef.current) {
      console.log('[Auto-Scroll] User interaction -> Pausing');
      setPaused(true);
    }

    // Reset Resume Timer
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }

    if (pauseOnInteraction) {
      resumeTimeoutRef.current = setTimeout(() => {
        if (isEnabledRef.current) {
          console.log('[Auto-Scroll] Inactivity -> Resuming');
          setPaused(false);
        }
      }, 2000); // 2 seconds resume delay
    }
  }, [pauseOnInteraction, setPaused, isEnabled]);


  // Event Listeners setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use 'scroll' event as the source of truth for ALL movement
    const onScroll = () => {
      handleInteraction();
    };

    // Need to listen to touchstart specifically for immediate pause before scroll happens
    const onTouchStart = () => {
      isAutoScrolling.current = false; // Force user intent
      handleInteraction();
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('wheel', onTouchStart, { passive: true }); //Wheel also immediate
    container.addEventListener('mousedown', onTouchStart, { passive: true });

    return () => {
      container.removeEventListener('scroll', onScroll);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('wheel', onTouchStart);
      container.removeEventListener('mousedown', onTouchStart);
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, [containerReady, handleInteraction]);


  // Hover Logic (Desktop)
  useEffect(() => {
    if (!pauseOnHover || !containerRef.current) return;
    const container = containerRef.current;

    const onMouseEnter = () => {
      setPaused(true);
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };

    const onMouseLeave = () => {
      // Resume logic
      resumeTimeoutRef.current = setTimeout(() => {
        if (isEnabledRef.current) {
          setPaused(false);
        }
      }, 500);
    };

    container.addEventListener('mouseenter', onMouseEnter);
    container.addEventListener('mouseleave', onMouseLeave);

    return () => {
      container.removeEventListener('mouseenter', onMouseEnter);
      container.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [containerReady, pauseOnHover, setPaused]);


  // Start/Stop Loop
  useEffect(() => {
    if (isEnabled && containerReady && !isPaused) {
      if (!animationFrameRef.current) {
        console.log('[Auto-Scroll] Starting Loop');
        lastTimestampRef.current = undefined;
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    } else {
      // cleanup
      if (animationFrameRef.current) {
        console.log('[Auto-Scroll] Stopping Loop');
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    }
  }, [isEnabled, containerReady, isPaused, animate]);


  // Public toggle
  const toggleAutoScroll = useCallback(() => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    isEnabledRef.current = newState;
    try {
      localStorage.setItem('famio-auto-scroll-enabled', String(newState));
    } catch (e) { }
    if (onToggle) onToggle(newState);
  }, [isEnabled, onToggle]);

  return {
    isEnabled,
    isPaused,
    toggleAutoScroll,
    pauseAutoScroll: () => setPaused(true),
    resumeAutoScroll: () => setPaused(false),
    containerRef: callbackRef, // Use callback ref directly
  };
}
