"use client";

import type { DietPlan } from "@/types/database";

import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import NextLink from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Restaurant01Icon } from "@hugeicons/core-free-icons";

import { getDietPlans } from "@/lib/actions/diet";
import DietPlanCard from "@/components/diet/diet-plan-card";

type StatusFilter = "all" | "active" | "completed" | "paused";

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

const filterChipVariants = {
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

const bouncingFoodVariants = {
  animate: (i: number) => ({
    y: [0, -12, 0],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      delay: i * 0.3,
      ease: "easeInOut",
    },
  }),
};

const FOOD_ICONS = ["🥗", "🍎", "🥑", "🍳", "🥕", "🍇"];

export default function DietPlansPage() {
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const result = await getDietPlans();

      if (result.data) {
        setPlans(result.data);
      }
      setLoading(false);
    }
    load();
  }, []);

  const filteredPlans =
    filter === "all" ? plans : plans.filter((p) => p.status === filter);

  const filterOptions: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "completed", label: "Completed" },
    { key: "paused", label: "Paused" },
  ];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      {/* Header */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Your Diet Plans
          </h1>
          <p className="mt-1 text-sm text-default-500">
            AI-generated meal plans tailored for your diabetes management
          </p>
        </div>
        <Button
          as={NextLink}
          color="primary"
          href="/diet/create"
          size="lg"
          startContent={
            <HugeiconsIcon
              color="currentColor"
              icon={Add01Icon}
              size={18}
              strokeWidth={2}
            />
          }
        >
          Create New Plan
        </Button>
      </motion.div>

      {/* Status filter */}
      <motion.div
        animate="show"
        className="flex flex-wrap gap-2"
        initial="hidden"
        variants={containerVariants}
      >
        {filterOptions.map((opt) => (
          <motion.button
            key={opt.key}
            animate={filter === opt.key ? { scale: [1, 1.08, 1] } : {}}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === opt.key
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "bg-default-100 text-default-600 hover:bg-default-200"
            }`}
            transition={
              filter === opt.key
                ? { type: "spring", stiffness: 400, damping: 15 }
                : undefined
            }
            variants={filterChipVariants}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(opt.key)}
          >
            {opt.label}
          </motion.button>
        ))}
      </motion.div>

      {/* Content */}
      {loading ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-20"
          initial={{ opacity: 0 }}
        >
          <Spinner label="Loading your diet plans..." size="lg" />
        </motion.div>
      ) : filteredPlans.length === 0 ? (
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-default-200 bg-default-50/50 py-16"
          initial={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          {/* Bouncing food icons */}
          <div className="mb-6 flex items-end gap-3">
            {FOOD_ICONS.map((icon, i) => (
              <motion.div
                key={i}
                animate="animate"
                className="text-3xl"
                custom={i}
                variants={bouncingFoodVariants}
              >
                {icon}
              </motion.div>
            ))}
          </div>

          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            className="mb-3 rounded-full bg-primary/10 p-4"
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <HugeiconsIcon
              color="hsl(var(--heroui-primary))"
              icon={Restaurant01Icon}
              size={32}
              strokeWidth={1.5}
            />
          </motion.div>

          <h2 className="mb-2 text-xl font-semibold text-foreground">
            {filter !== "all"
              ? `No ${filter} plans found`
              : "No diet plans yet"}
          </h2>
          <p className="mb-6 max-w-md text-center text-sm text-default-500">
            {filter !== "all"
              ? "Try switching to a different filter to see your plans."
              : "Create your first AI-powered diet plan! Our assistant will generate a personalized 7-day meal plan based on your diabetes profile and food preferences."}
          </p>
          {filter === "all" && (
            <motion.div
              animate={{ scale: [1, 1.03, 1] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Button
                as={NextLink}
                color="primary"
                href="/diet/create"
                size="lg"
                startContent={
                  <HugeiconsIcon
                    color="currentColor"
                    icon={Add01Icon}
                    size={18}
                    strokeWidth={2}
                  />
                }
                variant="shadow"
              >
                Create Your First Plan
              </Button>
            </motion.div>
          )}
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            animate="show"
            className="grid gap-4 sm:grid-cols-2"
            exit={{ opacity: 0, y: 10 }}
            initial="hidden"
            variants={containerVariants}
          >
            {filteredPlans.map((plan) => (
              <motion.div key={plan.id} variants={itemVariants}>
                <DietPlanCard plan={plan} />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
