import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Nav } from "@/components/nav";
import { GridOverlay } from "@/components/layout/grid-overlay";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "reverb admin",
  description:
    "Admin UI for reverb — connect your AI CLI to any messaging channel.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground font-sans">
        <Nav />
        {/* Nav and Page both own their horizontal padding, so we keep
            main minimal — just reserves space for the 56px fixed header
            plus the page's top breathing room. */}
        <main className="w-full pt-[calc(theme(spacing.14)+theme(spacing.8))] pb-12">
          {children}
        </main>
        <Toaster position="top-right" />
        <GridOverlay />
      </body>
    </html>
  );
}
