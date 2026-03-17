import "@/styles/globals.css";
import { cn } from "@vendcfo/ui/cn";
import "@vendcfo/ui/globals.css";
import { DesktopHeader } from "@/components/desktop-header";
import { isDesktopApp } from "@/utils/desktop";
import { Provider as Analytics } from "@vendcfo/events/client";
import { Toaster } from "@vendcfo/ui/toaster";
import type { Metadata } from "next";
import { Hedvig_Letters_Sans, Hedvig_Letters_Serif } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactElement } from "react";
import { Providers } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://app.vendhub.com"),
  title: "VendCFO | Your AI-Powered Business Assistant",
  description:
    "Automate financial tasks, stay organized, and make informed decisions effortlessly.",
  twitter: {
    title: "VendCFO | Your AI-Powered Business Assistant",
    description:
      "Automate financial tasks, stay organized, and make informed decisions effortlessly.",
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
  openGraph: {
    title: "VendCFO | Your AI-Powered Business Assistant",
    description:
      "Automate financial tasks, stay organized, and make informed decisions effortlessly.",
    url: "https://app.vendhub.com",
    siteName: "VendCFO",
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
    locale: "en_US",
    type: "website",
  },
};

const hedvigSans = Hedvig_Letters_Sans({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-hedvig-sans",
});

const hedvigSerif = Hedvig_Letters_Serif({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-hedvig-serif",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)" },
    { media: "(prefers-color-scheme: dark)" },
  ],
};

export default async function Layout({
  children,
  params,
}: {
  children: ReactElement;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isDesktop = await isDesktopApp();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn(isDesktop && "desktop")}
    >
      <body
        className={cn(
          `${hedvigSans.variable} ${hedvigSerif.variable} font-sans`,
          "whitespace-pre-line overscroll-none antialiased",
        )}
      >
        <DesktopHeader />

        <NuqsAdapter>
          <Providers locale={locale}>
            {children}
            <Toaster />
          </Providers>
          <Analytics />
        </NuqsAdapter>
      </body>
    </html>
  );
}
