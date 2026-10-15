/** Up to two initials from the words of a name that start with a letter. */
export function initialsFor(name: string) {
  const words = name.split(/\s+/).filter((word) => /^\p{L}/u.test(word));
  return words
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("") || "?";
}
