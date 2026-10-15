/**
 * WhatsApp needs the full international number without "+" or spaces.
 * Stored numbers are Indian mobiles, usually 10 digits.
 */
export function whatsappNumber(phone: string): string | undefined {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = digits.replace(/^0+/, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  return digits.length >= 11 ? digits : undefined;
}

export function whatsappLink(phone: string, message?: string): string | undefined {
  const number = whatsappNumber(phone);
  if (!number) return undefined;
  return `https://wa.me/${number}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

export function telLink(phone: string): string | undefined {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : undefined;
}
