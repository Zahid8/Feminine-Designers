"use client";

import { useEffect, useRef } from "react";

/**
 * Warns before the tab is closed or reloaded while a form has unsaved edits.
 * Spread the returned handlers on the <form>. In-app link navigation is not
 * intercepted (the App Router has no blocking API).
 */
export function useUnsavedChangesGuard() {
  const dirty = useRef(false);

  useEffect(() => {
    function warn(event: BeforeUnloadEvent) {
      if (!dirty.current) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  return {
    onChange: () => {
      dirty.current = true;
    },
    onSubmit: () => {
      dirty.current = false;
    }
  };
}
