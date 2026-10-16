import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PDF routes read fonts and the logo from disk at runtime; make sure Vercel bundles them.
  outputFileTracingIncludes: {
    "/api/receipts/**": ["./src/assets/fonts/**/*", "./public/Logo.PNG"],
    "/bill/**": ["./src/assets/fonts/**/*", "./public/Logo.PNG"]
  },
  experimental: {
    // Cross-fade between pages using the browser's View Transitions API (ignored where unsupported).
    viewTransition: true,
    serverActions: {
      bodySizeLimit: "4mb"
    }
  }
};

export default nextConfig;
