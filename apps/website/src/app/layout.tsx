import "@/styles/globals.css";
import { cn } from "@vendcfo/ui/cn";
import "@vendcfo/ui/globals.css";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import { Provider as Analytics } from "@vendcfo/events/client";
import type { Metadata } from "next";
import { Hedvig_Letters_Sans, Hedvig_Letters_Serif } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactElement } from "react";
import { baseUrl } from "./sitemap";

const hedvigSans = Hedvig_Letters_Sans({
  weight: "400",
  subsets: ["latin"],
  display: "optional",
  variable: "--font-hedvig-sans",
  preload: true,
  adjustFontFallback: true,
  fallback: ["system-ui", "arial"],
});

const hedvigSerif = Hedvig_Letters_Serif({
  weight: "400",
  subsets: ["latin"],
  display: "optional",
  variable: "--font-hedvig-serif",
  preload: true,
  adjustFontFallback: true,
  fallback: ["Georgia", "Times New Roman", "serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Run your business finances without manual work | VendCFO",
    template: "%s | VendCFO",
  },
  description:
    "VendCFO gives you one place for transactions, receipts, invoices and everything around your business finances without manual work.",
  openGraph: {
    title: "Run your business finances without manual work | VendCFO",
    description:
      "VendCFO gives you one place for transactions, receipts, invoices and everything around your business finances without manual work.",
    url: baseUrl,
    siteName: "VendCFO",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://cdn.vendhub.com/opengraph-image-v1.jpg",
        width: 800,
        height: 600,
      },
      {
        url: "https://cdn.vendhub.com/opengraph-image-v1.jpg",
        width: 1800,
        height: 1600,
      },
    ],
  },
  twitter: {
    title: "Run your business finances without manual work | VendCFO",
    description:
      "VendCFO gives you one place for transactions, receipts, invoices and everything around your business finances without manual work.",
    images: [
      {
        url: "https://cdn.vendhub.com/opengraph-image-v1.jpg",
        width: 800,
        height: 600,
      },
      {
        url: "https://cdn.vendhub.com/opengraph-image-v1.jpg",
        width: 1800,
        height: 1600,
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)" },
    { media: "(prefers-color-scheme: dark)" },
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "VendCFO",
  url: "https://vendhub.com",
  logo: "https://cdn.vendhub.com/logo.png",
  sameAs: [
    "https://x.com/vendhubai",
    "https://github.com/vendhub-ai/vendhub",
    "https://linkedin.com/company/vendhub-ai",
  ],
  description:
    "VendCFO gives you one place for transactions, receipts, invoices and everything around your business finances without manual work.",
};

export default function Layout({ children }: { children: ReactElement }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn.vendhub.com" />
        <link rel="dns-prefetch" href="https://cdn.vendhub.com" />
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data requires innerHTML
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </head>
      <body
        className={cn(
          `${hedvigSans.variable} ${hedvigSerif.variable} font-sans`,
          "bg-background overflow-x-hidden font-sans antialiased",
        )}
      >
        <NuqsAdapter>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Header />
            <main className="container mx-auto px-4 overflow-hidden md:overflow-visible">
              {children}
            </main>
            <Footer />
            <Analytics />
          </ThemeProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
