"use client";

import { motion } from "framer-motion";
import { BarChart3, MapPin, Monitor, FileText } from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "AI-Powered Insights",
    description: "Automated financial analysis tailored to your vending operation",
  },
  {
    icon: MapPin,
    title: "Route Optimization",
    description: "Maximize machine profitability with intelligent routing",
  },
  {
    icon: Monitor,
    title: "Real-time Tracking",
    description: "Monitor all locations and machines from a single dashboard",
  },
  {
    icon: FileText,
    title: "Smart Invoicing",
    description: "Automated billing and payments for every account",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

export function LoginFeatureShowcase() {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
      <div className="absolute inset-0 bg-[#1a1a1a]" />

      <div className="relative z-10 flex flex-col justify-center items-start p-12 xl:p-16 h-full w-full">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-12"
        >
          <h2 className="text-2xl font-serif text-white mb-3">
            Financial clarity for vending operators
          </h2>
          <p className="text-sm text-white/50 max-w-sm leading-relaxed">
            Everything you need to manage, track, and grow your vending business
            — in one place.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6 w-full max-w-md"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="flex items-start gap-4 group"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
                <feature.icon className="w-5 h-5 text-white/70" strokeWidth={1.5} />
              </div>
              <div className="pt-0.5">
                <h3 className="text-sm font-medium text-white mb-1">
                  {feature.title}
                </h3>
                <p className="text-xs text-white/40 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-auto pt-12"
        >
          <p className="text-xs text-white/25">
            Trusted by vending operators nationwide
          </p>
        </motion.div>
      </div>
    </div>
  );
}
