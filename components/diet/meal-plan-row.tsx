"use client";

import type { DietPlanMeal } from "@/types/database";

import { useEffect, useRef, useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";

const MEAL_TYPE_COLORS: Record<
  string,
  "primary" | "secondary" | "success" | "warning"
> = {
  breakfast: "warning",
  lunch: "primary",
  dinner: "secondary",
  snack: "success",
};

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: "Morning",
  lunch: "Afternoon",
  dinner: "Evening",
  snack: "Snack",
};

const BAR_COLORS: Record<string, { track: string; fill: string }> = {
  warning: { track: "bg-warning/10", fill: "bg-warning" },
  primary: { track: "bg-primary/10", fill: "bg-primary" },
  success: { track: "bg-success/10", fill: "bg-success" },
  secondary: { track: "bg-secondary/10", fill: "bg-secondary" },
};

interface MealPlanRowProps {
  meal: DietPlanMeal;
  carbRatio: number | null;
}

export default function MealPlanRow({ meal, carbRatio }: MealPlanRowProps) {
  const mealColor = MEAL_TYPE_COLORS[meal.meal_type] || "primary";
  const insulinDose =
    carbRatio && meal.carbs
      ? Math.round((meal.carbs / carbRatio) * 10) / 10
      : meal.recommended_insulin;

  const maxCarbs = 100;
  const maxCalories = 800;
  const maxProtein = 60;
  const maxFat = 40;

  return (
    <Card className="w-full shadow-none border border-default-200">
      <CardBody className="gap-3.5 p-5">
        {/* Header: meal type, name, insulin */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Chip
              className="shrink-0"
              color={mealColor}
              size="sm"
              variant="flat"
            >
              {MEAL_TYPE_LABELS[meal.meal_type] || meal.meal_type}
            </Chip>
            <span className="text-sm font-semibold text-foreground">
              {meal.meal_name}
            </span>
          </div>
          {insulinDose != null && insulinDose > 0 && (
            <span className="shrink-0 rounded-md bg-danger-50 px-2 py-0.5 text-xs font-medium text-danger-600">
              {insulinDose}u
            </span>
          )}
        </div>

        {/* Description */}
        {meal.description && (
          <p className="text-sm text-default-500">{meal.description}</p>
        )}

        {/* Portions */}
        {meal.portion_notes && (
          <div className="rounded-lg bg-default-50 px-3 py-2.5">
            <p className="text-xs font-medium text-default-500 mb-0.5">
              Portions
            </p>
            <p className="text-sm text-default-700">{meal.portion_notes}</p>
          </div>
        )}

        {/* Ingredients */}
        {meal.ingredients && meal.ingredients.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {meal.ingredients.map((ingredient, idx) => (
              <span
                key={idx}
                className="rounded-md bg-default-100 px-2 py-1 text-xs text-default-600"
              >
                {ingredient}
              </span>
            ))}
          </div>
        )}

        {/* Nutrition bars — 2 columns, readable */}
        <div className="grid grid-cols-2 gap-x-5 gap-y-2.5">
          {meal.carbs != null && (
            <AnimatedProgress
              color="warning"
              label="Carbs"
              max={maxCarbs}
              suffix="g"
              value={meal.carbs}
            />
          )}
          {meal.calories != null && (
            <AnimatedProgress
              color="primary"
              label="Calories"
              max={maxCalories}
              suffix=" kcal"
              value={meal.calories}
            />
          )}
          {meal.protein != null && (
            <AnimatedProgress
              color="success"
              label="Protein"
              max={maxProtein}
              suffix="g"
              value={meal.protein}
            />
          )}
          {meal.fat != null && (
            <AnimatedProgress
              color="secondary"
              label="Fat"
              max={maxFat}
              suffix="g"
              value={meal.fat}
            />
          )}
        </div>
      </CardBody>
    </Card>
  );
}

/* ---- Animated progress bar ---- */

function AnimatedProgress({
  value,
  max,
  label,
  suffix,
  color,
}: {
  value: number;
  max: number;
  label: string;
  suffix: string;
  color: string;
}) {
  const percent = Math.min((value / max) * 100, 100);
  const [displayValue, setDisplayValue] = useState(0);
  const [displayPercent, setDisplayPercent] = useState(0);
  const prevValue = useRef(0);
  const prevPercent = useRef(0);

  useEffect(() => {
    const from = prevValue.current;
    const fromPct = prevPercent.current;
    const duration = 400;
    const startTime = performance.now();
    const diffVal = value - from;
    const diffPct = percent - fromPct;
    let rafId: number;

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplayValue(Math.round(from + diffVal * eased));
      setDisplayPercent(fromPct + diffPct * eased);

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        prevValue.current = value;
        prevPercent.current = percent;
      }
    }

    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, [value, percent]);

  const colors = BAR_COLORS[color] || BAR_COLORS.primary;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-default-500">{label}</span>
        <span className="text-xs font-medium text-default-700">
          {displayValue}
          {suffix}
        </span>
      </div>
      <div
        className={`h-1.5 w-full overflow-hidden rounded-full ${colors.track}`}
      >
        <div
          className={`h-full rounded-full ${colors.fill}`}
          style={{ width: `${displayPercent}%`, transition: "none" }}
        />
      </div>
    </div>
  );
}
