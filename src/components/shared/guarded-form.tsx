"use client";

import type { ComponentProps } from "react";
import { useUnsavedChangesGuard } from "@/lib/ui/use-unsaved-changes-guard";

/** A <form> that warns before the tab closes while it has unsaved edits. */
export function GuardedForm(props: ComponentProps<"form">) {
  const guard = useUnsavedChangesGuard();
  return (
    <form
      {...props}
      onChange={(event) => {
        guard.onChange();
        props.onChange?.(event);
      }}
      onSubmit={(event) => {
        guard.onSubmit();
        props.onSubmit?.(event);
      }}
    />
  );
}
