import * as React from "react"

const MOBILE_BREAKPOINT = 768

const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function subscribe(onStoreChange: () => void) {
  const mql = window.matchMedia(MOBILE_QUERY)
  mql.addEventListener("change", onStoreChange)
  return () => mql.removeEventListener("change", onStoreChange)
}

function getSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT
}

// The server has no viewport to measure. Returning `false` matches what the
// previous implementation rendered on its first pass, so hydration behaviour
// is unchanged.
function getServerSnapshot() {
  return false
}

/**
 * Reports whether the viewport is narrower than MOBILE_BREAKPOINT.
 *
 * Uses `useSyncExternalStore` rather than `useState` plus an effect. The
 * effect version had to call `setIsMobile` synchronously inside the effect
 * body to seed the initial value, which cascades an extra render on every
 * mount and is flagged by `react-hooks/set-state-in-effect`. Treating the
 * viewport as the external store removes the effect altogether.
 */
export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
