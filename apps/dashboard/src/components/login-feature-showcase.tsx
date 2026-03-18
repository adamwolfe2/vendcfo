"use client";

import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

// --- Animated counter hook ---
function useAnimatedCounter(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(start + (target - start) * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

// --- Chart data generators ---
const revenueData = [
  { month: "Jul", value: 28400 },
  { month: "Aug", value: 31200 },
  { month: "Sep", value: 29800 },
  { month: "Oct", value: 35600 },
  { month: "Nov", value: 38900 },
  { month: "Dec", value: 36200 },
  { month: "Jan", value: 41500 },
  { month: "Feb", value: 43800 },
  { month: "Mar", value: 47280 },
];

const machineData = [
  { name: "Snacks", revenue: 12400, margin: 42 },
  { name: "Drinks", revenue: 18200, margin: 38 },
  { name: "Coffee", revenue: 8900, margin: 56 },
  { name: "Fresh", revenue: 4200, margin: 31 },
  { name: "Combo", revenue: 3580, margin: 44 },
];

const routeData = [
  { day: "Mon", stops: 34, miles: 82 },
  { day: "Tue", stops: 38, miles: 76 },
  { day: "Wed", stops: 31, miles: 68 },
  { day: "Thu", stops: 42, miles: 91 },
  { day: "Fri", stops: 36, miles: 73 },
  { day: "Sat", stops: 28, miles: 55 },
];

const cashflowData = [
  { week: "W1", income: 11200, expenses: 4800 },
  { week: "W2", income: 12800, expenses: 5200 },
  { week: "W3", income: 10600, expenses: 4100 },
  { week: "W4", income: 12654, expenses: 5400 },
];

// --- Slide components ---
function RevenueSlide() {
  const revenue = useAnimatedCounter(47280);
  const machines = useAnimatedCounter(142);
  const perMachine = useAnimatedCounter(333);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-[11px] text-white/35 mb-1">Monthly Revenue</p>
          <p className="text-xl font-medium text-white tabular-nums">
            ${revenue.toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-400/70 mt-0.5">+12.4%</p>
        </div>
        <div>
          <p className="text-[11px] text-white/35 mb-1">Active Machines</p>
          <p className="text-xl font-medium text-white tabular-nums">{machines}</p>
          <p className="text-[11px] text-emerald-400/70 mt-0.5">+8 this month</p>
        </div>
        <div>
          <p className="text-[11px] text-white/35 mb-1">Avg / Machine</p>
          <p className="text-xl font-medium text-white tabular-nums">${perMachine}</p>
          <p className="text-[11px] text-emerald-400/70 mt-0.5">+5.2%</p>
        </div>
      </div>

      <div className="h-[180px] -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              width={40}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth={1.5}
              fill="url(#revGradient)"
              dot={false}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MachineSlide() {
  const online = useAnimatedCounter(138);
  const alerts = useAnimatedCounter(7);
  const today = useAnimatedCounter(1847);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-[11px] text-white/35 mb-1">Machines Online</p>
          <p className="text-xl font-medium text-white tabular-nums">{online}/142</p>
          <p className="text-[11px] text-emerald-400/70 mt-0.5">97.2% uptime</p>
        </div>
        <div>
          <p className="text-[11px] text-white/35 mb-1">Low Stock Alerts</p>
          <p className="text-xl font-medium text-white tabular-nums">{alerts}</p>
          <p className="text-[11px] text-amber-400/70 mt-0.5">need restock</p>
        </div>
        <div>
          <p className="text-[11px] text-white/35 mb-1">Revenue Today</p>
          <p className="text-xl font-medium text-white tabular-nums">${today.toLocaleString()}</p>
          <p className="text-[11px] text-emerald-400/70 mt-0.5">+$213 vs avg</p>
        </div>
      </div>

      <div className="h-[180px] -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={machineData} barSize={28}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              width={40}
            />
            <Bar
              dataKey="revenue"
              fill="rgba(255,255,255,0.12)"
              radius={[3, 3, 0, 0]}
              animationDuration={1200}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RouteSlide() {
  const routes = useAnimatedCounter(24);
  const stops = useAnimatedCounter(38);
  const savings = useAnimatedCounter(1240);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-[11px] text-white/35 mb-1">Routes Optimized</p>
          <p className="text-xl font-medium text-white tabular-nums">{routes}</p>
          <p className="text-[11px] text-emerald-400/70 mt-0.5">-18% drive time</p>
        </div>
        <div>
          <p className="text-[11px] text-white/35 mb-1">Stops / Day</p>
          <p className="text-xl font-medium text-white tabular-nums">{stops}</p>
          <p className="text-[11px] text-emerald-400/70 mt-0.5">+6 vs last month</p>
        </div>
        <div>
          <p className="text-[11px] text-white/35 mb-1">Fuel Savings</p>
          <p className="text-xl font-medium text-white tabular-nums">${savings.toLocaleString()}</p>
          <p className="text-[11px] text-white/35 mt-0.5">per month</p>
        </div>
      </div>

      <div className="h-[180px] -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={routeData}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Line
              type="monotone"
              dataKey="stops"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth={1.5}
              dot={{ fill: "rgba(255,255,255,0.3)", r: 3, strokeWidth: 0 }}
              activeDot={{ fill: "white", r: 4, strokeWidth: 0 }}
              animationDuration={1500}
            />
            <Line
              type="monotone"
              dataKey="miles"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CashflowSlide() {
  const collected = useAnimatedCounter(38420);
  const rate = useAnimatedCounter(94);
  const days = useAnimatedCounter(42);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-[11px] text-white/35 mb-1">Collected</p>
          <p className="text-xl font-medium text-white tabular-nums">
            ${collected.toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-400/70 mt-0.5">this month</p>
        </div>
        <div>
          <p className="text-[11px] text-white/35 mb-1">Collection Rate</p>
          <p className="text-xl font-medium text-white tabular-nums">{rate}%</p>
          <p className="text-[11px] text-emerald-400/70 mt-0.5">+3% vs prior</p>
        </div>
        <div>
          <p className="text-[11px] text-white/35 mb-1">Avg. Days to Pay</p>
          <p className="text-xl font-medium text-white tabular-nums">{(days / 10).toFixed(1)}</p>
          <p className="text-[11px] text-emerald-400/70 mt-0.5">-2.1 days</p>
        </div>
      </div>

      <div className="h-[180px] -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={cashflowData} barSize={20} barGap={4}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="week"
              tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              width={40}
            />
            <Bar
              dataKey="income"
              fill="rgba(255,255,255,0.2)"
              radius={[3, 3, 0, 0]}
              animationDuration={1200}
            />
            <Bar
              dataKey="expenses"
              fill="rgba(255,255,255,0.06)"
              radius={[3, 3, 0, 0]}
              animationDuration={1200}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// --- Slide metadata ---
const slides = [
  {
    label: "Revenue Overview",
    title: "Track every dollar across your operation",
    component: RevenueSlide,
  },
  {
    label: "Machine Performance",
    title: "See which machines drive your business",
    component: MachineSlide,
  },
  {
    label: "Route Intelligence",
    title: "Optimize every route, every day",
    component: RouteSlide,
  },
  {
    label: "Cash Flow",
    title: "Know exactly where your money is",
    component: CashflowSlide,
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
    const timer = setInterval(next, 7000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = slides[current];
  if (!slide) return null;
  const SlideComponent = slide.component;

  return (
    <div className="hidden lg:flex flex-1 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#111]" />

      {/* Content — centered */}
      <div className="relative z-10 flex flex-col justify-center items-center w-full h-full p-10 xl:p-14">
        <div className="w-full max-w-[480px]">
          {/* Header */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`header-${current}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
            >
              <p className="text-[11px] font-mono tracking-wider text-white/30 uppercase mb-3">
                {slide.label}
              </p>
              <h2 className="text-xl font-medium text-white mb-8 leading-snug">
                {slide.title}
              </h2>
            </motion.div>
          </AnimatePresence>

          {/* Chart card */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={`chart-${current}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <SlideComponent />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <div className="flex items-center gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setDirection(i > current ? 1 : -1);
                    setCurrent(i);
                  }}
                >
                  <div
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === current
                        ? "w-5 bg-white/50"
                        : "w-1.5 bg-white/15 hover:bg-white/25"
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prev}
                className="w-7 h-7 rounded border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-white/60 hover:border-white/15 transition-all text-xs"
              >
                &#8249;
              </button>
              <button
                type="button"
                onClick={next}
                className="w-7 h-7 rounded border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-white/60 hover:border-white/15 transition-all text-xs"
              >
                &#8250;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
