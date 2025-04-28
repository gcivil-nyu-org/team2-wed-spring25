"use client";
import { useState, useEffect } from 'react';

export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useDebouncedFunction(fn, delay) {
  const [timeoutId, setTimeoutId] = useState(null);

  const debouncedFn = (...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const newTimeoutId = setTimeout(() => {
      fn(...args);
    }, delay);

    setTimeoutId(newTimeoutId);
  };

  return debouncedFn;
}