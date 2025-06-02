import { useState, useRef, useEffect } from 'react';

export function useClickOutside<T extends HTMLElement>(initialVisible: boolean) {
  const [isVisible, setIsVisible] = useState(initialVisible);
  const ref = useRef<T>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      setIsVisible(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return { ref, isVisible, setIsVisible };
}