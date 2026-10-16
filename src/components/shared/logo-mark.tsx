"use client";

import { useState } from "react";
import Image from "next/image";
import { Scissors } from "lucide-react";

export function LogoMark({ compact = false, iconOnly = false, onDark = false }: { compact?: boolean; iconOnly?: boolean; onDark?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <div className={compact ? "flex items-center gap-2" : "flex items-center gap-3"}>
      {!imageFailed ? (
        <Image
          src="/Logo.PNG"
          alt="Feminine Designer by Sajida logo"
          width={compact ? 40 : 48}
          height={compact ? 40 : 48}
          className={compact ? "h-10 w-10 rounded-xl object-cover shadow-raised-sm ring-2 ring-white" : "h-12 w-12 rounded-xl object-cover shadow-raised-sm ring-2 ring-white"}
          onError={() => setImageFailed(true)}
          priority={!compact}
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-wine to-rose text-white shadow-raised-sm ring-2 ring-white">
          <Scissors className="h-6 w-6" />
        </div>
      )}
      <div className={iconOnly ? "sr-only" : undefined}>
        <p className={`font-serif font-medium leading-none ${compact ? "text-xl" : "text-2xl"} ${onDark ? "text-white" : "text-wine-deep"}`}>
          Feminine Designer
        </p>
        <p className={`mt-1 text-sm font-medium ${onDark ? "text-gold-soft" : "text-bronze"}`}>By Sajida</p>
      </div>
    </div>
  );
}
