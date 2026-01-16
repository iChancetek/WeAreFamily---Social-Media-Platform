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

  const [isPaused, setIsPaused] = useState(false);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastTimestampRef = useRef<number | undefined>(undefined);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Listen for localStorage changes (when settings are updated)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'famio-auto-scroll-enabled' && e.newValue !== null) {
        console.log('[Auto-Scroll] localStorage changed - enabled:', e.newValue);
        setIsEnabled(e.newValue === 'true');
      }
      if (e.key === 'famio-auto-scroll-speed' && e.newValue !== null) {
        const newSpeed = parseInt(e.newValue, 10);
        if (!isNaN(newSpeed)) {
          console.log('[Auto-Scroll] localStorage changed - speed:', newSpeed);
          setSpeed(newSpeed);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);


  // Track when container becomes available using callback ref
  const [containerReady, setContainerReady] = useState(false); // Callback ref tracks when container mounts

  const callbackRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      console.log('[Auto-Scroll] ✅ Container mounted via callback ref');
      console.log('[Auto-Scroll] Container details:', {
        scrollHeight: node.scrollHeight,
        clientHeight: node.clientHeight,
        isScrollable: node.scrollHeight > node.clientHeight,
        className: node.className,
      });
      setContainerReady(true);
    } else {
      console.log('[Auto-Scroll] ❌ Container unmounted');
      setContainerReady(false);
    }
  }, []);

  // Smooth scroll animation using requestAnimationFrame
  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!containerRef.current || isPaused || !isEnabled) {
        lastTimestampRef.current = undefined;
        return;
      }

      // Initialize timestamp on first frame
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }

      const deltaTime = timestamp - lastTimestampRef.current;
      const scrollAmount = (speed * deltaTime) / 1000; // Convert to pixels per frame

      const container = containerRef.current;
      const currentScroll = container.scrollTop;
      const maxScroll = container.scrollHeight - container.clientHeight;

      // Check if we've reached the bottom
      if (currentScroll + scrollAmount >= maxScroll) {
        // Seamless loop: scroll to top smoothly
        container.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
        lastTimestampRef.current = undefined; // Reset for next cycle

        // Pause briefly at the top before resuming
        setTimeout(() => {
          lastTimestampRef.current = timestamp;
          if (containerRef.current && !isPaused && isEnabled) {
            animationFrameRef.current = requestAnimationFrame(animate);
          }
        }, 1000); // 1 second pause at top
      } else {
        // Continue scrolling
        container.scrollTop = currentScroll + scrollAmount;
        lastTimestampRef.current = timestamp;
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    // Start/stop animation based on enabled/paused state
    console.log('[Auto-Scroll] Animation check - isEnabled:', isEnabled, 'isPaused:', isPaused, 'speed:', speed, 'containerReady:', containerReady);

    // Only start if enabled, not paused, AND container exists
    if (isEnabled && !isPaused && containerReady && containerRef.current) {
      console.log('[Auto-Scroll] Starting animation at speed:', speed, 'px/s', 'container exists:', !!containerRef.current);
      // Cancel any existing animation first
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Start fresh animation
      lastTimestampRef.current = undefined;
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      console.log('[Auto-Scroll] Stopping animation - isEnabled:', isEnabled, 'isPaused:', isPaused, 'container:', !!containerRef.current);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
      lastTimestampRef.current = undefined;
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };
  }, [speed, isPaused, isEnabled, containerReady]); // Use containerReady state instead

  // Debug: Log container status on mount
  useEffect(() => {
    console.log('[Auto-Scroll] Container check - exists:', !!containerRef.current,
      'scrollHeight:', containerRef.current?.scrollHeight,
      'clientHeight:', containerRef.current?.clientHeight,
      'isScrollable:', (containerRef.current?.scrollHeight || 0) > (containerRef.current?.clientHeight || 0));
  }, [containerRef]);

  // Pause on hover
  useEffect(() => {
    if (!pauseOnHover || !containerRef.current) return;

    const container = containerRef.current;

    const handleMouseEnter = () => {
      setIsPaused(true);
      // Clear any pending resume timeout
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };

    const handleMouseLeave = () => {
      // Resume after a brief delay
      pauseTimeoutRef.current = setTimeout(() => {
        setIsPaused(false);
      }, 500); // 500ms delay before resuming
    };

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, [pauseOnHover]);

  // Pause on interaction (wheel/touch) with auto-resume
  useEffect(() => {
    if (!pauseOnInteraction || !containerRef.current) return;

    const container = containerRef.current;
    let resumeTimeout: NodeJS.Timeout;

    const handleInteraction = () => {
      console.log('[Auto-Scroll] User interaction detected - pausing');
      setIsPaused(true);

      // Clear existing timeout
      if (resumeTimeout) clearTimeout(resumeTimeout);

      // Resume after 2 seconds of inactivity
      resumeTimeout = setTimeout(() => {
        console.log('[Auto-Scroll] Resuming after inactivity');
        setIsPaused(false);
      }, 2000);
    };

    // Listen for scroll, touch, and wheel events
    container.addEventListener('wheel', handleInteraction, { passive: true });
    container.addEventListener('touchstart', handleInteraction, { passive: true });
    container.addEventListener('touchmove', handleInteraction, { passive: true });

    // Manual scroll detection
    const handleScroll = () => {
      if (!animationFrameRef.current) {
        // User is manually scrolling (not auto-scroll)
        handleInteraction();
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (resumeTimeout) clearTimeout(resumeTimeout);
      container.removeEventListener('wheel', handleInteraction);
      container.removeEventListener('touchstart', handleInteraction);
      container.removeEventListener('touchmove', handleInteraction);
      container.removeEventListener('scroll', handleScroll);
    };
  }, [pauseOnInteraction]);

  // Toggle auto-scroll
  const toggleAutoScroll = useCallback(() => {
    const newState = !isEnabled;
    setIsEnabled(newState);

    // Save preference
    try {
      localStorage.setItem('famio-auto-scroll-enabled', String(newState));
    } catch (error) {
      console.warn('Failed to save auto-scroll preference:', error);
    }

    // Callback for external handling (e.g., server-side preference save)
    if (onToggle) {
      onToggle(newState);
    }
  }, [isEnabled, onToggle]);

  // Manual pause control
  const pauseAutoScroll = useCallback(() => {
    setIsPaused(true);
  }, []);

  // Manual resume control
  const resumeAutoScroll = useCallback(() => {
    setIsPaused(false);
  }, []);

  // Combined ref that updates both containerRef and containerReady state
  const combinedRef = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
    callbackRef(node);
  }, [callbackRef]);

  return {
    isEnabled,
    isPaused,
    toggleAutoScroll,
    pauseAutoScroll,
    resumeAutoScroll,
    containerRef: combinedRef, // Return combined ref
  };
}
