"use client";

import { useState, useEffect } from "react";
import NextLink from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DropletIcon,
  InjectionIcon,
  Restaurant01Icon,
  ArrowRight01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { motion, AnimatePresence } from "framer-motion";

const logActions = [
  {
    title: "Blood Sugar",
    description: "Record your blood glucose reading in seconds.",
    href: "/log/blood-sugar",
    icon: DropletIcon,
    gradient: "from-rose-500 to-pink-500",
    gradientBg: "from-rose-500/20 to-pink-500/20",
    shadowColor: "shadow-rose-500/25",
    iconColor: "text-rose-400",
  },
  {
    title: "Insulin",
    description: "Track your insulin dose and injection details.",
    href: "/log/insulin",
    icon: InjectionIcon,
    gradient: "from-blue-500 to-indigo-500",
    gradientBg: "from-blue-500/20 to-indigo-500/20",
    shadowColor: "shadow-blue-500/25",
    iconColor: "text-blue-400",
  },
  {
    title: "Meal",
    description: "Log what you ate and get AI-powered nutrition analysis.",
    href: "/log/meals",
    icon: Restaurant01Icon,
    gradient: "from-emerald-500 to-teal-500",
    gradientBg: "from-emerald-500/20 to-teal-500/20",
    shadowColor: "shadow-emerald-500/25",
    iconColor: "text-emerald-400",
  },
];

const tips = [
  "Regular logging helps you and your doctor spot patterns. Even a quick blood sugar reading makes a difference!",
  "Try to log your blood sugar before and after meals to understand how food affects you.",
  "Consistent insulin tracking helps find the perfect balance for your body.",
  "Adding photos to meal logs makes AI analysis more accurate and earns you bonus XP!",
  "Logging at the same times each day builds a habit that keeps you healthy.",
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

const headerVariants = {
  hidden: { opacity: 0, x: -40 },
  show: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 200, damping: 20 },
  },
};

export default function LogHubPage() {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <motion.div
        animate="show"
        className="text-center"
        initial="hidden"
        variants={headerVariants}
      >
        <h1 className="text-3xl font-bold text-foreground">Quick Log</h1>
        <p className="mt-2 text-lg text-default-500">
          What would you like to log today?
        </p>
      </motion.div>

      {/* Quick action cards */}
      <motion.div
        animate="show"
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        initial="hidden"
        variants={containerVariants}
      >
        {logActions.map((action) => (
          <motion.div key={action.href} variants={itemVariants}>
            <NextLink className="block no-underline group" href={action.href}>
              <motion.div
                className={`relative h-full overflow-hidden rounded-2xl border border-default-200 bg-content1 p-1 transition-shadow duration-300 hover:${action.shadowColor}`}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Gradient icon area */}
                <div
                  className={`relative flex h-32 items-center justify-center rounded-xl bg-gradient-to-br ${action.gradientBg} overflow-hidden`}
                >
                  {/* Background decorative circles */}
                  <div
                    className={`absolute -top-6 -right-6 h-24 w-24 rounded-full bg-gradient-to-br ${action.gradient} opacity-10 blur-md transition-opacity duration-300 group-hover:opacity-25`}
                  />
                  <div
                    className={`absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-gradient-to-br ${action.gradient} opacity-10 blur-md transition-opacity duration-300 group-hover:opacity-20`}
                  />

                  <motion.span
                    className={action.iconColor}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    whileHover={{ rotate: 12 }}
                  >
                    <HugeiconsIcon
                      color="currentColor"
                      icon={action.icon}
                      size={48}
                      strokeWidth={1.5}
                    />
                  </motion.span>
                </div>

                {/* Card content */}
                <div className="flex items-center justify-between px-4 py-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">
                      {action.title}
                    </h3>
                    <p className="mt-0.5 text-sm text-default-500">
                      {action.description}
                    </p>
                  </div>

                  {/* Animated arrow */}
                  <motion.span
                    className="ml-3 flex-shrink-0 text-default-400 transition-colors group-hover:text-foreground"
                    initial={{ x: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    whileHover={{ x: 4 }}
                  >
                    <HugeiconsIcon
                      color="currentColor"
                      icon={ArrowRight01Icon}
                      size={20}
                      strokeWidth={2}
                    />
                  </motion.span>
                </div>

                {/* Bottom gradient line on hover */}
                <div
                  className={`absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r ${action.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                />
              </motion.div>
            </NextLink>
          </motion.div>
        ))}
      </motion.div>

      {/* Rotating tips */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl border border-default-200 bg-default-50/50 p-5"
        initial={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 20 }}
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex-shrink-0 text-primary">
            <HugeiconsIcon
              color="currentColor"
              icon={SparklesIcon}
              size={18}
              strokeWidth={2}
            />
          </span>
          <div className="min-h-[2.5rem]">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Pro tip
            </span>
            <AnimatePresence mode="wait">
              <motion.p
                key={tipIndex}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 text-sm text-default-600"
                exit={{ opacity: 0, y: -8 }}
                initial={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.3 }}
              >
                {tips[tipIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
