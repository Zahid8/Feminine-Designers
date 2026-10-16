import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Headings: Fraunces, a soft boutique serif that stays readable at small sizes.
const serif = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap"
});

// Body and UI: Plus Jakarta Sans, warm and very legible, with tabular figures for money columns.
const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Feminine Designer by Sajida",
  description: "Tailoring order management, measurements, payments, and receipts.",
  applicationName: "Feminine Designer",
  appleWebApp: { capable: true, title: "Feminine Designer", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }]
  }
};

export const viewport: Viewport = {
  themeColor: "#7d1f36",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${serif.variable} ${sans.variable}`}>{children}</body>
    </html>
  );
}
