import "@/styles/globals.css";
import "@vendcfo/ui/globals.css";
import type { Metadata } from "next";
import type { ReactElement } from "react";

export const metadata: Metadata = {
  title: "VendCFO Calculators",
  description:
    "Free vending business calculators - margin, markup, break-even, cash flow, and more.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function EmbedLayout({
  children,
}: {
  children: ReactElement;
}) {
  return children;
}
