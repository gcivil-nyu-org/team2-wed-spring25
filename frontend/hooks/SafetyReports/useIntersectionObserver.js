"use client";
import { useRef, useCallback, useEffect } from 'react';

export function useIntersectionObserver(onIntersect, enabled = true, options = {}) {
  const observerRef = useRef(null);
  
  // Create callback that will be passed to IntersectionObserver
  const callback = useCallback((entries) => {
    if (entries[0].isIntersecting && enabled) {
      onIntersect();
    }
  }, [onIntersect, enabled]);
  
  // Create ref callback to attach to observed element
  const refCallback = useCallback(node => {
    // First disconnect any existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    // Reset ref if no node
    if (!node || !enabled) return;
    
    // Create new observer and observe the node
    observerRef.current = new IntersectionObserver(callback, {
      threshold: 0.1,
      ...options
    });
    
    observerRef.current.observe(node);
  }, [callback, enabled, options]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);
  
  return refCallback;
}