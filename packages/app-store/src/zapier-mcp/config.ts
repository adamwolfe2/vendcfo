import { Logo } from "./assets/logo";

export default {
  name: "Zapier",
  id: "zapier-mcp",
  category: "ai-automation",
  active: true,
  logo: Logo,
  short_description:
    "Connect VendCFO to 7,000+ apps. Automate reports, alerts, and workflows.",
  description: `Connect VendCFO to Zapier using the Model Context Protocol (MCP).

**What you can do:**
- Automate weekly profit reports to email or Slack
- Get alerts when invoices are overdue
- Sync customer data to Google Sheets or your CRM
- Build custom workflows without code

**How it works:**
1. Add VendCFO as an MCP connection in Zapier
2. Use your VendCFO API key for authentication
3. Create Zaps using VendCFO's 50+ tools`,
  images: [],
  installUrl: "https://vendhub.com/mcp/zapier",
};
