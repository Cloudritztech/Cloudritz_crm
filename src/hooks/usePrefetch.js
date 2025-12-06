import { useEffect } from 'react';

export const usePrefetch = (fetchFn, dependencies = []) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFn();
    }, 100);
    
    return () => clearTimeout(timer);
  }, dependencies);
};
