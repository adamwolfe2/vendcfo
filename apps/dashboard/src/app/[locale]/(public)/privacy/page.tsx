import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | VendCFO",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-sm text-[#878787] mb-4">Last updated: March 2026</p>
        <div className="space-y-4 text-sm text-[#555] leading-relaxed">
          <p>VendCFO collects and processes your financial data solely to provide our services — financial analysis, reporting, and operational management for vending machine businesses.</p>
          <h2 className="font-semibold text-base mt-6">Data We Collect</h2>
          <p>Account information (name, email), financial transactions, invoice data, machine and location data, and usage analytics.</p>
          <h2 className="font-semibold text-base mt-6">How We Use Your Data</h2>
          <p>To generate financial reports, AI-powered insights, benchmark comparisons, and operational recommendations specific to your vending business.</p>
          <h2 className="font-semibold text-base mt-6">Third-Party Integrations</h2>
          <p>When you connect QuickBooks, Plaid, or other services, we access your data from those platforms to sync with VendCFO. We do not store your login credentials for these services — we use industry-standard OAuth tokens.</p>
          <h2 className="font-semibold text-base mt-6">Data Security</h2>
          <p>All data is encrypted in transit (TLS) and at rest. Database access is restricted by row-level security policies scoped to your team.</p>
          <h2 className="font-semibold text-base mt-6">Contact</h2>
          <p>For privacy inquiries, contact privacy@vendcfo.com.</p>
        </div>
      </div>
    </div>
  );
}
