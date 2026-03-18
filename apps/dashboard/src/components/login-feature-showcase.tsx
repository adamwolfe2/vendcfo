"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  MapPin,
  Monitor,
  FileText,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const slides = [
  {
    label: "FINANCIAL DASHBOARD",
    title: "Complete visibility into your vending operation",
    description:
      "Track revenue, expenses, and profitability across every machine and location in real-time.",
    metrics: [
      { label: "Monthly Revenue", value: "$47,280", trend: "+12.4%" },
      { label: "Active Machines", value: "142", trend: "+8" },
      { label: "Avg. Per Machine", value: "$333", trend: "+5.2%" },
    ],
    icon: BarChart3,
    color: "#2563eb",
  },
  {
    label: "ROUTE OPTIMIZATION",
    title: "Smart routing that maximizes every stop",
    description:
      "AI-powered route planning reduces drive time and ensures high-revenue machines get serviced first.",
    metrics: [
      { label: "Routes Optimized", value: "24", trend: "-18% drive time" },
      { label: "Stops Per Day", value: "38", trend: "+6 vs last month" },
      { label: "Fuel Savings", value: "$1,240", trend: "/month" },
    ],
    icon: MapPin,
    color: "#059669",
  },
  {
    label: "MACHINE TRACKING",
    title: "Monitor every machine from one screen",
    description:
      "Real-time inventory levels, sales alerts, and maintenance tracking across your entire fleet.",
    metrics: [
      { label: "Machines Online", value: "138/142", trend: "97.2% uptime" },
      { label: "Low Stock Alerts", value: "7", trend: "need restock" },
      { label: "Revenue Today", value: "$1,847", trend: "+$213 vs avg" },
    ],
    icon: Monitor,
    color: "#7c3aed",
  },
  {
    label: "SMART INVOICING",
    title: "Automated billing that gets you paid faster",
    description:
      "Generate invoices, track payments, and manage accounts receivable — all on autopilot.",
    metrics: [
      { label: "Invoices Sent", value: "86", trend: "this month" },
      { label: "Collected", value: "$38,420", trend: "94% rate" },
      { label: "Avg. Days to Pay", value: "4.2", trend: "-2.1 days" },
    ],
    icon: FileText,
    color: "#dc2626",
  },
];

export function LoginFeatureShowcase() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = slides[current];
  if (!slide) return null;
  const Icon = slide.icon;

  return (
    <div className="hidden lg:flex flex-1 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0f0f0f]" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center items-center w-full h-full p-12 xl:p-16">
        <div className="w-full max-w-lg">
          {/* Slide content */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              {/* Label */}
              <div className="flex items-center gap-2 mb-6">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: slide.color }}
                />
                <span className="text-[11px] font-mono tracking-widest text-white/40 uppercase">
                  {slide.label}
                </span>
              </div>

              {/* Title & Description */}
              <h2 className="text-2xl xl:text-3xl font-serif text-white mb-3 leading-tight">
                {slide.title}
              </h2>
              <p className="text-sm text-white/45 leading-relaxed mb-10 max-w-md">
                {slide.description}
              </p>

              {/* Metrics Card */}
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-6">
                {/* Card header */}
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/[0.06]">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${slide.color}20` }}
                  >
                    <Icon
                      className="w-4.5 h-4.5"
                      style={{ color: slide.color }}
                      strokeWidth={1.5}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/90">
                      {slide.label.charAt(0) +
                        slide.label.slice(1).toLowerCase()}
                    </p>
                    <p className="text-[11px] text-white/30">Live preview</p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-4">
                  {slide.metrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="flex items-center justify-between"
                    >
                      <span className="text-xs text-white/40">
                        {metric.label}
                      </span>
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-medium text-white/90 tabular-nums">
                          {metric.value}
                        </span>
                        <span className="text-[11px] text-emerald-400/80 flex items-center gap-0.5">
                          <TrendingUp className="w-3 h-3" />
                          {metric.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-10">
            {/* Dots */}
            <div className="flex items-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setDirection(i > current ? 1 : -1);
                    setCurrent(i);
                  }}
                  className="transition-all duration-300"
                >
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === current
                        ? "w-6 bg-white/70"
                        : "w-1.5 bg-white/20 hover:bg-white/30"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Arrows */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prev}
                className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white/70 hover:border-white/20 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={next}
                className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white/70 hover:border-white/20 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
