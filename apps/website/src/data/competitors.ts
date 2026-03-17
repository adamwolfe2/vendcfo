// Competitor data for SEO comparison pages

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FeatureComparison {
  category: string;
  features: {
    name: string;
    vendhub: boolean | string;
    competitor: boolean | string;
  }[];
}

export interface PricingTier {
  name: string;
  price: string;
  period: string;
  features: string[];
}

export interface Competitor {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  keyDifferences: {
    title: string;
    vendhub: string;
    competitor: string;
  }[];
  features: FeatureComparison[];
  pricing: {
    vendhub: PricingTier[];
    competitor: PricingTier[];
    competitorNote?: string;
  };
  switchingSteps: {
    title: string;
    description: string;
  }[];
  faq: FAQItem[];
  targetAudience: string[];
}

export const vendhubDifferentiators = [
  {
    title: "Built for founders",
    description: "Designed for solo founders and small teams, not accountants",
  },
  {
    title: "Clean, modern interface",
    description: "No clutter, no complexity",
  },
  {
    title: "AI-powered insights",
    description: "Weekly summaries, assistant, automatic categorization",
  },
  {
    title: "Everything in one place",
    description: "Transactions, invoicing, time tracking, receipts",
  },
];

export const vendhubPricing: PricingTier[] = [
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    features: [
      "Financial overview and widgets",
      "Weekly summaries and insights",
      "Transactions with categorization",
      "Receipts and file storage",
      "Up to 10 invoices per month",
      "Time tracking",
      "Up to 2 connected banks",
      "Up to 2 team members",
    ],
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    features: [
      "Everything in Starter",
      "Up to 50 invoices per month",
      "Up to 10 connected banks",
      "Up to 10 team members",
      "Priority support",
    ],
  },
];

export const competitors: Competitor[] = [
  {
    id: "quickbooks",
    slug: "quickbooks-alternative",
    name: "QuickBooks",
    tagline: "Why Founders Switch to VendCFO",
    description:
      "Looking for a QuickBooks alternative? VendCFO offers a cleaner, founder-friendly approach to business finances without the accounting complexity.",
    keyDifferences: [
      {
        title: "Target User",
        vendhub: "Founders and small teams",
        competitor: "Accountants and bookkeepers",
      },
      {
        title: "Learning Curve",
        vendhub: "Intuitive, no training needed",
        competitor: "Steep learning curve",
      },
      {
        title: "Interface",
        vendhub: "Clean, modern design",
        competitor: "Complex, feature-heavy",
      },
      {
        title: "AI Features",
        vendhub: "Built-in AI assistant and insights",
        competitor: "Limited AI capabilities",
      },
    ],
    features: [
      {
        category: "Core Features",
        features: [
          { name: "Bank connections", vendhub: true, competitor: true },
          { name: "Transaction categorization", vendhub: true, competitor: true },
          { name: "Invoicing", vendhub: true, competitor: true },
          { name: "Receipt capture", vendhub: true, competitor: true },
          { name: "Time tracking", vendhub: true, competitor: "Add-on" },
          { name: "AI-powered insights", vendhub: true, competitor: false },
          { name: "Weekly summaries", vendhub: true, competitor: false },
        ],
      },
      {
        category: "User Experience",
        features: [
          { name: "Modern interface", vendhub: true, competitor: false },
          { name: "Mobile app", vendhub: true, competitor: true },
          { name: "No accounting knowledge required", vendhub: true, competitor: false },
          { name: "Quick setup (under 5 min)", vendhub: true, competitor: false },
        ],
      },
    ],
    pricing: {
      vendhub: vendhubPricing,
      competitor: [
        {
          name: "Simple Start",
          price: "$30",
          period: "/month",
          features: [
            "Income & expenses",
            "Invoices & payments",
            "Tax deductions",
            "Mileage tracking",
            "1 user",
          ],
        },
        {
          name: "Essentials",
          price: "$60",
          period: "/month",
          features: [
            "Everything in Simple Start",
            "Bill management",
            "Time tracking",
            "3 users",
          ],
        },
        {
          name: "Plus",
          price: "$90",
          period: "/month",
          features: [
            "Everything in Essentials",
            "Inventory tracking",
            "Project profitability",
            "5 users",
          ],
        },
      ],
      competitorNote: "Prices increase after promotional period ends",
    },
    switchingSteps: [
      {
        title: "Export your data from QuickBooks",
        description:
          "Download your transaction history and customer list as CSV files from QuickBooks.",
      },
      {
        title: "Sign up for VendCFO",
        description:
          "Create your VendCFO account and connect your bank accounts directly.",
      },
      {
        title: "Import your customers",
        description:
          "Add your existing customers to continue invoicing seamlessly.",
      },
      {
        title: "Start fresh with automatic sync",
        description:
          "Your transactions will sync automatically going forward. No manual entry needed.",
      },
    ],
    faq: [
      {
        question: "Is VendCFO a full replacement for QuickBooks?",
        answer:
          "VendCFO is designed for founders who want financial clarity without accounting complexity. If you need advanced accounting features like inventory management or payroll, QuickBooks may be more suitable. But if you want a clean overview of your business finances with less overhead, VendCFO is the better choice.",
      },
      {
        question: "Can my accountant still access my data?",
        answer:
          "Yes. You can export your transactions and reports at any time, or give your accountant direct access to your VendCFO account.",
      },
      {
        question: "What about tax preparation?",
        answer:
          "VendCFO categorizes your transactions and tracks receipts, making tax prep straightforward. You can export everything your accountant needs at tax time.",
      },
      {
        question: "How does pricing compare long-term?",
        answer:
          "VendCFO's pricing is transparent and consistent. QuickBooks often increases prices after promotional periods and charges extra for features like time tracking. With VendCFO, you get more included at a predictable price.",
      },
    ],
    targetAudience: [
      "Solo founders who find QuickBooks overwhelming",
      "Small teams that don't need full accounting software",
      "Founders who want financial clarity without hiring a bookkeeper",
      "Teams that value modern, well-designed tools",
    ],
  },
  {
    id: "freshbooks",
    slug: "freshbooks-alternative",
    name: "FreshBooks",
    tagline: "Why Founders Switch to VendCFO",
    description:
      "Looking for a FreshBooks alternative? VendCFO combines invoicing with transactions, time tracking, and AI-powered insights in one unified workspace.",
    keyDifferences: [
      {
        title: "Focus",
        vendhub: "Complete financial workspace",
        competitor: "Primarily invoicing",
      },
      {
        title: "Bank Connections",
        vendhub: "25,000+ banks worldwide",
        competitor: "Limited bank support",
      },
      {
        title: "AI Features",
        vendhub: "Built-in AI assistant",
        competitor: "Basic automation only",
      },
      {
        title: "Pricing Model",
        vendhub: "Simple, transparent tiers",
        competitor: "Per-client pricing limits",
      },
    ],
    features: [
      {
        category: "Core Features",
        features: [
          { name: "Invoicing", vendhub: true, competitor: true },
          { name: "Time tracking", vendhub: true, competitor: true },
          { name: "Expense tracking", vendhub: true, competitor: true },
          { name: "Bank connections", vendhub: "25,000+ banks", competitor: "Limited" },
          { name: "AI-powered insights", vendhub: true, competitor: false },
          { name: "Receipt matching", vendhub: "Automatic", competitor: "Manual" },
        ],
      },
      {
        category: "Workflow",
        features: [
          { name: "Weekly financial summaries", vendhub: true, competitor: false },
          { name: "Unified dashboard", vendhub: true, competitor: false },
          { name: "Project-based billing", vendhub: true, competitor: true },
          { name: "Recurring invoices", vendhub: true, competitor: true },
        ],
      },
    ],
    pricing: {
      vendhub: vendhubPricing,
      competitor: [
        {
          name: "Lite",
          price: "$19",
          period: "/month",
          features: [
            "5 billable clients",
            "Unlimited invoices",
            "Expense tracking",
            "Time tracking",
          ],
        },
        {
          name: "Plus",
          price: "$33",
          period: "/month",
          features: [
            "50 billable clients",
            "Automatic receipt capture",
            "Double-entry accounting",
            "Business health reports",
          ],
        },
        {
          name: "Premium",
          price: "$60",
          period: "/month",
          features: [
            "Unlimited clients",
            "Project profitability",
            "Email customization",
            "Dedicated support",
          ],
        },
      ],
      competitorNote: "Client limits can be restrictive as you grow",
    },
    switchingSteps: [
      {
        title: "Export invoices and clients",
        description: "Download your client list and invoice history from FreshBooks.",
      },
      {
        title: "Create your VendCFO account",
        description: "Sign up and connect your bank accounts for automatic transaction sync.",
      },
      {
        title: "Import your customer data",
        description: "Add your clients to start sending invoices right away.",
      },
      {
        title: "Set up your invoice template",
        description: "Customize your invoice design and payment terms in VendCFO.",
      },
    ],
    faq: [
      {
        question: "How does invoicing compare?",
        answer:
          "Both offer professional invoicing, but VendCFO connects your invoices directly to your bank transactions and provides AI-powered insights into your cash flow. You get the full picture, not just the invoice.",
      },
      {
        question: "What about the client limit?",
        answer:
          "Unlike FreshBooks, VendCFO doesn't limit how many clients you can bill. Pay one price and invoice as many clients as you need.",
      },
      {
        question: "Is time tracking included?",
        answer:
          "Yes, time tracking is included in all VendCFO plans and connects directly to invoicing and project tracking.",
      },
    ],
    targetAudience: [
      "Freelancers outgrowing FreshBooks client limits",
      "Founders who want more than just invoicing",
      "Teams that need better bank connectivity",
      "Users who want AI-powered financial insights",
    ],
  },
  {
    id: "xero",
    slug: "xero-alternative",
    name: "Xero",
    tagline: "Why Founders Switch to VendCFO",
    description:
      "Looking for a Xero alternative? VendCFO offers founder-friendly financial management without the accounting complexity.",
    keyDifferences: [
      {
        title: "Design Philosophy",
        vendhub: "Built for founders",
        competitor: "Built for accountants",
      },
      {
        title: "Complexity",
        vendhub: "Simple and intuitive",
        competitor: "Full accounting system",
      },
      {
        title: "Setup Time",
        vendhub: "Under 5 minutes",
        competitor: "Hours to configure",
      },
      {
        title: "AI Features",
        vendhub: "Native AI assistant",
        competitor: "Third-party add-ons",
      },
    ],
    features: [
      {
        category: "Core Features",
        features: [
          { name: "Bank feeds", vendhub: true, competitor: true },
          { name: "Invoicing", vendhub: true, competitor: true },
          { name: "Expense claims", vendhub: true, competitor: true },
          { name: "Time tracking", vendhub: "Built-in", competitor: "Add-on" },
          { name: "AI insights", vendhub: true, competitor: false },
          { name: "Receipt capture", vendhub: "Automatic", competitor: "Manual" },
        ],
      },
      {
        category: "Ease of Use",
        features: [
          { name: "No accounting knowledge needed", vendhub: true, competitor: false },
          { name: "Quick setup", vendhub: true, competitor: false },
          { name: "Weekly summaries", vendhub: true, competitor: false },
          { name: "Clean dashboard", vendhub: true, competitor: false },
        ],
      },
    ],
    pricing: {
      vendhub: vendhubPricing,
      competitor: [
        {
          name: "Starter",
          price: "$29",
          period: "/month",
          features: [
            "Send 20 invoices",
            "Enter 5 bills",
            "Bank reconciliation",
            "Capture bills and receipts",
          ],
        },
        {
          name: "Standard",
          price: "$46",
          period: "/month",
          features: [
            "Unlimited invoices",
            "Unlimited bills",
            "Bulk reconcile",
            "Multi-currency",
          ],
        },
        {
          name: "Premium",
          price: "$62",
          period: "/month",
          features: [
            "Everything in Standard",
            "Multi-currency",
            "Expense management",
            "Project tracking",
          ],
        },
      ],
      competitorNote: "Invoice and bill limits on lower tiers",
    },
    switchingSteps: [
      {
        title: "Export your Xero data",
        description: "Download your contacts and transaction history as CSV files.",
      },
      {
        title: "Sign up for VendCFO",
        description: "Create your account and connect your bank accounts.",
      },
      {
        title: "Import customers",
        description: "Add your existing customers to continue invoicing.",
      },
      {
        title: "Let VendCFO sync automatically",
        description: "Your transactions will flow in automatically. No more manual reconciliation.",
      },
    ],
    faq: [
      {
        question: "Is VendCFO suitable for complex accounting needs?",
        answer:
          "VendCFO is designed for founders who want clarity over their finances, not complex accounting. If you need features like multi-entity consolidation or detailed inventory tracking, Xero might be more appropriate. But for most founders and small teams, VendCFO provides everything you need with far less complexity.",
      },
      {
        question: "Can I still work with my accountant?",
        answer:
          "Absolutely. You can export your data anytime or invite your accountant to access your VendCFO account directly.",
      },
      {
        question: "What about Xero's app marketplace?",
        answer:
          "VendCFO has a growing integration ecosystem, and many features that require add-ons in Xero (like time tracking) are built directly into VendCFO.",
      },
    ],
    targetAudience: [
      "Founders overwhelmed by Xero's complexity",
      "Small teams that don't need full accounting",
      "Users frustrated with Xero's invoice limits",
      "Teams wanting built-in time tracking",
    ],
  },
  {
    id: "wave",
    slug: "wave-alternative",
    name: "Wave",
    tagline: "Why Founders Switch to VendCFO",
    description:
      "Looking for a Wave alternative? VendCFO offers premium features, better bank connectivity, and AI-powered insights at a fair price.",
    keyDifferences: [
      {
        title: "Bank Connectivity",
        vendhub: "25,000+ banks worldwide",
        competitor: "US and Canada only",
      },
      {
        title: "AI Features",
        vendhub: "Built-in AI assistant",
        competitor: "None",
      },
      {
        title: "Support",
        vendhub: "Included in all plans",
        competitor: "Paid add-on",
      },
      {
        title: "Revenue Model",
        vendhub: "Subscription (transparent)",
        competitor: "Free + payment fees",
      },
    ],
    features: [
      {
        category: "Core Features",
        features: [
          { name: "Invoicing", vendhub: true, competitor: true },
          { name: "Expense tracking", vendhub: true, competitor: true },
          { name: "Bank connections", vendhub: "Global", competitor: "US/Canada" },
          { name: "Receipt scanning", vendhub: true, competitor: true },
          { name: "Time tracking", vendhub: true, competitor: false },
          { name: "AI insights", vendhub: true, competitor: false },
        ],
      },
      {
        category: "Business Features",
        features: [
          { name: "Weekly summaries", vendhub: true, competitor: false },
          { name: "Customer portal", vendhub: true, competitor: false },
          { name: "Multiple currencies", vendhub: true, competitor: "Limited" },
          { name: "Team collaboration", vendhub: true, competitor: "Limited" },
        ],
      },
    ],
    pricing: {
      vendhub: vendhubPricing,
      competitor: [
        {
          name: "Free",
          price: "$0",
          period: "",
          features: [
            "Unlimited invoicing",
            "Expense tracking",
            "Basic reports",
            "Single user",
          ],
        },
        {
          name: "Pro",
          price: "$16",
          period: "/month",
          features: [
            "Unlimited bank connections",
            "Unlimited receipt scanning",
            "Priority support",
          ],
        },
      ],
      competitorNote: "Payment processing fees: 2.9% + $0.60 per transaction",
    },
    switchingSteps: [
      {
        title: "Export from Wave",
        description: "Download your customer list and transaction data from Wave.",
      },
      {
        title: "Create your VendCFO account",
        description: "Sign up and connect your bank accounts globally.",
      },
      {
        title: "Import your data",
        description: "Add your customers and start with a clean slate.",
      },
      {
        title: "Enjoy premium features",
        description: "Access time tracking, AI insights, and global bank support.",
      },
    ],
    faq: [
      {
        question: "Why pay for VendCFO when Wave is free?",
        answer:
          "Wave's free model is supported by payment processing fees and limited features. VendCFO includes time tracking, AI insights, global bank support, and priority support. For growing businesses, the value far exceeds the cost.",
      },
      {
        question: "What if I'm outside the US or Canada?",
        answer:
          "VendCFO connects to over 25,000 banks worldwide. Wave's bank connections are limited to North America.",
      },
      {
        question: "Is there a free trial?",
        answer:
          "Yes, VendCFO offers a 14-day free trial so you can experience all features before committing.",
      },
    ],
    targetAudience: [
      "Users outside North America needing bank connections",
      "Growing businesses needing time tracking",
      "Teams wanting AI-powered insights",
      "Users needing better support",
    ],
  },
  {
    id: "zoho-books",
    slug: "zoho-books-alternative",
    name: "Zoho Books",
    tagline: "Why Founders Switch to VendCFO",
    description:
      "Looking for a Zoho Books alternative? VendCFO offers a cleaner, more focused experience without the complexity of a massive software suite.",
    keyDifferences: [
      {
        title: "Focus",
        vendhub: "Purpose-built for founders",
        competitor: "Part of large software suite",
      },
      {
        title: "Simplicity",
        vendhub: "One tool, one login",
        competitor: "Complex ecosystem",
      },
      {
        title: "Interface",
        vendhub: "Modern, clean design",
        competitor: "Dated, busy interface",
      },
      {
        title: "AI Features",
        vendhub: "Native AI assistant",
        competitor: "Zia AI (limited)",
      },
    ],
    features: [
      {
        category: "Core Features",
        features: [
          { name: "Invoicing", vendhub: true, competitor: true },
          { name: "Expense tracking", vendhub: true, competitor: true },
          { name: "Bank feeds", vendhub: true, competitor: true },
          { name: "Time tracking", vendhub: "Built-in", competitor: "Separate app" },
          { name: "AI insights", vendhub: true, competitor: "Basic" },
          { name: "Receipt capture", vendhub: true, competitor: true },
        ],
      },
      {
        category: "User Experience",
        features: [
          { name: "Modern interface", vendhub: true, competitor: false },
          { name: "Single platform", vendhub: true, competitor: false },
          { name: "No upsells", vendhub: true, competitor: false },
          { name: "Weekly summaries", vendhub: true, competitor: false },
        ],
      },
    ],
    pricing: {
      vendhub: vendhubPricing,
      competitor: [
        {
          name: "Free",
          price: "$0",
          period: "",
          features: ["1,000 invoices/year", "1 user", "Limited features"],
        },
        {
          name: "Standard",
          price: "$20",
          period: "/month",
          features: ["5,000 invoices/year", "3 users", "Bank feeds"],
        },
        {
          name: "Professional",
          price: "$50",
          period: "/month",
          features: ["Unlimited invoices", "5 users", "Purchase orders"],
        },
      ],
      competitorNote: "Time tracking requires Zoho Projects (additional cost)",
    },
    switchingSteps: [
      {
        title: "Export from Zoho Books",
        description: "Download your contacts and transactions as CSV files.",
      },
      {
        title: "Sign up for VendCFO",
        description: "Create your account in minutes.",
      },
      {
        title: "Connect your banks",
        description: "Link your bank accounts for automatic transaction sync.",
      },
      {
        title: "Start fresh",
        description: "Enjoy a simpler, more focused financial workspace.",
      },
    ],
    faq: [
      {
        question: "What about the Zoho ecosystem?",
        answer:
          "If you're heavily invested in Zoho's suite, their integrations can be valuable. But if you find yourself only using Zoho Books and paying for complexity you don't need, VendCFO offers a cleaner alternative.",
      },
      {
        question: "Is time tracking really included?",
        answer:
          "Yes! Unlike Zoho, which requires a separate Zoho Projects subscription for time tracking, VendCFO includes it in all plans.",
      },
      {
        question: "Can I migrate my data?",
        answer:
          "Yes, you can export your data from Zoho Books and set up fresh in VendCFO. Your bank transactions will sync automatically.",
      },
    ],
    targetAudience: [
      "Users overwhelmed by Zoho's ecosystem",
      "Teams wanting time tracking included",
      "Founders preferring modern interfaces",
      "Users tired of constant upsells",
    ],
  },
  {
    id: "harvest",
    slug: "harvest-alternative",
    name: "Harvest",
    tagline: "Why Founders Switch to VendCFO",
    description:
      "Looking for a Harvest alternative? VendCFO combines time tracking with full financial management, invoicing, and AI-powered insights.",
    keyDifferences: [
      {
        title: "Scope",
        vendhub: "Complete financial workspace",
        competitor: "Time tracking focused",
      },
      {
        title: "Bank Integration",
        vendhub: "Full bank connectivity",
        competitor: "None",
      },
      {
        title: "Financial Insights",
        vendhub: "AI-powered analytics",
        competitor: "Time reports only",
      },
      {
        title: "Value",
        vendhub: "All-in-one solution",
        competitor: "Need additional tools",
      },
    ],
    features: [
      {
        category: "Time & Projects",
        features: [
          { name: "Time tracking", vendhub: true, competitor: true },
          { name: "Project tracking", vendhub: true, competitor: true },
          { name: "Team timesheets", vendhub: true, competitor: true },
          { name: "Budget tracking", vendhub: true, competitor: true },
          { name: "Invoicing from time", vendhub: true, competitor: true },
        ],
      },
      {
        category: "Financial Management",
        features: [
          { name: "Bank connections", vendhub: true, competitor: false },
          { name: "Expense tracking", vendhub: true, competitor: true },
          { name: "Transaction categorization", vendhub: true, competitor: false },
          { name: "AI insights", vendhub: true, competitor: false },
          { name: "Cash flow visibility", vendhub: true, competitor: false },
          { name: "Weekly summaries", vendhub: true, competitor: false },
        ],
      },
    ],
    pricing: {
      vendhub: vendhubPricing,
      competitor: [
        {
          name: "Free",
          price: "$0",
          period: "",
          features: ["1 seat", "2 projects", "Basic features"],
        },
        {
          name: "Pro",
          price: "$12",
          period: "/seat/month",
          features: ["Unlimited projects", "Invoicing", "Integrations"],
        },
      ],
      competitorNote: "Per-seat pricing adds up quickly for teams",
    },
    switchingSteps: [
      {
        title: "Export your Harvest data",
        description: "Download your projects, clients, and time entries.",
      },
      {
        title: "Create your VendCFO account",
        description: "Sign up and connect your bank accounts.",
      },
      {
        title: "Set up your projects",
        description: "Recreate your project structure for time tracking.",
      },
      {
        title: "Enjoy the full picture",
        description: "See time tracking alongside your complete finances.",
      },
    ],
    faq: [
      {
        question: "How does time tracking compare?",
        answer:
          "VendCFO offers comparable time tracking features, but connects them directly to your bank transactions, invoicing, and financial insights. You get the full picture of your business, not just hours tracked.",
      },
      {
        question: "What about team management?",
        answer:
          "VendCFO supports team members with time tracking and includes them in your overall business view. Unlike Harvest's per-seat pricing, VendCFO offers predictable team pricing.",
      },
      {
        question: "Can I still invoice based on tracked time?",
        answer:
          "Yes! You can create invoices directly from tracked time, just like in Harvest, but with the added benefit of seeing how those invoices flow into your overall financial picture.",
      },
    ],
    targetAudience: [
      "Teams needing more than just time tracking",
      "Founders wanting to see the full financial picture",
      "Users tired of per-seat pricing",
      "Businesses needing bank connectivity",
    ],
  },
  {
    id: "expensify",
    slug: "expensify-alternative",
    name: "Expensify",
    tagline: "Why Founders Switch to VendCFO",
    description:
      "Looking for an Expensify alternative? VendCFO handles expenses as part of a complete financial workspace with invoicing, time tracking, and insights.",
    keyDifferences: [
      {
        title: "Scope",
        vendhub: "Complete financial workspace",
        competitor: "Expense management only",
      },
      {
        title: "Simplicity",
        vendhub: "One tool for everything",
        competitor: "Single-purpose tool",
      },
      {
        title: "Pricing",
        vendhub: "Simple monthly fee",
        competitor: "Per-user pricing",
      },
      {
        title: "AI Features",
        vendhub: "Full AI assistant",
        competitor: "SmartScan only",
      },
    ],
    features: [
      {
        category: "Expense Management",
        features: [
          { name: "Receipt scanning", vendhub: true, competitor: true },
          { name: "Automatic categorization", vendhub: true, competitor: true },
          { name: "Bank connections", vendhub: true, competitor: true },
          { name: "Expense reports", vendhub: true, competitor: true },
          { name: "Mileage tracking", vendhub: false, competitor: true },
        ],
      },
      {
        category: "Additional Features",
        features: [
          { name: "Invoicing", vendhub: true, competitor: "Limited" },
          { name: "Time tracking", vendhub: true, competitor: false },
          { name: "AI insights", vendhub: true, competitor: false },
          { name: "Weekly summaries", vendhub: true, competitor: false },
          { name: "Project tracking", vendhub: true, competitor: false },
        ],
      },
    ],
    pricing: {
      vendhub: vendhubPricing,
      competitor: [
        {
          name: "Collect",
          price: "$5",
          period: "/user/month",
          features: [
            "Unlimited SmartScans",
            "Expense reports",
            "Basic approvals",
          ],
        },
        {
          name: "Control",
          price: "$9",
          period: "/user/month",
          features: [
            "Everything in Collect",
            "Company cards",
            "Advanced policies",
            "Multi-level approvals",
          ],
        },
      ],
      competitorNote: "Per-user pricing scales quickly",
    },
    switchingSteps: [
      {
        title: "Export from Expensify",
        description: "Download your expense reports and transaction history.",
      },
      {
        title: "Sign up for VendCFO",
        description: "Create your account and connect your bank accounts.",
      },
      {
        title: "Set up receipt forwarding",
        description: "Forward receipts via email or upload them directly.",
      },
      {
        title: "Enjoy the complete picture",
        description: "See expenses alongside invoices, time, and cash flow.",
      },
    ],
    faq: [
      {
        question: "Is receipt scanning as good as Expensify?",
        answer:
          "VendCFO uses advanced OCR and AI to capture receipt data automatically. While Expensify pioneered SmartScan, VendCFO's receipt capture is comparable and connects to your full financial picture.",
      },
      {
        question: "What about expense policies and approvals?",
        answer:
          "VendCFO is designed for founders and small teams where complex approval workflows aren't needed. If you require enterprise expense policies, Expensify may be more suitable.",
      },
      {
        question: "Can I track mileage?",
        answer:
          "Mileage tracking isn't built into VendCFO currently. If this is essential, you might use a dedicated mileage app alongside VendCFO for your other financial needs.",
      },
    ],
    targetAudience: [
      "Founders needing more than expense tracking",
      "Small teams tired of per-user pricing",
      "Users wanting invoicing and time tracking too",
      "Teams wanting a unified financial view",
    ],
  },
  {
    id: "mint",
    slug: "mint-alternative",
    name: "Mint",
    tagline: "Why Founders Switch to VendCFO",
    description:
      "Looking for a Mint alternative for your business? VendCFO is built specifically for founders and small teams, not personal finance.",
    keyDifferences: [
      {
        title: "Purpose",
        vendhub: "Business finances",
        competitor: "Personal finance",
      },
      {
        title: "Invoicing",
        vendhub: "Full invoicing suite",
        competitor: "None",
      },
      {
        title: "Time Tracking",
        vendhub: "Built-in",
        competitor: "None",
      },
      {
        title: "Business Features",
        vendhub: "Receipts, projects, clients",
        competitor: "Personal budgets only",
      },
    ],
    features: [
      {
        category: "Financial Tracking",
        features: [
          { name: "Bank connections", vendhub: true, competitor: true },
          { name: "Transaction categorization", vendhub: true, competitor: true },
          { name: "Spending insights", vendhub: true, competitor: true },
          { name: "Cash flow tracking", vendhub: true, competitor: "Limited" },
          { name: "Business categorization", vendhub: true, competitor: false },
        ],
      },
      {
        category: "Business Features",
        features: [
          { name: "Invoicing", vendhub: true, competitor: false },
          { name: "Time tracking", vendhub: true, competitor: false },
          { name: "Receipt capture", vendhub: true, competitor: false },
          { name: "Client management", vendhub: true, competitor: false },
          { name: "AI assistant", vendhub: true, competitor: false },
        ],
      },
    ],
    pricing: {
      vendhub: vendhubPricing,
      competitor: [
        {
          name: "Free",
          price: "$0",
          period: "",
          features: ["Personal budgets", "Bill tracking", "Credit monitoring"],
        },
      ],
      competitorNote: "Mint is being sunset - Credit Karma now handles some features",
    },
    switchingSteps: [
      {
        title: "Separate personal and business",
        description: "Identify which accounts are for your business.",
      },
      {
        title: "Sign up for VendCFO",
        description: "Create your account and connect your business bank accounts.",
      },
      {
        title: "Set up business categories",
        description: "VendCFO's categories are designed for business expenses.",
      },
      {
        title: "Add invoicing and time tracking",
        description: "Start using the business features Mint never had.",
      },
    ],
    faq: [
      {
        question: "Why switch from Mint?",
        answer:
          "Mint was designed for personal finance. As a founder, you need invoicing, receipt tracking, time tracking, and business insights. VendCFO is purpose-built for running a business.",
      },
      {
        question: "What about personal finances?",
        answer:
          "We recommend keeping personal and business finances separate. Use VendCFO for your business, and a personal finance app for personal accounts.",
      },
      {
        question: "Is VendCFO free like Mint?",
        answer:
          "VendCFO is a paid service because running a business requires premium features and support. The value you get far exceeds the cost when you factor in time saved and insights gained.",
      },
    ],
    targetAudience: [
      "Founders using Mint for their business",
      "Users needing actual business features",
      "People starting a business and needing proper tools",
      "Mint users affected by the shutdown",
    ],
  },
  {
    id: "toggl",
    slug: "toggl-alternative",
    name: "Toggl",
    tagline: "Why Founders Switch to VendCFO",
    description:
      "Looking for a Toggl alternative? VendCFO combines time tracking with invoicing, transactions, and AI-powered insights for the complete picture.",
    keyDifferences: [
      {
        title: "Scope",
        vendhub: "Complete financial workspace",
        competitor: "Time tracking only",
      },
      {
        title: "Financial Integration",
        vendhub: "Bank connections included",
        competitor: "None",
      },
      {
        title: "Invoicing",
        vendhub: "Built-in from tracked time",
        competitor: "Requires separate tool",
      },
      {
        title: "Business Insights",
        vendhub: "AI-powered analytics",
        competitor: "Time reports only",
      },
    ],
    features: [
      {
        category: "Time Tracking",
        features: [
          { name: "Timer", vendhub: true, competitor: true },
          { name: "Manual entry", vendhub: true, competitor: true },
          { name: "Project tracking", vendhub: true, competitor: true },
          { name: "Team timesheets", vendhub: true, competitor: true },
          { name: "Desktop app", vendhub: true, competitor: true },
          { name: "Mobile app", vendhub: true, competitor: true },
        ],
      },
      {
        category: "Financial Management",
        features: [
          { name: "Invoicing", vendhub: true, competitor: false },
          { name: "Bank connections", vendhub: true, competitor: false },
          { name: "Expense tracking", vendhub: true, competitor: false },
          { name: "Receipt capture", vendhub: true, competitor: false },
          { name: "Cash flow insights", vendhub: true, competitor: false },
          { name: "AI assistant", vendhub: true, competitor: false },
        ],
      },
    ],
    pricing: {
      vendhub: vendhubPricing,
      competitor: [
        {
          name: "Free",
          price: "$0",
          period: "",
          features: ["Time tracking", "5 users", "Basic reports"],
        },
        {
          name: "Starter",
          price: "$10",
          period: "/user/month",
          features: ["Billable rates", "Project time estimates", "Alerts"],
        },
        {
          name: "Premium",
          price: "$20",
          period: "/user/month",
          features: ["Time audits", "Project forecasts", "Priority support"],
        },
      ],
      competitorNote: "Per-user pricing adds up for growing teams",
    },
    switchingSteps: [
      {
        title: "Export your Toggl data",
        description: "Download your projects, clients, and time entries as CSV.",
      },
      {
        title: "Create your VendCFO account",
        description: "Sign up and connect your bank accounts.",
      },
      {
        title: "Set up projects and clients",
        description: "Recreate your project structure in VendCFO.",
      },
      {
        title: "Start tracking with context",
        description: "See your time alongside invoices, expenses, and cash flow.",
      },
    ],
    faq: [
      {
        question: "Is time tracking as powerful as Toggl?",
        answer:
          "VendCFO offers solid time tracking with timers, manual entry, project tracking, and team support. While Toggl has some advanced features like automated tracking, VendCFO gives you time tracking plus complete financial management in one place.",
      },
      {
        question: "What about integrations?",
        answer:
          "Toggl has 100+ integrations, many for syncing time to other tools. VendCFO reduces integration needs by including invoicing and finances directly. You may need fewer tools overall.",
      },
      {
        question: "How does pricing compare?",
        answer:
          "Toggl charges per user, which adds up quickly. VendCFO's team pricing is more predictable, and you get invoicing, bank connections, and AI insights included.",
      },
    ],
    targetAudience: [
      "Founders needing more than time tracking",
      "Teams wanting invoicing from tracked time",
      "Users tired of per-seat pricing",
      "Businesses needing financial visibility",
    ],
  },
  {
    id: "clockify",
    slug: "clockify-alternative",
    name: "Clockify",
    tagline: "Why Founders Switch to VendCFO",
    description:
      "Looking for a Clockify alternative? VendCFO offers time tracking plus invoicing, bank connections, and AI-powered financial insights in one workspace.",
    keyDifferences: [
      {
        title: "Scope",
        vendhub: "Complete financial workspace",
        competitor: "Time tracking only",
      },
      {
        title: "Financial Features",
        vendhub: "Bank connections + invoicing",
        competitor: "None",
      },
      {
        title: "Business Insights",
        vendhub: "AI-powered analytics",
        competitor: "Time reports only",
      },
      {
        title: "Pricing",
        vendhub: "All-inclusive",
        competitor: "Free + paid add-ons",
      },
    ],
    features: [
      {
        category: "Time Tracking",
        features: [
          { name: "Timer", vendhub: true, competitor: true },
          { name: "Manual entry", vendhub: true, competitor: true },
          { name: "Project tracking", vendhub: true, competitor: true },
          { name: "Team timesheets", vendhub: true, competitor: true },
          { name: "Desktop app", vendhub: true, competitor: true },
          { name: "Mobile app", vendhub: true, competitor: true },
          { name: "Unlimited tracking", vendhub: true, competitor: true },
        ],
      },
      {
        category: "Financial Management",
        features: [
          { name: "Invoicing", vendhub: true, competitor: "Basic" },
          { name: "Bank connections", vendhub: true, competitor: false },
          { name: "Expense tracking", vendhub: true, competitor: "Paid add-on" },
          { name: "Receipt capture", vendhub: true, competitor: false },
          { name: "Cash flow insights", vendhub: true, competitor: false },
          { name: "AI assistant", vendhub: true, competitor: false },
        ],
      },
    ],
    pricing: {
      vendhub: vendhubPricing,
      competitor: [
        {
          name: "Free",
          price: "$0",
          period: "",
          features: ["Unlimited tracking", "Unlimited users", "Basic reports"],
        },
        {
          name: "Basic",
          price: "$4.99",
          period: "/user/month",
          features: ["Time off", "Targets", "Custom fields"],
        },
        {
          name: "Standard",
          price: "$6.99",
          period: "/user/month",
          features: ["Timesheet approvals", "Invoicing", "Scheduling"],
        },
        {
          name: "Pro",
          price: "$9.99",
          period: "/user/month",
          features: ["GPS tracking", "Screenshots", "Labor costs"],
        },
      ],
      competitorNote: "Many features require paid upgrades",
    },
    switchingSteps: [
      {
        title: "Export your Clockify data",
        description: "Download your time entries, projects, and clients as CSV.",
      },
      {
        title: "Create your VendCFO account",
        description: "Sign up and connect your bank accounts.",
      },
      {
        title: "Set up your projects",
        description: "Recreate your project structure in VendCFO.",
      },
      {
        title: "Experience the full picture",
        description: "See time tracking connected to invoices and cash flow.",
      },
    ],
    faq: [
      {
        question: "Clockify is free - why pay for VendCFO?",
        answer:
          "Clockify's free tier is generous for time tracking alone, but you'll need additional paid tools for invoicing, expense tracking, and financial visibility. VendCFO includes everything in one workspace, saving you the cost and complexity of multiple tools.",
      },
      {
        question: "How does time tracking compare?",
        answer:
          "Both offer solid time tracking with timers, manual entry, and project tracking. The difference is that VendCFO connects your tracked time directly to invoicing, bank transactions, and financial insights.",
      },
      {
        question: "What about the unlimited free users?",
        answer:
          "Clockify's free plan is great for teams just tracking time. But once you need invoicing, expense tracking, or financial insights, you'll pay per user for multiple tools. VendCFO's predictable pricing includes everything.",
      },
    ],
    targetAudience: [
      "Teams outgrowing Clockify's free features",
      "Founders needing invoicing and financial tracking",
      "Users tired of cobbling together multiple tools",
      "Teams wanting bank connectivity with time tracking",
    ],
  },
  {
    id: "bench",
    slug: "bench-alternative",
    name: "Bench",
    tagline: "Why Founders Switch to VendCFO",
    description:
      "Looking for a Bench alternative? VendCFO gives you real-time financial visibility and control, without waiting for monthly bookkeeper reports.",
    keyDifferences: [
      {
        title: "Access",
        vendhub: "Real-time, self-service",
        competitor: "Monthly bookkeeper reports",
      },
      {
        title: "Control",
        vendhub: "You're in control",
        competitor: "Dependent on bookkeeper",
      },
      {
        title: "Speed",
        vendhub: "Instant insights",
        competitor: "Wait for month-end",
      },
      {
        title: "Cost",
        vendhub: "Predictable $29-49/mo",
        competitor: "$299+/month",
      },
    ],
    features: [
      {
        category: "Financial Management",
        features: [
          { name: "Bank connections", vendhub: true, competitor: true },
          { name: "Transaction categorization", vendhub: "Automatic + AI", competitor: "Done by bookkeeper" },
          { name: "Real-time visibility", vendhub: true, competitor: false },
          { name: "Financial reports", vendhub: "Instant", competitor: "Monthly" },
          { name: "Tax-ready books", vendhub: "Export anytime", competitor: true },
        ],
      },
      {
        category: "Additional Features",
        features: [
          { name: "Invoicing", vendhub: true, competitor: false },
          { name: "Time tracking", vendhub: true, competitor: false },
          { name: "Receipt capture", vendhub: true, competitor: true },
          { name: "AI assistant", vendhub: true, competitor: false },
          { name: "Weekly summaries", vendhub: true, competitor: false },
        ],
      },
    ],
    pricing: {
      vendhub: vendhubPricing,
      competitor: [
        {
          name: "Bookkeeping",
          price: "$299",
          period: "/month",
          features: [
            "Monthly bookkeeping",
            "Year-end financial package",
            "Direct messaging",
          ],
        },
        {
          name: "Bookkeeping + Tax",
          price: "$499",
          period: "/month",
          features: [
            "Everything in Bookkeeping",
            "Tax filing",
            "Tax advisory",
          ],
        },
      ],
      competitorNote: "Prices for businesses with <$20k monthly expenses",
    },
    switchingSteps: [
      {
        title: "Download your Bench reports",
        description: "Get your financial statements and transaction history.",
      },
      {
        title: "Sign up for VendCFO",
        description: "Create your account and connect your bank accounts.",
      },
      {
        title: "Let VendCFO categorize",
        description: "AI-powered categorization starts working immediately.",
      },
      {
        title: "Enjoy real-time access",
        description: "No more waiting for monthly reports.",
      },
    ],
    faq: [
      {
        question: "Is VendCFO a replacement for bookkeeping?",
        answer:
          "VendCFO handles day-to-day financial management and gives you real-time visibility. For tax filing and complex accounting, you may still want an accountant - but you'll spend far less on bookkeeping services because VendCFO keeps everything organized.",
      },
      {
        question: "What about tax preparation?",
        answer:
          "VendCFO categorizes transactions, tracks receipts, and exports tax-ready reports. Your accountant will have everything they need, organized and ready to go.",
      },
      {
        question: "Why is VendCFO so much cheaper?",
        answer:
          "Bench employs human bookkeepers who manually review your transactions monthly. VendCFO uses AI and automation for instant categorization, giving you better speed at a fraction of the cost.",
      },
    ],
    targetAudience: [
      "Founders frustrated with monthly reporting delays",
      "Teams wanting real-time financial visibility",
      "Businesses looking to reduce bookkeeping costs",
      "Founders who want control over their finances",
    ],
  },
  {
    id: "qonto",
    slug: "qonto-alternative",
    name: "Qonto",
    tagline: "Why Founders Switch to VendCFO",
    description:
      "Looking for a Qonto alternative? VendCFO offers financial management that works with any bank, plus invoicing, time tracking, and AI insights.",
    keyDifferences: [
      {
        title: "Bank Freedom",
        vendhub: "Works with any bank",
        competitor: "Must use Qonto bank",
      },
      {
        title: "Invoicing",
        vendhub: "Full invoicing suite",
        competitor: "Basic invoicing",
      },
      {
        title: "Time Tracking",
        vendhub: "Built-in",
        competitor: "None",
      },
      {
        title: "AI Features",
        vendhub: "AI assistant + insights",
        competitor: "Limited automation",
      },
    ],
    features: [
      {
        category: "Financial Management",
        features: [
          { name: "Multi-bank support", vendhub: "25,000+ banks", competitor: "Qonto only" },
          { name: "Transaction categorization", vendhub: true, competitor: true },
          { name: "Expense tracking", vendhub: true, competitor: true },
          { name: "Receipt capture", vendhub: true, competitor: true },
          { name: "Team cards", vendhub: false, competitor: true },
          { name: "AI insights", vendhub: true, competitor: false },
        ],
      },
      {
        category: "Business Tools",
        features: [
          { name: "Full invoicing", vendhub: true, competitor: "Basic" },
          { name: "Time tracking", vendhub: true, competitor: false },
          { name: "Project tracking", vendhub: true, competitor: false },
          { name: "Weekly summaries", vendhub: true, competitor: false },
          { name: "Customer management", vendhub: true, competitor: false },
        ],
      },
    ],
    pricing: {
      vendhub: vendhubPricing,
      competitor: [
        {
          name: "Basic",
          price: "€9",
          period: "/month",
          features: ["1 user", "German IBAN", "20 transfers/month"],
        },
        {
          name: "Smart",
          price: "€19",
          period: "/month",
          features: ["2 users", "100 transfers/month", "5 cards"],
        },
        {
          name: "Premium",
          price: "€39",
          period: "/month",
          features: ["5 users", "500 transfers/month", "Connect banks"],
        },
        {
          name: "Enterprise",
          price: "€99",
          period: "/month",
          features: ["10 users", "Unlimited transfers", "Priority support"],
        },
      ],
      competitorNote: "Must switch your banking to Qonto",
    },
    switchingSteps: [
      {
        title: "Keep your current bank",
        description: "No need to switch banks - VendCFO connects to your existing accounts.",
      },
      {
        title: "Sign up for VendCFO",
        description: "Create your account and connect your bank accounts.",
      },
      {
        title: "Import your customers",
        description: "Add your existing customers for invoicing.",
      },
      {
        title: "Start using all features",
        description: "Access time tracking, AI insights, and more.",
      },
    ],
    faq: [
      {
        question: "Do I need to switch banks?",
        answer:
          "No! Unlike Qonto, VendCFO works with your existing bank accounts. Connect any of 25,000+ banks worldwide and keep your current banking relationships.",
      },
      {
        question: "What about team expense cards?",
        answer:
          "VendCFO focuses on financial management, not banking. If you need team cards, you can use your existing bank's cards while using VendCFO for tracking, invoicing, and insights.",
      },
      {
        question: "Is VendCFO available in Europe?",
        answer:
          "Yes! VendCFO works globally with banks across Europe, including SEPA countries. You get the same features whether you're in Germany, France, Netherlands, or anywhere else.",
      },
    ],
    targetAudience: [
      "EU founders who want to keep their current bank",
      "Teams needing more than basic invoicing",
      "Businesses wanting time tracking built-in",
      "Users who need AI-powered financial insights",
    ],
  },
  {
    id: "pleo",
    slug: "pleo-alternative",
    name: "Pleo",
    tagline: "Why Founders Switch to VendCFO",
    description:
      "Looking for a Pleo alternative? VendCFO offers expense tracking plus invoicing, time tracking, and full financial visibility without requiring corporate cards.",
    keyDifferences: [
      {
        title: "Flexibility",
        vendhub: "Works with any payment method",
        competitor: "Requires Pleo cards",
      },
      {
        title: "Scope",
        vendhub: "Complete financial workspace",
        competitor: "Expense management only",
      },
      {
        title: "Invoicing",
        vendhub: "Full suite",
        competitor: "None",
      },
      {
        title: "Time Tracking",
        vendhub: "Built-in",
        competitor: "None",
      },
    ],
    features: [
      {
        category: "Expense Management",
        features: [
          { name: "Receipt capture", vendhub: true, competitor: true },
          { name: "Automatic categorization", vendhub: true, competitor: true },
          { name: "Expense tracking", vendhub: true, competitor: true },
          { name: "Corporate cards", vendhub: false, competitor: true },
          { name: "Spending limits", vendhub: false, competitor: true },
          { name: "Works with any card", vendhub: true, competitor: false },
        ],
      },
      {
        category: "Financial Management",
        features: [
          { name: "Bank connections", vendhub: true, competitor: "Limited" },
          { name: "Invoicing", vendhub: true, competitor: false },
          { name: "Time tracking", vendhub: true, competitor: false },
          { name: "Cash flow insights", vendhub: true, competitor: "Limited" },
          { name: "AI assistant", vendhub: true, competitor: false },
          { name: "Weekly summaries", vendhub: true, competitor: false },
        ],
      },
    ],
    pricing: {
      vendhub: vendhubPricing,
      competitor: [
        {
          name: "Starter",
          price: "Free",
          period: "",
          features: ["3 users", "Pleo cards", "Basic features"],
        },
        {
          name: "Essential",
          price: "€35",
          period: "/month base",
          features: ["Unlimited users", "Analytics", "Integrations"],
        },
        {
          name: "Advanced",
          price: "€75",
          period: "/month base",
          features: ["Budgets", "Multi-entity", "Priority support"],
        },
      ],
      competitorNote: "+ per-user fees on paid plans",
    },
    switchingSteps: [
      {
        title: "Export from Pleo",
        description: "Download your expense data and receipts.",
      },
      {
        title: "Sign up for VendCFO",
        description: "Create your account and connect your bank accounts.",
      },
      {
        title: "Set up receipt forwarding",
        description: "Forward receipts via email or capture them in-app.",
      },
      {
        title: "Add invoicing and time tracking",
        description: "Start using features Pleo doesn't offer.",
      },
    ],
    faq: [
      {
        question: "What about corporate cards?",
        answer:
          "VendCFO focuses on financial management, not issuing cards. You can use your existing corporate or personal cards - all transactions sync automatically from your connected bank accounts.",
      },
      {
        question: "Can I still track team expenses?",
        answer:
          "Yes! VendCFO tracks all expenses from your connected bank accounts, regardless of which team member made the purchase. Receipts can be attached to any transaction.",
      },
      {
        question: "Is VendCFO available in Europe?",
        answer:
          "Absolutely. VendCFO works with banks across Europe and supports multiple currencies. You get the same features whether you're in Denmark, UK, Germany, or elsewhere.",
      },
    ],
    targetAudience: [
      "Teams who don't want to switch to corporate cards",
      "Founders needing invoicing alongside expenses",
      "Businesses wanting time tracking included",
      "EU teams seeking a simpler expense solution",
    ],
  },
  {
    id: "honeybook",
    slug: "honeybook-alternative",
    name: "HoneyBook",
    tagline: "Why Founders Switch to VendCFO",
    description:
      "Looking for a HoneyBook alternative? VendCFO offers clean financial management with invoicing and time tracking, without the CRM complexity.",
    keyDifferences: [
      {
        title: "Focus",
        vendhub: "Financial clarity",
        competitor: "CRM + project management",
      },
      {
        title: "Simplicity",
        vendhub: "Clean, focused workspace",
        competitor: "Feature-heavy platform",
      },
      {
        title: "Bank Connections",
        vendhub: "25,000+ banks",
        competitor: "Limited",
      },
      {
        title: "AI Features",
        vendhub: "AI assistant + insights",
        competitor: "Basic automation",
      },
    ],
    features: [
      {
        category: "Financial Management",
        features: [
          { name: "Invoicing", vendhub: true, competitor: true },
          { name: "Online payments", vendhub: true, competitor: true },
          { name: "Bank connections", vendhub: true, competitor: "Limited" },
          { name: "Expense tracking", vendhub: true, competitor: "Basic" },
          { name: "Time tracking", vendhub: true, competitor: "Basic" },
          { name: "AI insights", vendhub: true, competitor: false },
        ],
      },
      {
        category: "Business Tools",
        features: [
          { name: "Contracts/proposals", vendhub: false, competitor: true },
          { name: "Client portal", vendhub: true, competitor: true },
          { name: "Scheduling", vendhub: false, competitor: true },
          { name: "Weekly summaries", vendhub: true, competitor: false },
          { name: "Cash flow visibility", vendhub: true, competitor: "Limited" },
        ],
      },
    ],
    pricing: {
      vendhub: vendhubPricing,
      competitor: [
        {
          name: "Starter",
          price: "$16",
          period: "/month",
          features: ["Unlimited clients", "Invoices", "Basic automation"],
        },
        {
          name: "Essentials",
          price: "$32",
          period: "/month",
          features: ["Scheduler", "Automation", "Custom branding"],
        },
        {
          name: "Premium",
          price: "$66",
          period: "/month",
          features: ["Priority support", "Multiple companies", "Advanced reports"],
        },
      ],
      competitorNote: "Payment processing: 2.9% + $0.25 per transaction",
    },
    switchingSteps: [
      {
        title: "Export client and invoice data",
        description: "Download your clients and invoice history from HoneyBook.",
      },
      {
        title: "Sign up for VendCFO",
        description: "Create your account and connect your bank accounts.",
      },
      {
        title: "Import your customers",
        description: "Add your clients to continue invoicing.",
      },
      {
        title: "Enjoy financial clarity",
        description: "Focus on finances without CRM complexity.",
      },
    ],
    faq: [
      {
        question: "What about contracts and proposals?",
        answer:
          "VendCFO focuses on financial management rather than proposals. If you need contract management, you might use a dedicated tool like DocuSign alongside VendCFO for your financial tracking and invoicing.",
      },
      {
        question: "Is VendCFO good for freelancers?",
        answer:
          "Absolutely! VendCFO is built for founders and freelancers who want clarity over their business finances. You get invoicing, time tracking, expense management, and AI insights in one clean interface.",
      },
      {
        question: "What about client scheduling?",
        answer:
          "VendCFO doesn't include scheduling. If you need that, tools like Calendly work great alongside VendCFO. Many users find they prefer best-in-class tools for each function rather than an all-in-one that compromises on each.",
      },
    ],
    targetAudience: [
      "Creatives who find HoneyBook too complex",
      "Freelancers wanting better financial visibility",
      "Users who don't need CRM features",
      "Teams wanting AI-powered insights",
    ],
  },
  {
    id: "freeagent",
    slug: "freeagent-alternative",
    name: "FreeAgent",
    tagline: "Why Founders Switch to VendCFO",
    description:
      "Looking for a FreeAgent alternative? VendCFO offers modern financial management with AI-powered insights, without the accounting complexity.",
    keyDifferences: [
      {
        title: "Design",
        vendhub: "Modern, clean interface",
        competitor: "Traditional accounting UI",
      },
      {
        title: "Complexity",
        vendhub: "Built for founders",
        competitor: "Built for accountants",
      },
      {
        title: "AI Features",
        vendhub: "AI assistant + weekly insights",
        competitor: "None",
      },
      {
        title: "Global Reach",
        vendhub: "25,000+ banks worldwide",
        competitor: "UK-focused",
      },
    ],
    features: [
      {
        category: "Core Features",
        features: [
          { name: "Bank connections", vendhub: "Global", competitor: "UK-focused" },
          { name: "Invoicing", vendhub: true, competitor: true },
          { name: "Expense tracking", vendhub: true, competitor: true },
          { name: "Time tracking", vendhub: true, competitor: true },
          { name: "Receipt capture", vendhub: true, competitor: true },
          { name: "AI insights", vendhub: true, competitor: false },
        ],
      },
      {
        category: "Accounting",
        features: [
          { name: "VAT returns", vendhub: "Export for accountant", competitor: true },
          { name: "MTD compatible", vendhub: "Via export", competitor: true },
          { name: "Self-assessment", vendhub: "Export ready", competitor: true },
          { name: "Weekly summaries", vendhub: true, competitor: false },
          { name: "No accounting knowledge needed", vendhub: true, competitor: false },
        ],
      },
    ],
    pricing: {
      vendhub: vendhubPricing,
      competitor: [
        {
          name: "FreeAgent",
          price: "£19",
          period: "/month",
          features: [
            "Unlimited users",
            "Full accounting",
            "MTD compatible",
            "Banking integration",
          ],
        },
      ],
      competitorNote: "Free with some UK banks (NatWest, RBS, etc.)",
    },
    switchingSteps: [
      {
        title: "Export from FreeAgent",
        description: "Download your contacts, invoices, and transaction history.",
      },
      {
        title: "Sign up for VendCFO",
        description: "Create your account and connect your bank accounts.",
      },
      {
        title: "Import customers",
        description: "Add your existing clients for invoicing.",
      },
      {
        title: "Experience modern finance",
        description: "Enjoy AI insights and a cleaner interface.",
      },
    ],
    faq: [
      {
        question: "What about Making Tax Digital (MTD)?",
        answer:
          "VendCFO exports your data in formats compatible with MTD requirements. Your accountant can use these exports for VAT submissions. VendCFO focuses on day-to-day financial clarity rather than tax compliance features.",
      },
      {
        question: "I get FreeAgent free with my bank - why switch?",
        answer:
          "Free is great, but if you find FreeAgent's interface dated or complex, VendCFO offers a modern experience with AI-powered insights. The value of time saved and better visibility often exceeds the subscription cost.",
      },
      {
        question: "Is VendCFO suitable for UK businesses?",
        answer:
          "Yes! VendCFO works with UK banks and handles GBP and multi-currency. While it doesn't file VAT directly, it provides everything your accountant needs for compliance.",
      },
    ],
    targetAudience: [
      "UK freelancers wanting a modern interface",
      "Founders who find FreeAgent too accounting-focused",
      "Users wanting AI-powered financial insights",
      "Teams that don't need built-in tax filing",
    ],
  },
  {
    id: "ramp",
    slug: "ramp-alternative",
    name: "Ramp",
    tagline: "Why Founders Switch to VendCFO",
    description:
      "Looking for a Ramp alternative? VendCFO offers financial visibility and expense tracking without requiring you to switch corporate cards.",
    keyDifferences: [
      {
        title: "Flexibility",
        vendhub: "Works with any bank/card",
        competitor: "Requires Ramp cards",
      },
      {
        title: "Invoicing",
        vendhub: "Full invoicing suite",
        competitor: "Bill pay only",
      },
      {
        title: "Time Tracking",
        vendhub: "Built-in",
        competitor: "None",
      },
      {
        title: "Target",
        vendhub: "Founders & small teams",
        competitor: "Mid-size companies",
      },
    ],
    features: [
      {
        category: "Expense Management",
        features: [
          { name: "Receipt capture", vendhub: true, competitor: true },
          { name: "Automatic categorization", vendhub: true, competitor: true },
          { name: "Corporate cards", vendhub: false, competitor: true },
          { name: "Spending limits", vendhub: false, competitor: true },
          { name: "Works with any card", vendhub: true, competitor: false },
          { name: "Bill pay", vendhub: false, competitor: true },
        ],
      },
      {
        category: "Financial Management",
        features: [
          { name: "Bank connections", vendhub: true, competitor: true },
          { name: "Invoicing", vendhub: true, competitor: false },
          { name: "Time tracking", vendhub: true, competitor: false },
          { name: "Cash flow insights", vendhub: true, competitor: true },
          { name: "AI assistant", vendhub: true, competitor: "Limited" },
          { name: "Weekly summaries", vendhub: true, competitor: false },
        ],
      },
    ],
    pricing: {
      vendhub: vendhubPricing,
      competitor: [
        {
          name: "Ramp",
          price: "$0",
          period: "",
          features: [
            "Corporate cards",
            "Expense management",
            "Bill pay",
            "Accounting integrations",
          ],
        },
        {
          name: "Ramp Plus",
          price: "$12",
          period: "/user/month",
          features: [
            "Everything in Ramp",
            "Advanced controls",
            "Custom workflows",
            "Priority support",
          ],
        },
      ],
      competitorNote: "Requires using Ramp corporate cards",
    },
    switchingSteps: [
      {
        title: "Keep your current cards",
        description: "No need to switch - VendCFO works with your existing accounts.",
      },
      {
        title: "Sign up for VendCFO",
        description: "Create your account and connect your bank accounts.",
      },
      {
        title: "Set up expense tracking",
        description: "All card transactions sync automatically.",
      },
      {
        title: "Add invoicing and time tracking",
        description: "Start using features Ramp doesn't offer.",
      },
    ],
    faq: [
      {
        question: "Why not use free Ramp cards?",
        answer:
          "Ramp is great if you want to switch all spending to their cards and you're a larger team. But if you want flexibility to use any bank or card, plus invoicing and time tracking, VendCFO is the better fit for founders and small teams.",
      },
      {
        question: "What about the cashback and savings?",
        answer:
          "Ramp offers 1.5% cashback on their cards. However, the value of having invoicing, time tracking, and full financial visibility in one place often exceeds those savings for most small businesses.",
      },
      {
        question: "Is VendCFO for startups too?",
        answer:
          "Yes! While Ramp targets VC-backed startups with larger teams, VendCFO is built specifically for founders and small teams who want clarity without corporate card requirements.",
      },
    ],
    targetAudience: [
      "Founders who don't want to switch cards",
      "Small teams needing invoicing too",
      "Businesses wanting time tracking built-in",
      "Teams too small for enterprise expense tools",
    ],
  },
];

export function getCompetitorBySlug(slug: string): Competitor | undefined {
  return competitors.find((c) => c.slug === slug);
}

export function getAllCompetitorSlugs(): string[] {
  return competitors.map((c) => c.slug);
}
