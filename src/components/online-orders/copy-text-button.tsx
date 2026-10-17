"use client";

import { Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Copies text (e.g. delivery details for a courier) to the clipboard. */
export function CopyTextButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy:", text);
    }
  }
  return (
    <Button type="button" variant="secondary" onClick={copy}>
      <Copy className="h-4 w-4" aria-hidden />
      {copied ? "Copied" : label}
    </Button>
  );
}
