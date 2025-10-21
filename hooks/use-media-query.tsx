import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Ensure window object is available (runs only on client-side)
    if (typeof window !== 'undefined') {
      const mediaQueryList = window.matchMedia(query);

      const listener = (event: MediaQueryListEvent) => {
        setMatches(event.matches);
      };

      // Set initial state
      setMatches(mediaQueryList.matches);

      // Add listener for changes
      // Use addEventListener for modern browsers, addListener for older ones
      if (mediaQueryList.addEventListener) {
        mediaQueryList.addEventListener('change', listener);
      } else {
        mediaQueryList.addListener(listener); // Deprecated but needed for fallback
      }


      // Cleanup listener on component unmount
      return () => {
        if (mediaQueryList.removeEventListener) {
          mediaQueryList.removeEventListener('change', listener);
        } else {
          mediaQueryList.removeListener(listener); // Deprecated fallback
        }
      };
    }
  }, [query]); // Re-run effect if query changes

  return matches;
}