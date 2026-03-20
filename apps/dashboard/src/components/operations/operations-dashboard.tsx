"use client";

import {
  CalendarDays,
  DollarSign,
  FileSpreadsheet,
  MapPin,
  PackageOpen,
  Route,
  Server,
} from "lucide-react";
import Link from "next/link";

const operationsCards = [
  {
    title: "Routes",
    description: "Manage your vending routes and service schedules",
    href: "/routes",
    icon: Route,
    color: "#22c55e",
  },
  {
    title: "Logistics",
    description: "Weekly schedule grid with operator assignments",
    href: "/logistics",
    icon: CalendarDays,
    color: "#3b82f6",
  },
  {
    title: "Locations",
    description: "Manage locations, rev share, and machine placements",
    href: "/locations",
    icon: MapPin,
    color: "#f59e0b",
  },
  {
    title: "Machines",
    description: "Track all vending machines, status, and performance",
    href: "/machines",
    icon: Server,
    color: "#8b5cf6",
  },
  {
    title: "Products & SKUs",
    description: "Product catalog with costs, prices, and margins",
    href: "/skus",
    icon: PackageOpen,
    color: "#ef4444",
  },
  {
    title: "Revenue Share",
    description: "Track location commissions and send partner reports",
    href: "/revenue-share",
    icon: DollarSign,
    color: "#06b6d4",
  },
  {
    title: "Import Data",
    description: "Upload CSV files with AI-powered column mapping",
    href: "/import",
    icon: FileSpreadsheet,
    color: "#64748b",
  },
];

interface OperationsDashboardProps {
  stats: {
    routes: number;
    locations: number;
    machines: number;
    products: number;
  };
}

export function OperationsDashboard({ stats }: OperationsDashboardProps) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Operations</h1>
        <p className="text-sm text-[#878787] mt-1">
          Manage your vending routes, locations, machines, and products.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="border border-[#e0e0e0] rounded-lg p-4">
          <p className="text-2xl font-bold">{stats.routes}</p>
          <p className="text-xs text-[#878787]">Active Routes</p>
        </div>
        <div className="border border-[#e0e0e0] rounded-lg p-4">
          <p className="text-2xl font-bold">{stats.locations}</p>
          <p className="text-xs text-[#878787]">Locations</p>
        </div>
        <div className="border border-[#e0e0e0] rounded-lg p-4">
          <p className="text-2xl font-bold">{stats.machines}</p>
          <p className="text-xs text-[#878787]">Machines</p>
        </div>
        <div className="border border-[#e0e0e0] rounded-lg p-4">
          <p className="text-2xl font-bold">{stats.products}</p>
          <p className="text-xs text-[#878787]">Products</p>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {operationsCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group border border-[#e0e0e0] rounded-lg p-5 hover:border-[#999] hover:shadow-sm transition-all"
          >
            <div className="flex items-start gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${card.color}15` }}
              >
                <card.icon
                  size={20}
                  style={{ color: card.color }}
                  strokeWidth={1.5}
                />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm group-hover:text-black transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-[#878787] mt-1 leading-relaxed">
                  {card.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
