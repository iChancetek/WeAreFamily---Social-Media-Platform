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
    enabled = true,
    speed = 30, // 30 pixels per second - calm and smooth
    pauseOnHover = true,
    pauseOnInteraction = true,
    onToggle,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [isPaused, setIsPaused] = useState(false);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastTimestampRef = useRef<number | undefined>(undefined);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Check for reduced motion preference
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsEnabled(false);
    }
  }, []);

  // Load saved preference from localStorage
  useEffect(() => {
    try {
      const savedPreference = localStorage.getItem('famio-auto-scroll-enabled');
      if (savedPreference !== null) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsEnabled(savedPreference === 'true');
      }
    } catch (error) {
      console.warn('Failed to load auto-scroll preference:', error);
    }
  }, []);

  // Function ref to hold the latest animation function
  const animateFuncRef = useRef<((timestamp: number) => void) | null>(null);

  // Smooth scroll animation using requestAnimationFrame
  useEffect(() => {
    animateFuncRef.current = (timestamp: number) => {
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
          if (containerRef.current && !isPaused && isEnabled && animateFuncRef.current) {
            animationFrameRef.current = requestAnimationFrame(animateFuncRef.current);
          }
        }, 1000); // 1 second pause at top
      } else {
        // Continue scrolling
        container.scrollTop = currentScroll + scrollAmount;
        lastTimestampRef.current = timestamp;
        if (animateFuncRef.current) {
          animationFrameRef.current = requestAnimationFrame(animateFuncRef.current);
        }
      }
    };
  }, [speed, isPaused, isEnabled]);

  // Start/stop animation based on enabled/paused state
  useEffect(() => {
    if (isEnabled && !isPaused && animateFuncRef.current) {
      animationFrameRef.current = requestAnimationFrame(animateFuncRef.current);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      lastTimestampRef.current = undefined;
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isEnabled, isPaused]);

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
