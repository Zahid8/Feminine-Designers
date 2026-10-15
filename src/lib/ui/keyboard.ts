/** True when the key event comes from somewhere the user is typing text. */
export function isTypingTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  return Boolean(element?.closest?.("input, textarea, select, [contenteditable=''], [contenteditable='true']"));
}

/** Single-key shortcuts must not fire while typing or alongside modifier keys (Ctrl+N etc.). */
export function isPlainShortcut(event: KeyboardEvent) {
  return !event.altKey && !event.ctrlKey && !event.metaKey && !isTypingTarget(event.target);
}
