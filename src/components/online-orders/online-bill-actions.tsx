"use client";

import { Copy, Download, FileText } from "lucide-react";
import { useState } from "react";
import { buttonBaseClass, buttonVariantClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

/** View / download / copy the customer's bill link for an online order. */
export function OnlineBillActions({ billUrl, fileName }: { billUrl: string; fileName: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(billUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy the bill link:", billUrl);
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        <a href={billUrl} target="_blank" rel="noopener" className={cn(buttonBaseClass, buttonVariantClasses.primary)}>
          <FileText className="h-4 w-4" aria-hidden />
          View bill
        </a>
        <a href={`${billUrl}?download=1`} download={fileName} className={cn(buttonBaseClass, buttonVariantClasses.secondary)}>
          <Download className="h-4 w-4" aria-hidden />
          Download PDF
        </a>
        <button type="button" onClick={copy} className={cn(buttonBaseClass, buttonVariantClasses.secondary)}>
          <Copy className="h-4 w-4" aria-hidden />
          {copied ? "Copied" : "Copy bill link"}
        </button>
      </div>
      <p className="break-all rounded-xl bg-surface-sunken px-3 py-2 text-xs text-muted-strong shadow-pressed">{billUrl}</p>
    </div>
  );
}
