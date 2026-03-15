"use client";

import type { DietPlan, DietPlanMeal } from "@/types/database";

import { useEffect, useRef, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { motion, AnimatePresence } from "framer-motion";

import { getDietPlan, updateDietPlanStatus } from "@/lib/actions/diet";
import MealPlanRow from "@/components/diet/meal-plan-row";
import { RotatingText } from "@/components/ui/rotating-text";
import { DAY_NAMES } from "@/lib/constants";

const STATUS_COLORS: Record<
  DietPlan["status"],
  "success" | "warning" | "primary" | "default"
> = {
  active: "success",
  paused: "warning",
  completed: "primary",
  draft: "default",
};

export default function DietPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [meals, setMeals] = useState<DietPlanMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const result = await getDietPlan(id);

      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setPlan(result.data);
        setMeals(result.data.meals || []);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleStatusChange(status: DietPlan["status"]) {
    if (!plan) return;

    setStatusUpdating(true);
    const result = await updateDietPlanStatus(plan.id, status);

    if (result.data) {
      setPlan(result.data);
    } else if (result.error) {
      setError(result.error);
    }
    setStatusUpdating(false);
  }

  function getMealsForDay(day: number): DietPlanMeal[] {
    return meals
      .filter((m) => m.day_of_week === day)
      .sort((a, b) => {
        const order = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };

        return (order[a.meal_type] ?? 4) - (order[b.meal_type] ?? 4);
      });
  }

  function getDayTotals(day: number) {
    const dayMeals = getMealsForDay(day);

    return {
      carbs: dayMeals.reduce((sum, m) => sum + (m.carbs || 0), 0),
      calories: dayMeals.reduce((sum, m) => sum + (m.calories || 0), 0),
      protein: dayMeals.reduce((sum, m) => sum + (m.protein || 0), 0),
    };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner label="Loading diet plan..." size="lg" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 py-20">
        <p className="text-lg text-danger">{error || "Plan not found"}</p>
        <Button variant="flat" onPress={() => router.push("/diet")}>
          Back to Diet Plans
        </Button>
      </div>
    );
  }

  const currentDayMeals = getMealsForDay(activeDay);
  const currentDayTotals = getDayTotals(activeDay);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      {/* Top bar: back + status actions */}
      <div className="flex items-center justify-between">
        <Button
          className="w-fit text-default-500"
          size="sm"
          variant="light"
          onPress={() => router.push("/diet")}
        >
          &larr; Back
        </Button>

        <div className="flex items-center gap-2">
          {plan.status !== "active" && (
            <Button
              className="text-success-600 bg-success-50 border-success-200 border"
              isLoading={statusUpdating}
              size="sm"
              variant="flat"
              onPress={() => handleStatusChange("active")}
            >
              Activate
            </Button>
          )}
          {plan.status !== "paused" && plan.status !== "completed" && (
            <Button
              className="text-default-600 bg-default-100 border-default-200 border"
              isLoading={statusUpdating}
              size="sm"
              variant="flat"
              onPress={() => handleStatusChange("paused")}
            >
              Pause
            </Button>
          )}
          {plan.status !== "completed" && (
            <Button
              className="text-primary-600 bg-primary-50 border-primary-200 border"
              isLoading={statusUpdating}
              size="sm"
              variant="flat"
              onPress={() => handleStatusChange("completed")}
            >
              Complete
            </Button>
          )}
        </div>
      </div>

      {/* Plan header — lightweight, no card wrapper */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-foreground">{plan.name}</h1>
          <Chip color={STATUS_COLORS[plan.status]} size="sm" variant="dot">
            {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
          </Chip>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-default-400">
          {(plan.start_date || plan.end_date) && (
            <span>
              {plan.start_date
                ? new Date(plan.start_date).toLocaleDateString()
                : "--"}{" "}
              &ndash;{" "}
              {plan.end_date
                ? new Date(plan.end_date).toLocaleDateString()
                : "--"}
            </span>
          )}
          {plan.target_daily_carbs != null && (
            <span>
              <span className="text-foreground font-medium">
                {plan.target_daily_carbs}g
              </span>{" "}
              carbs/day
            </span>
          )}
          {plan.target_daily_calories != null && (
            <span>
              <span className="text-foreground font-medium">
                {plan.target_daily_calories}
              </span>{" "}
              kcal/day
            </span>
          )}
        </div>

        {plan.dietary_restrictions && plan.dietary_restrictions.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {plan.dietary_restrictions.map((r) => (
              <Chip key={r} color="secondary" size="sm" variant="flat">
                {r}
              </Chip>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-divider" />

      {/* Day tabs + totals row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Day tabs */}
        <div className="flex flex-wrap gap-1.5">
          {DAY_NAMES.map((dayName, idx) => {
            const isActive = activeDay === idx;

            return (
              <motion.button
                key={idx}
                className={`relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-primary-foreground"
                    : "text-default-500 hover:bg-default-100 hover:text-default-700"
                }`}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveDay(idx)}
              >
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-primary"
                    layoutId="activeDayTab"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 28,
                    }}
                  />
                )}
                <span className="relative z-10">{dayName.slice(0, 3)}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Day totals — inline, no card */}
        <div className="flex items-center gap-6">
          <div className="flex items-baseline gap-1">
            <AnimatedCounter
              className="text-lg font-semibold text-warning-600"
              suffix="g"
              value={currentDayTotals.carbs}
            />
            <span className="text-xs text-default-400">carbs</span>
          </div>
          <div className="flex items-baseline gap-1">
            <AnimatedCounter
              className="text-lg font-semibold text-primary-600"
              value={currentDayTotals.calories}
            />
            <span className="text-xs text-default-400">kcal</span>
          </div>
          <div className="flex items-baseline gap-1">
            <AnimatedCounter
              className="text-lg font-semibold text-success-600"
              suffix="g"
              value={currentDayTotals.protein}
            />
            <span className="text-xs text-default-400">protein</span>
          </div>
        </div>
      </div>

      {/* Meals for the selected day */}
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-foreground">
          <RotatingText
            currentIndex={activeDay}
            mainClassName="text-base font-semibold text-foreground"
            splitBy="characters"
            staggerFrom="first"
            texts={DAY_NAMES.map((d) => `${d} Meals`)}
          />
        </h2>

        {currentDayMeals.length > 0 ? (
          currentDayMeals.map((meal) => (
            <MealPlanRow key={meal.id} carbRatio={null} meal={meal} />
          ))
        ) : (
          <p className="py-8 text-center text-sm text-default-400">
            No meals for this day.
          </p>
        )}
      </div>
    </div>
  );
}

/* ---- Odometer: each digit slides independently ---- */

const digitVariants = {
  enter: (d: number) => ({ y: d * 18, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (d: number) => ({ y: d * -18, opacity: 0 }),
};

function AnimatedCounter({
  value,
  suffix,
  className,
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  const digits = String(value).split("");
  const prevDigits = useRef(digits);

  useEffect(() => {
    prevDigits.current = digits;
  });

  return (
    <span
      className={`inline-flex items-baseline leading-none ${className ?? ""}`}
    >
      {digits.map((digit, i) => {
        const prevDigit = prevDigits.current[i];
        const dir =
          prevDigit === undefined || digit === prevDigit
            ? 1
            : Number(digit) > Number(prevDigit)
              ? 1
              : -1;

        return (
          <span
            key={i}
            className="relative inline-block overflow-hidden text-center"
            style={{ width: "0.55em", height: "1em" }}
          >
            <AnimatePresence custom={dir} initial={false} mode="popLayout">
              <motion.span
                key={digit}
                animate="center"
                className="absolute inset-0"
                custom={dir}
                exit="exit"
                initial="enter"
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                }}
                variants={digitVariants}
              >
                {digit}
              </motion.span>
            </AnimatePresence>
          </span>
        );
      })}
      {suffix}
    </span>
  );
}
