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
  /* Removed unused pauseTimeoutRef */
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
  const checkTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const callbackRef = useCallback((node: HTMLDivElement | null) => {
    // Clear any existing check
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    if (node) {
      console.log('[Auto-Scroll] ✅ Container mounted');
      const isMobile = typeof navigator !== 'undefined' ? /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) : false;

      const checkScrollability = () => {
        if (!node.isConnected) return; // Stop if detached

        if (node.scrollHeight > node.clientHeight) {
          setContainerReady(true);
        } else {
          // Retry logic tailored for masonry layout
          checkTimeoutRef.current = setTimeout(checkScrollability, 1000);
        }
      };

      if (isMobile) {
        checkTimeoutRef.current = setTimeout(checkScrollability, 500);
      } else {
        checkScrollability();
      }
    } else {
      setContainerReady(false);
    }
  }, []);

  // ... (animate stays the same) ...

  // Toggle Public API
  const toggleAutoScroll = useCallback(() => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    isEnabledRef.current = newState;

    try {
      localStorage.setItem('famio-auto-scroll-enabled', String(newState));
    } catch (e) {
      // Ignore storage errors 
    }

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
