import { Icons } from "@vendcfo/ui/icons";
import { ArrowRight, Database, MessageCircle, MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Welcome to Beta | VendCFO",
};

const STEPS = [
  {
    num: 1,
    title: "Connect Your Data",
    description:
      "Import your vending transaction data via CSV upload or connect a bank account. VendCFO will automatically categorize every transaction.",
    icon: Database,
  },
  {
    num: 2,
    title: "Talk to Route CFO",
    description:
      "Ask our AI assistant anything about your vending business -- profitability by location, expense trends, restocking optimization, and more.",
    icon: MessageSquare,
  },
  {
    num: 3,
    title: "Give Feedback",
    description:
      "Use the feedback button in the bottom-left corner to tell us what is working, what is not, and what features you want next. Your input shapes the product.",
    icon: MessageCircle,
  },
];

export default function BetaWelcomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Icons.LogoSmall className="h-8 w-auto" />
        </div>

        {/* Heading */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Welcome to VendCFO Beta
          </h1>
          <p className="text-[#878787] text-base max-w-lg mx-auto">
            You are one of the first vending operators to try VendCFO.
            Here is how to get the most out of your beta experience.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-6 mb-10">
          {STEPS.map((step) => (
            <div
              key={step.num}
              className="flex items-start gap-4 p-5 bg-white border border-[#e0e0e0] rounded-lg"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#f5f5f5] border border-[#e0e0e0] flex items-center justify-center">
                <step.icon size={18} className="text-[#555]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  Step {step.num}: {step.title}
                </h3>
                <p className="text-sm text-[#878787] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex justify-center mb-12">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-md text-sm font-medium hover:opacity-90 transition-opacity min-h-[44px]"
          >
            Get Started
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Contact */}
        <div className="text-center border-t border-[#e0e0e0] pt-6">
          <p className="text-sm text-[#878787]">
            Questions or issues? Reach out anytime.
          </p>
          <p className="text-sm text-foreground mt-1">
            <a
              href="mailto:adam@vendcfo.com"
              className="underline hover:opacity-70"
            >
              adam@vendcfo.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
