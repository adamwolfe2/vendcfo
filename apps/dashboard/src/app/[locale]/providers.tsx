"use client";

import { DesktopProvider } from "@/components/desktop-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProviderClient } from "@/locales/client";
import { TRPCReactProvider } from "@/trpc/client";
import type { ReactNode } from "react";

type ProviderProps = {
  locale: string;
  children: ReactNode;
};

export function Providers({ locale, children }: ProviderProps) {
  const isMockMode = process.env.NEXT_PUBLIC_MOCK_UI === "true";

  return isMockMode ? (
    <I18nProviderClient locale={locale}>
      <DesktopProvider />
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        forcedTheme="light"
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </I18nProviderClient>
  ) : (
    <TRPCReactProvider>
      <I18nProviderClient locale={locale}>
        <DesktopProvider />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </I18nProviderClient>
    </TRPCReactProvider>
  );
}
