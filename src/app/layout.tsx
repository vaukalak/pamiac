import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono, Literata, Manrope, Outfit } from "next/font/google";
import { Suspense } from "react";
import { PostHogPageView } from "@/components/posthog-page-view";
import { PostHogProvider } from "@/components/posthog-provider";
import { QueryProvider } from "@/components/query-provider";
import { ThemeBoot } from "@/components/theme-boot";
import { appBaseUrl } from "@/lib/config";
import { themeInitScript } from "@/lib/theme";
import { appShareTarget, sharePageMetadata, sharePreviewFromDocument } from "@/lib/share-preview";
import "./globals.css";

const sans = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  adjustFontFallback: false,
});
const serif = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  adjustFontFallback: false,
});
const sansCyrillic = Manrope({ subsets: ["cyrillic"], variable: "--font-sans-cyrillic" });
const serifCyrillic = Literata({
  subsets: ["cyrillic"],
  style: ["normal", "italic"],
  variable: "--font-serif-cyrillic",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(appBaseUrl()),
  ...sharePageMetadata(sharePreviewFromDocument(null), appShareTarget()),
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
      className={`${sans.variable} ${serif.variable} ${mono.variable} ${sansCyrillic.variable} ${serifCyrillic.variable}`}
      suppressHydrationWarning
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <PostHogProvider>
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>
          <ThemeBoot />
          <QueryProvider>{children}</QueryProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
