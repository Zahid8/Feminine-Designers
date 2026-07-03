"use client";

import { useState } from "react";
import Image from "next/image";
import { Scissors } from "lucide-react";

export function LogoMark({ compact = false }: { compact?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <div className={compact ? "flex items-center gap-2" : "flex items-center gap-3"}>
      {!imageFailed ? (
        <Image
          src="/Logo.PNG"
          alt="Feminine Designer by Sajida logo"
          width={compact ? 40 : 48}
          height={compact ? 40 : 48}
          className={compact ? "h-10 w-10 rounded-md object-cover shadow-md ring-2 ring-[#f1d0aa]" : "h-12 w-12 rounded-md object-cover shadow-md ring-2 ring-[#f1d0aa]"}
          onError={() => setImageFailed(true)}
          priority={!compact}
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gradient-to-br from-[#7d1f36] to-[#b84862] text-white shadow-md ring-2 ring-[#f1d0aa]">
          <Scissors className="h-6 w-6" />
        </div>
      )}
      <div>
        <p className={compact ? "font-serif text-xl font-semibold leading-none text-[#3f0f20]" : "font-serif text-2xl font-semibold leading-none text-[#3f0f20]"}>
          Feminine Designer
        </p>
        <p className="mt-1 text-sm font-medium text-[#9a5a34]">By Sajida</p>
      </div>
    </div>
  );
}
