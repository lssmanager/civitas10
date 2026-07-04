import { useEffect, useState } from "react";

const BREAKPOINTS = { sm: 480, md: 768, lg: 1024, xl: 1280 } as const;
type Breakpoint = keyof typeof BREAKPOINTS;

export function useBreakpoint(bp: Breakpoint) {
  const query = `(max-width: ${BREAKPOINTS[bp]}px)`;
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    mql.addEventListener("change", handler);
    setMatches(mql.matches);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}
