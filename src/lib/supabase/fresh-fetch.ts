export const freshSupabaseFetch: typeof fetch = (input, init) =>
  fetch(input, {
    ...init,
    cache: "no-store"
  });
