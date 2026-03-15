"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SparklesIcon,
  Alert01Icon,
  InjectionIcon,
} from "@hugeicons/core-free-icons";
import { motion, AnimatePresence } from "framer-motion";

export type NutritionData = {
  carbs: number | null;
  calories: number | null;
  protein: number | null;
  fat: number | null;
  sugar: number | null;
  fiber: number | null;
};

type NutritionCardProps = {
  data: NutritionData;
  recommendedInsulin?: number | null;
  isLoading?: boolean;
};

type NutrientDisplay = {
  key: keyof NutritionData;
  label: string;
  unit: string;
  barColor: string;
  bgColor: string;
  maxValue: number;
  highlight?: boolean;
};

const nutrients: NutrientDisplay[] = [
  {
    key: "carbs",
    label: "Carbs",
    unit: "g",
    barColor: "bg-amber-500",
    bgColor: "bg-amber-500/15",
    maxValue: 150,
    highlight: true,
  },
  {
    key: "calories",
    label: "Calories",
    unit: "kcal",
    barColor: "bg-purple-500",
    bgColor: "bg-purple-500/15",
    maxValue: 800,
  },
  {
    key: "protein",
    label: "Protein",
    unit: "g",
    barColor: "bg-blue-500",
    bgColor: "bg-blue-500/15",
    maxValue: 60,
  },
  {
    key: "fat",
    label: "Fat",
    unit: "g",
    barColor: "bg-red-500",
    bgColor: "bg-red-500/15",
    maxValue: 50,
  },
  {
    key: "sugar",
    label: "Sugar",
    unit: "g",
    barColor: "bg-pink-500",
    bgColor: "bg-pink-500/15",
    maxValue: 80,
  },
  {
    key: "fiber",
    label: "Fiber",
    unit: "g",
    barColor: "bg-emerald-500",
    bgColor: "bg-emerald-500/15",
    maxValue: 30,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const barItemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

function AnimatedBar({
  percent,
  barColor,
  bgColor,
  isLarge,
}: {
  percent: number;
  barColor: string;
  bgColor: string;
  isLarge?: boolean;
}) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(percent), 100);

    return () => clearTimeout(timer);
  }, [percent]);

  return (
    <div
      className={`w-full overflow-hidden rounded-full ${bgColor} ${isLarge ? "h-3" : "h-2"}`}
    >
      <motion.div
        animate={{ width: `${width}%` }}
        className={`h-full rounded-full ${barColor}`}
        initial={{ width: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}

export default function NutritionCard({
  data,
  recommendedInsulin,
  isLoading = false,
}: NutritionCardProps) {
  if (isLoading) {
    return (
      <Card className="border border-default-200">
        <CardBody className="flex items-center justify-center p-8">
          <div className="space-y-3 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-default-500">
              Analyzing your food with AI...
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  const hasAnyData = Object.values(data).some(
    (v) => v !== null && v !== undefined,
  );

  if (!hasAnyData) return null;

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 20 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <Card className="border border-default-200 overflow-hidden">
        <CardHeader className="flex items-center gap-2 pb-2">
          <span className="text-success">
            <HugeiconsIcon
              color="currentColor"
              icon={SparklesIcon}
              size={20}
              strokeWidth={1.5}
            />
          </span>
          <h3 className="text-base font-semibold">Nutrition Breakdown</h3>
        </CardHeader>

        <CardBody className="space-y-4 pt-0">
          {/* Carbs highlight - most important for diabetes */}
          {data.carbs !== null && data.carbs !== undefined && (
            <div className="rounded-xl border border-warning/30 bg-warning-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-warning-600">
                    Total Carbs
                  </p>
                  <p className="text-4xl font-bold text-foreground">
                    {data.carbs}
                    <span className="ml-1 text-base font-normal text-default-400">
                      g
                    </span>
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/15">
                  <HugeiconsIcon
                    className="text-warning-600"
                    color="currentColor"
                    icon={Alert01Icon}
                    size={24}
                    strokeWidth={2}
                  />
                </div>
              </div>
              <AnimatedBar
                isLarge
                barColor="bg-warning"
                bgColor="bg-warning/20"
                percent={Math.min((data.carbs / 150) * 100, 100)}
              />
              <p className="mt-2 text-xs text-default-500">
                This is the key number for calculating insulin
              </p>
            </div>
          )}

          {/* Other nutrients with animated bars */}
          <motion.div
            animate="show"
            className="space-y-3"
            initial="hidden"
            variants={containerVariants}
          >
            {nutrients
              .filter((n) => n.key !== "carbs")
              .map((nutrient) => {
                const val = data[nutrient.key];

                if (val === null || val === undefined) return null;

                const percent = Math.min((val / nutrient.maxValue) * 100, 100);

                return (
                  <motion.div
                    key={nutrient.key}
                    className="space-y-1.5"
                    variants={barItemVariants}
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-default-700">
                        {nutrient.label}
                      </span>
                      <span className="text-default-500">
                        {val} {nutrient.unit}
                      </span>
                    </div>
                    <AnimatedBar
                      barColor={nutrient.barColor}
                      bgColor={nutrient.bgColor}
                      percent={percent}
                    />
                  </motion.div>
                );
              })}
          </motion.div>

          {/* Recommended Insulin Callout */}
          <AnimatePresence>
            {recommendedInsulin !== null &&
              recommendedInsulin !== undefined &&
              recommendedInsulin > 0 && (
                <>
                  <Divider />
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-primary/30 bg-primary/10 p-4"
                    exit={{ opacity: 0, y: -10 }}
                    initial={{ opacity: 0, y: 10 }}
                    style={{
                      animation: "pulse-glow 3s ease-in-out infinite",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                        <span className="text-primary">
                          <HugeiconsIcon
                            color="currentColor"
                            icon={InjectionIcon}
                            size={22}
                            strokeWidth={1.5}
                          />
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-primary-400">
                          Suggested Insulin
                        </p>
                        <p className="text-3xl font-bold text-primary">
                          {recommendedInsulin.toFixed(1)}
                          <span className="ml-1 text-sm font-normal text-primary/70">
                            units
                          </span>
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-primary/60">
                      Based on your carb-to-insulin ratio. Always confirm with
                      your doctor before adjusting doses.
                    </p>
                  </motion.div>
                </>
              )}
          </AnimatePresence>
        </CardBody>
      </Card>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 8px rgba(59, 130, 246, 0.1); }
          50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.2); }
        }
      `}</style>
    </motion.div>
  );
}
