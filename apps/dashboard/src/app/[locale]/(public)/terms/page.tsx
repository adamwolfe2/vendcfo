import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | VendCFO",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Terms of Service</h1>
        <p className="text-sm text-[#878787] mb-4">Last updated: March 2026</p>
        <div className="space-y-4 text-sm text-[#555] leading-relaxed">
          <p>By using VendCFO, you agree to these terms of service. VendCFO provides financial management tools for vending machine operators.</p>
          <p>Your data is stored securely and is only accessible to your team. We do not sell or share your financial data with third parties.</p>
          <p>VendCFO integrates with third-party services (QuickBooks, Plaid, Stripe) under their respective terms. By connecting these services, you authorize VendCFO to access your data from those platforms.</p>
          <p>VendCFO is not a tax, legal, or investment advisor. Financial analysis and recommendations are for informational purposes only.</p>
          <p>For questions, contact support@vendcfo.com.</p>
        </div>
      </div>
    </div>
  );
}
