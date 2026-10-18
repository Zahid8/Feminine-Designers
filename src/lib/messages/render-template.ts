export const MESSAGE_PLACEHOLDERS = ["name", "store", "receipt", "items", "total", "paid", "balance", "delivery", "tracking", "bill_link"] as const;
export type MessagePlaceholder = (typeof MESSAGE_PLACEHOLDERS)[number];

/**
 * Fills {placeholders} in a WhatsApp template. When a value is empty (e.g. no bill
 * link), the placeholder is removed together with a short "Label:" in front of it, and
 * lines left empty are dropped. Unknown placeholders stay as typed so typos are visible.
 */
export function renderTemplate(template: string, values: Partial<Record<MessagePlaceholder, string>>) {
  return template
    .split("\n")
    .map((line) => {
      let result = line;
      for (const key of MESSAGE_PLACEHOLDERS) {
        if (values[key]) continue;
        result = result.replace(new RegExp(`[A-Za-z][A-Za-z ]{0,24}:\\s*\\{${key}\\}`, "g"), "").replace(new RegExp(`\\{${key}\\}`, "g"), "");
      }
      return result.replace(/\{([a-z_]+)\}/g, (match, key: string) => values[key as MessagePlaceholder] ?? match);
    })
    .map((line) => line.replace(/[ \t]+([.,!|])/g, "$1").replace(/ {2,}/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}
