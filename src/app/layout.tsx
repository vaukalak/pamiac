import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono, Outfit } from "next/font/google";
import { QueryProvider } from "@/components/query-provider";
import { appBaseUrl } from "@/lib/config";
import { SHARE_APP_DESCRIPTION, SHARE_APP_TITLE } from "@/lib/share-preview";
import "./globals.css";

const sans = Outfit({ subsets: ["latin"], variable: "--font-sans" });
const serif = Fraunces({ subsets: ["latin"], variable: "--font-serif" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(appBaseUrl()),
  title: SHARE_APP_TITLE,
  description: SHARE_APP_DESCRIPTION,
  openGraph: {
    title: SHARE_APP_TITLE,
    description: SHARE_APP_DESCRIPTION,
    siteName: SHARE_APP_TITLE,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SHARE_APP_TITLE,
    description: SHARE_APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3efe4" },
    { media: "(prefers-color-scheme: dark)", color: "#141210" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${serif.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
