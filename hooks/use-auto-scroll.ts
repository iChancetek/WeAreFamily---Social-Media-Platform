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
  containerRef: React.Ref<HTMLDivElement>; // Changed from RefObject to Ref
}

export function useAutoScroll(options: UseAutoScrollOptions = {}): UseAutoScrollReturn {
  const {
    speed: initialSpeed = 30, // Default speed fallback
    pauseOnHover = true,
    pauseOnInteraction = true,
    onToggle,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize state lazily to avoid setState in useEffect
  const [isEnabled, setIsEnabled] = useState(() => {
    // SSR-safe check
    if (typeof window === 'undefined') return false;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return false;

    // Load saved preference from localStorage
    try {
      const savedPreference = localStorage.getItem('famio-auto-scroll-enabled');
      if (savedPreference !== null) {
        return savedPreference === 'true';
      }
    } catch (error) {
      console.warn('Failed to load auto-scroll preference:', error);
    }

    // Default to true (enabled)
    return true;
  });

  // Load speed from localStorage
  const [speed, setSpeed] = useState(() => {
    if (typeof window === 'undefined') return initialSpeed;
    try {
      const savedSpeed = localStorage.getItem('famio-auto-scroll-speed');
      if (savedSpeed !== null) {
        const parsedSpeed = parseInt(savedSpeed, 10);
        return isNaN(parsedSpeed) ? initialSpeed : parsedSpeed;
      }
    } catch (error) {
      console.warn('Failed to load auto-scroll speed:', error);
    }
    return initialSpeed;
  });

  // State for UI reflection (can be slightly delayed)
  const [isPaused, setIsPaused] = useState(false);

  // Refs for synchronous control in animation loop (critical for mobile responsiveness)
  const isPausedRef = useRef(false);
  const isEnabledRef = useRef(isEnabled);
  const speedRef = useRef(speed);

  // Sync refs with state
  useEffect(() => { isEnabledRef.current = isEnabled; }, [isEnabled]);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastTimestampRef = useRef<number | undefined>(undefined);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Helper to sync state and ref
  const setPaused = useCallback((paused: boolean) => {
    isPausedRef.current = paused;
    setIsPaused(paused);
  }, []);

  // Listen for localStorage changes (when settings are updated)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'famio-auto-scroll-enabled' && e.newValue !== null) {
        setIsEnabled(e.newValue === 'true');
      }
      if (e.key === 'famio-auto-scroll-speed' && e.newValue !== null) {
        const newSpeed = parseInt(e.newValue, 10);
        if (!isNaN(newSpeed)) {
          setSpeed(newSpeed);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Track when container becomes available using callback ref
  const [containerReady, setContainerReady] = useState(false);

  const callbackRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      console.log('[Auto-Scroll] ✅ Container mounted');
      const isMobile = typeof navigator !== 'undefined' ? /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) : false;

      const checkScrollability = () => {
        if (node.scrollHeight > node.clientHeight) {
          setContainerReady(true);
        } else {
          // Retry logic tailored for masonry layout
          setTimeout(checkScrollability, 1000);
        }
      };

      if (isMobile) {
        setTimeout(checkScrollability, 500);
      } else {
        checkScrollability();
      }
    } else {
      setContainerReady(false);
    }
  }, []);

  // The Animation Loop
  const animate = useCallback((timestamp: number) => {
    // 1. Immediate exit checks using Refs for zero-latency
    if (!containerRef.current || isPausedRef.current || !isEnabledRef.current) {
      lastTimestampRef.current = undefined;
      return;
    }

    if (!lastTimestampRef.current) {
      lastTimestampRef.current = timestamp;
    }

    const deltaTime = timestamp - lastTimestampRef.current;

    // 2. Accumulate fractional scroll to ensure smooth movement even at low speeds
    // (Browsers handle sub-pixel scrollTop, but discrete updates are safer)
    const pixelsToScroll = (speedRef.current * deltaTime) / 1000;

    const container = containerRef.current;

    // 3. Safety check: detect if user has manually scrolled far away (simple fight detection)
    // Actually, handling this via events is better.

    // Apply scroll
    if (container.scrollHeight - container.scrollTop - container.clientHeight < 1) {
      // Reached bottom - Loop logic
      // For now, just stop or reset? 
      // Seamless loop:
      container.scrollTo({ top: 0, behavior: 'smooth' });
      lastTimestampRef.current = undefined;

      // Pause briefly at top
      // We can't block the loop, so we manage a "top pause" state or just reliance on resume logic?
      // Let's simple reset for now.
    } else {
      container.scrollTop += pixelsToScroll;
    }

    lastTimestampRef.current = timestamp;
    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  // Start/Stop Engine
  useEffect(() => {
    if (isEnabled && containerReady && !isPaused) {
      // Start
      if (!animationFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };
  }, [isEnabled, containerReady, isPaused, animate]);

  // Event Handlers for Interactions (The Critical Fix for "Fighting")
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleUserInteraction = () => {
      // 1. IMPORTANT: Set ref immediately to stop the animation loop next frame
      isPausedRef.current = true;
      setIsPaused(true);

      // 2. Clear any pending resume
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
      }

      // 3. Schedule Resume
      if (pauseOnInteraction) {
        resumeTimeoutRef.current = setTimeout(() => {
          // Only resume if still enabled globally
          if (isEnabledRef.current) {
            isPausedRef.current = false;
            setIsPaused(false);
            // Restart loop if needed (useEffect will handle, or we can trigger manually if needed)
            // But simply changing state triggers useEffect, which restarts loop.
          }
        }, 2000);
      }
    };

    // Passive listeners for best performance
    container.addEventListener('touchstart', handleUserInteraction, { passive: true });
    container.addEventListener('wheel', handleUserInteraction, { passive: true });
    container.addEventListener('touchmove', handleUserInteraction, { passive: true }); // Continuous detection

    // 'scroll' event fires on auto-scroll too, so we need to be careful.
    // We rely on touchstart/wheel to detect *intent*.
    // However, momentum scrolling triggers 'scroll' but no touch events.
    // This is tricky. 

    // Fix: Listen for 'mousedown' as well for desktop drag bars
    container.addEventListener('mousedown', handleUserInteraction, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleUserInteraction);
      container.removeEventListener('wheel', handleUserInteraction);
      container.removeEventListener('touchmove', handleUserInteraction);
      container.removeEventListener('mousedown', handleUserInteraction);
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, [containerReady, pauseOnInteraction]); // Re-bind if container changes

  // Hover Pause Logic
  useEffect(() => {
    if (!pauseOnHover || !containerRef.current) return;
    const container = containerRef.current;

    const handleMouseEnter = () => {
      isPausedRef.current = true;
      setIsPaused(true);
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };

    const handleMouseLeave = () => {
      // Resume logic similar to interaction
      resumeTimeoutRef.current = setTimeout(() => {
        if (isEnabledRef.current) {
          isPausedRef.current = false;
          setIsPaused(false);
        }
      }, 500);
    };

    // Only apply hover logic on non-touch devices ideally, but mouseenter works fine usually.
    // On mobile, tapping can trigger hover styles sometimes, but touchstart handles the real pause.
    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [containerReady, pauseOnHover]);


  // Toggle Public API
  const toggleAutoScroll = useCallback(() => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    isEnabledRef.current = newState;

    try {
      localStorage.setItem('famio-auto-scroll-enabled', String(newState));
    } catch (e) { }

    if (onToggle) onToggle(newState);
  }, [isEnabled, onToggle]);

  const combinedRef = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
    callbackRef(node);
  }, [callbackRef]);

  return {
    isEnabled,
    isPaused,
    toggleAutoScroll,
    pauseAutoScroll: () => setPaused(true),
    resumeAutoScroll: () => setPaused(false),
    containerRef: combinedRef,
  };
}
