import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://claude-bridge.vercel.app";
const DESCRIPTION =
  "Persistent bridge between Claude Code and messaging channels. WhatsApp first, more soon. Mac stays closed, Claude keeps working.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "claude-bridge — persistent Claude Code over WhatsApp",
    template: "%s · claude-bridge",
  },
  description: DESCRIPTION,
  keywords: [
    "claude code",
    "claude",
    "anthropic",
    "whatsapp",
    "baileys",
    "launchagent",
    "ai",
    "daemon",
  ],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "claude-bridge — persistent Claude Code over WhatsApp",
    description: DESCRIPTION,
    siteName: "claude-bridge",
    images: [
      {
        url: "/og.png",
        width: 1280,
        height: 640,
        alt: "claude-bridge",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "claude-bridge",
    description: DESCRIPTION,
    images: ["/og.png"],
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
      className={`dark ${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
