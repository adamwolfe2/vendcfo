"use client";

import { useChatInterface } from "@/hooks/use-chat-interface";
import { cn } from "@vendcfo/ui/cn";
import { Icons } from "@vendcfo/ui/icons";
import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  FileBarChart,
  GraduationCap,
  KeyRound,
  LayoutGrid,
  Route,
  UserCheck,
  Users,
  UsersRound,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ForesightLink } from "./foresight-link";

const icons = {
  "/": () => <Icons.Overview size={20} />,
  "/inbox": () => <Icons.Inbox size={20} />,
  "/tracker": () => <Icons.Tracker size={20} />,
  "/invoices": () => <Icons.Invoice size={20} />,
  "/transactions": () => <Icons.Transactions size={20} />,
  "/vault": () => <Icons.Files size={20} />,
  "/customers": () => <Users size={20} strokeWidth={1.5} />,
  "/apps": () => <Icons.Apps size={20} />,
  // Vending section
  "/operations": () => <LayoutGrid size={20} strokeWidth={1.5} />,
  "/routes": () => <Route size={20} strokeWidth={1.5} />,
  "/locations": () => <Icons.Tracker size={20} />,
  "/machines": () => <Icons.Settings size={20} />,
  "/skus": () => <Icons.Apps size={20} />,
  "/calculators": () => <Icons.Invoice size={20} />,
  "/scenarios": () => <Icons.Tracker size={20} />,
  "/alerts": () => <Icons.Transactions size={20} />,
  "/import": () => <Icons.Files size={20} />,
  "/logistics": () => <CalendarDays size={20} strokeWidth={1.5} />,
  "/employees": () => <UserCheck size={20} strokeWidth={1.5} />,
  "/training": () => <GraduationCap size={20} strokeWidth={1.5} />,
  "/passwords": () => <KeyRound size={20} strokeWidth={1.5} />,
  "/reports": () => <FileBarChart size={20} strokeWidth={1.5} />,
  "/finance": () => <BarChart3 size={20} strokeWidth={1.5} />,
  "/capacity": () => <UsersRound size={20} strokeWidth={1.5} />,
  "/productivity": () => <ClipboardCheck size={20} strokeWidth={1.5} />,
} as const;

const items = [
  // ─── Core Financial Features ───
  { path: "/", name: "Overview" },
  { path: "/inbox", name: "Inbox" },
  { path: "/tracker", name: "Tracker" },
  { path: "/invoices", name: "Invoices" },
  { path: "/transactions", name: "Transactions" },
  { path: "/vault", name: "Vault" },
  { path: "/customers", name: "Customers" },
  // ─── VendCFO Operations ───
  {
    path: "/operations",
    name: "Operations",
    children: [
      { path: "/routes", name: "Routes" },
      { path: "/logistics", name: "Logistics" },
      { path: "/locations", name: "Locations" },
      { path: "/machines", name: "Machines" },
      { path: "/skus", name: "Products & SKUs" },
      { path: "/import", name: "Import Data" },
    ],
  },
  // ─── VendCFO Analytics ───
  {
    path: "/calculators",
    name: "Analytics",
    children: [
      { path: "/finance", name: "Finance" },
      { path: "/capacity", name: "Capacity" },
      { path: "/productivity", name: "Productivity" },
      { path: "/calculators", name: "Calculators" },
      { path: "/reports", name: "Reports" },
      { path: "/scenarios", name: "Scenario Builder" },
      { path: "/alerts", name: "Alerts" },
    ],
  },
  // ─── VendCFO Workforce ───
  { path: "/employees", name: "Workforce" },
  // ─── Training & Security ───
  { path: "/training", name: "Training" },
  { path: "/passwords", name: "Passwords" },
  { path: "/apps", name: "Apps" },
];

interface ItemProps {
  item: {
    path: string;
    name: string;
    children?: { path: string; name: string }[];
  };
  isActive: boolean;
  isExpanded: boolean;
  isItemExpanded: boolean;
  onToggle: (path: string) => void;
  onSelect?: () => void;
}

const ChildItem = ({
  child,
  isActive,
  isExpanded,
  shouldShow,
  onSelect,
  index,
}: {
  child: { path: string; name: string };
  isActive: boolean;
  isExpanded: boolean;
  shouldShow: boolean;
  onSelect?: () => void;
  index: number;
}) => {
  const showChild = isExpanded && shouldShow;

  return (
    <ForesightLink
      href={child.path}
      onClick={() => onSelect?.()}
      className="block group/child"
      name={`nav-child-${child.name.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="relative">
        {/* Child item text */}
        <div
          className={cn(
            "ml-[35px] mr-[15px] h-[32px] flex items-center",
            "border-l border-[#e6e6e6] pl-3",
            "transition-all duration-200 ease-out",
            showChild
              ? "opacity-100 translate-x-0"
              : "opacity-0 -translate-x-2",
          )}
          style={{
            transitionDelay: showChild
              ? `${40 + index * 20}ms`
              : `${index * 20}ms`,
          }}
        >
          <span
            className={cn(
              "text-xs font-medium transition-colors duration-200",
              "text-[#888] group-hover/child:text-primary",
              "whitespace-nowrap overflow-hidden",
              isActive && "text-primary",
            )}
          >
            {child.name}
          </span>
        </div>
      </div>
    </ForesightLink>
  );
};

const Item = ({
  item,
  isActive,
  isExpanded,
  isItemExpanded,
  onToggle,
  onSelect,
}: ItemProps) => {
  const Icon = icons[item.path as keyof typeof icons];
  const pathname = usePathname();
  const hasChildren = item.children && item.children.length > 0;

  // Children should be visible when: expanded sidebar AND this item is expanded
  const shouldShowChildren = isExpanded && isItemExpanded;

  const handleChevronClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle(item.path);
  };

  return (
    <div className="group">
      <ForesightLink
        href={item.path}
        onClick={() => onSelect?.()}
        className="group"
        name={`nav-${item.name.toLowerCase()}`}
      >
        <div className="relative">
          {/* Background that expands */}
          <div
            className={cn(
              "border border-transparent h-[40px] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ml-[15px] mr-[15px]",
              isActive && "bg-[#f7f7f7] border-[#e6e6e6]",
              isExpanded ? "w-[calc(100%-30px)]" : "w-[40px]",
            )}
          />

          {/* Icon - always in same position from sidebar edge */}
          <div className="absolute top-0 left-[15px] w-[40px] h-[40px] flex items-center justify-center text-black group-hover:!text-primary pointer-events-none">
            <div>
              <Icon />
            </div>
          </div>

          {isExpanded && (
            <div className="absolute top-0 left-[55px] right-[4px] h-[40px] flex items-center pointer-events-none">
              <span
                className={cn(
                  "text-sm font-medium transition-opacity duration-200 ease-in-out text-[#666] group-hover:text-primary",
                  "whitespace-nowrap overflow-hidden",
                  hasChildren ? "pr-2" : "",
                  isActive && "text-primary",
                )}
              >
                {item.name}
              </span>
              {hasChildren && (
                <button
                  type="button"
                  onClick={handleChevronClick}
                  className={cn(
                    "w-8 h-8 flex items-center justify-center transition-all duration-200 ml-auto mr-3",
                    "text-[#888] hover:text-primary pointer-events-auto",
                    isActive && "text-primary/60",
                    shouldShowChildren && "rotate-180",
                  )}
                >
                  <Icons.ChevronDown size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      </ForesightLink>

      {/* Children */}
      {hasChildren && (
        <div
          className={cn(
            "transition-all duration-300 ease-out overflow-hidden",
            shouldShowChildren ? "max-h-96 mt-1" : "max-h-0",
          )}
        >
          {item.children!.map((child, index) => {
            const isChildActive = pathname === child.path;
            return (
              <ChildItem
                key={child.path}
                child={child}
                isActive={isChildActive}
                isExpanded={isExpanded}
                shouldShow={shouldShowChildren}
                onSelect={onSelect}
                index={index}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

type Props = {
  onSelect?: () => void;
  isExpanded?: boolean;
};

export function MainMenu({ onSelect, isExpanded = false }: Props) {
  const pathname = usePathname();
  const { isChatPage } = useChatInterface();
  const part = pathname?.split("/")[1];
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Reset expanded item when sidebar expands/collapses
  useEffect(() => {
    setExpandedItem(null);
  }, [isExpanded]);

  // Vending operation paths that should highlight the Operations parent
  const vendingOpPaths = [
    "/operations",
    "/routes",
    "/logistics",
    "/locations",
    "/machines",
    "/skus",
    "/import",
  ];
  const vendingAnalyticsPaths = ["/calculators", "/finance", "/capacity", "/productivity", "/reports", "/scenarios", "/alerts"];

  return (
    <div className="mt-6 w-full">
      <nav className="w-full">
        <div className="flex flex-col gap-2">
          {items.map((item) => {
            // Check if current path matches item path or is a child of it
            // Chat pages (/chat/*) should highlight Overview
            const isActive =
              (pathname === "/" && item.path === "/") ||
              (item.path === "/" && isChatPage) ||
              (item.path === "/operations" &&
                vendingOpPaths.some((p) => pathname?.startsWith(p))) ||
              (item.path === "/calculators" &&
                vendingAnalyticsPaths.some((p) => pathname?.startsWith(p))) ||
              (pathname !== "/" &&
                !isChatPage &&
                !vendingOpPaths.includes(`/${part}`) &&
                !vendingAnalyticsPaths.includes(`/${part}`) &&
                item.path.startsWith(`/${part}`));

            return (
              <Item
                key={item.path}
                item={item}
                isActive={isActive}
                isExpanded={isExpanded}
                isItemExpanded={expandedItem === item.path}
                onToggle={(path) => {
                  setExpandedItem(expandedItem === path ? null : path);
                }}
                onSelect={onSelect}
              />
            );
          })}
        </div>
      </nav>
    </div>
  );
}
