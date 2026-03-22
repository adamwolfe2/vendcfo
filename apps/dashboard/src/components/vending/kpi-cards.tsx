import { calculateDashboardMetrics, getDb } from "@vendcfo/spreadsheet-bridge";
import { Card, CardContent } from "@vendcfo/ui/card";
import {
  DollarSign,
  Percent,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

export function KpiCards() {
  const db = getDb();
  let metrics = {
    revenue: 12450.0,
    profit: 4850.5,
    margin: 38.9,
    cash: 28000.0,
  };

  if (db.transactions && db.transactions.length > 0) {
    metrics = calculateDashboardMetrics(db);
  }

  const cards = [
    {
      label: "Total Revenue",
      value: `$${metrics.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      iconBg:
        "bg-blue-500/10 text-blue-500",
      trend: "+12%",
      trendUp: true,
    },
    {
      label: "Net Profit",
      value: `$${metrics.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      iconBg:
        "bg-green-500/10 text-green-500",
      trend: "+5%",
      trendUp: true,
    },
    {
      label: "Gross Margin",
      value: `${metrics.margin.toFixed(1)}%`,
      icon: Percent,
      iconBg:
        "bg-purple-500/10 text-purple-500",
      trend: "-1.2%",
      trendUp: false,
    },
    {
      label: "Cash on Hand",
      value: `$${metrics.cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: Wallet,
      iconBg:
        "bg-orange-500/10 text-orange-500",
      trend: "4.5mo runway",
      trendUp: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.label}
                  </p>
                  <h3 className="text-2xl font-bold text-foreground mt-1">
                    {card.value}
                  </h3>
                </div>
                <div className={`p-2 rounded-lg ${card.iconBg}`}>
                  <Icon size={20} />
                </div>
              </div>
              <p
                className={`text-sm font-medium flex items-center ${card.trendUp ? "text-green-600" : "text-red-500"}`}
              >
                {card.trendUp ? (
                  <TrendingUp size={14} className="mr-1" />
                ) : (
                  <TrendingDown size={14} className="mr-1" />
                )}
                {card.trend}{" "}
                {card.label !== "Cash on Hand" ? "from last month" : ""}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
