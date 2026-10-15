import { MessageCircle, Phone } from "lucide-react";
import { telLink, whatsappLink } from "@/lib/contact/phone-links";
import { cn } from "@/lib/utils/cn";

const chipClass =
  "inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-white/70 bg-surface px-3 text-sm font-semibold shadow-raised-sm transition hover:shadow-raised active:shadow-pressed";

/** Call and WhatsApp shortcuts. Each message becomes its own WhatsApp button. */
export function ContactActions({
  phone,
  messages = [],
  className,
  compact = false
}: {
  phone: string;
  messages?: { label: string; text: string }[];
  className?: string;
  compact?: boolean;
}) {
  const call = telLink(phone);
  const chat = whatsappLink(phone);
  if (!call && !chat) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {call ? (
        <a href={call} className={cn(chipClass, "text-wine-ink")} aria-label={`Call ${phone}`}>
          <Phone className="h-4 w-4" aria-hidden />
          {compact ? null : "Call"}
        </a>
      ) : null}
      {messages.length === 0 && chat ? (
        <a href={chat} target="_blank" rel="noopener noreferrer" className={cn(chipClass, "text-emerald-700")} aria-label={`WhatsApp ${phone}`}>
          <MessageCircle className="h-4 w-4" aria-hidden />
          {compact ? null : "WhatsApp"}
        </a>
      ) : null}
      {messages.map((message) => {
        const href = whatsappLink(phone, message.text);
        return href ? (
          <a key={message.label} href={href} target="_blank" rel="noopener noreferrer" className={cn(chipClass, "text-emerald-700")}>
            <MessageCircle className="h-4 w-4" aria-hidden />
            {message.label}
          </a>
        ) : null;
      })}
    </div>
  );
}
