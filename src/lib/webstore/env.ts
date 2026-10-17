// Connection to the FemDes webstore (Django) "Online Orders" API.
// Both values are server-only; the page renders a setup notice until they exist.
export function webstoreEnv() {
  const url = (process.env.WEBSTORE_API_URL ?? "").replace(/\/+$/, "");
  const token = process.env.WEBSTORE_API_TOKEN ?? "";
  return { url, token };
}

export function hasWebstoreEnv() {
  const { url, token } = webstoreEnv();
  return Boolean(url && token);
}
