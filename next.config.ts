import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Cross-fade between pages using the browser's View Transitions API (ignored where unsupported).
    viewTransition: true,
    serverActions: {
      bodySizeLimit: "4mb"
    }
  }
};

export default nextConfig;
