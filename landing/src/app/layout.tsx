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

const SITE_URL = "https://bridge-claude.vercel.app";
const DESCRIPTION =
  "Connect your AI CLI to any messaging channel. WhatsApp first, more soon. Mac stays closed, your AI keeps working.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Reverb — connect your AI CLI to any channel",
    template: "%s · Reverb",
  },
  description: DESCRIPTION,
  keywords: [
    "reverb",
    "ai-cli",
    "claude code",
    "whatsapp",
    "baileys",
    "launchagent",
    "daemon",
    "gemini-cli",
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
    title: "Reverb — connect your AI CLI to any channel",
    description: DESCRIPTION,
    siteName: "Reverb",
    images: [
      {
        url: "/og.png",
        width: 1280,
        height: 640,
        alt: "Reverb",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Reverb",
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
