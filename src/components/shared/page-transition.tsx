import * as React from "react";

type CanaryReact = typeof React & { ViewTransition?: React.ComponentType<{ children?: React.ReactNode }> };

/**
 * Cross-fades page content during navigation using React's <ViewTransition>.
 * That component only exists in the React build bundled with Next's App Router,
 * so outside it (tests, tooling) this renders its children unchanged.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const ViewTransition = (React as CanaryReact).ViewTransition;
  return ViewTransition ? <ViewTransition>{children}</ViewTransition> : <>{children}</>;
}
