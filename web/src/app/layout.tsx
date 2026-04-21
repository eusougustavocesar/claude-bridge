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
  title: "claude-bridge admin",
  description:
    "Admin UI for claude-bridge — persistent Claude Code across messaging channels.",
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
        {/* pt-14 reserves space for the 56px fixed header, pt-8 is the
            page's own top breathing room */}
        <main className="w-full px-6 pt-[calc(theme(spacing.14)+theme(spacing.8))] pb-12">
          {children}
        </main>
        <Toaster position="top-right" />
        <GridOverlay />
      </body>
    </html>
  );
}
