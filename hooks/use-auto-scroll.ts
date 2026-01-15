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
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function useAutoScroll(options: UseAutoScrollOptions = {}): UseAutoScrollReturn {
  const {
    enabled = true, // Default to true - enable auto-scroll by default
    speed = 30, // 30 pixels per second - calm and smooth
    pauseOnHover = true,
    pauseOnInteraction = true,
    onToggle,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const [isEnabled, setIsEnabled] = useState(false); // Start disabled
  const [isPaused, setIsPaused] = useState(false);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastTimestampRef = useRef<number | undefined>(undefined);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [initialized, setInitialized] = useState(false);

  // Check for reduced motion preference and load saved preference
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setIsEnabled(false);
      setInitialized(true);
      return;
    }

    // Load saved preference from localStorage
    try {
      const savedPreference = localStorage.getItem('famio-auto-scroll-enabled');
      if (savedPreference !== null) {
        setIsEnabled(savedPreference === 'true');
      } else {
        // If no saved preference, use the option parameter
        setIsEnabled(enabled);
      }
    } catch (error) {
      console.warn('Failed to load auto-scroll preference:', error);
      setIsEnabled(enabled);
    }

    setInitialized(true);
  }, [enabled]);

  // Smooth scroll animation using requestAnimationFrame
  useEffect(() => {
    // Only start if initialized to avoid race conditions
    if (!initialized) return;

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
    if (isEnabled && !isPaused) {
      // Cancel any existing animation first
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Start fresh animation
      lastTimestampRef.current = undefined;
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
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
  }, [speed, isPaused, isEnabled, initialized]);

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

  // Pause on click/tap interactions
  useEffect(() => {
    if (!pauseOnInteraction || !containerRef.current) return;

    const container = containerRef.current;

    const handleInteraction = (e: Event) => {
      // Check if the click was on a post card or interactive element
      const target = e.target as HTMLElement;
      const isPostCard = target.closest('[data-post-card]');
      const isVideo = target.closest('video');
      const isButton = target.closest('button');
      const isLink = target.closest('a');

      if (isPostCard || isVideo || isButton || isLink) {
        setIsPaused(true);
      }
    };

    container.addEventListener('click', handleInteraction);
    container.addEventListener('touchstart', handleInteraction);

    return () => {
      container.removeEventListener('click', handleInteraction);
      container.removeEventListener('touchstart', handleInteraction);
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

  return {
    isEnabled,
    isPaused,
    toggleAutoScroll,
    pauseAutoScroll,
    resumeAutoScroll,
    containerRef,
  };
}
