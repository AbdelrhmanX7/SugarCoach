"use client";

import type { DietPlan, DietPlanMeal } from "@/types/database";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Checkbox } from "@heroui/checkbox";
import { Chip } from "@heroui/chip";
import { motion, AnimatePresence } from "framer-motion";

import FoodPreferences from "@/components/diet/food-preferences";
import MealPlanRow from "@/components/diet/meal-plan-row";
import { updateDietPlanStatus } from "@/lib/actions/diet";
import { DAY_NAMES } from "@/lib/constants";

const DIETARY_RESTRICTIONS = [
  "Vegetarian",
  "Vegan",
  "Halal",
  "Kosher",
  "Gluten-free",
  "Dairy-free",
  "Nut-free",
];

const STEP_LABELS = ["Goals", "Preferences", "Generating", "Review"];

const GENERATING_MESSAGES = [
  "Crafting your perfect plan...",
  "Analyzing nutrition balance...",
  "Selecting the best meals...",
  "Optimizing for your goals...",
  "Almost there!",
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

export default function CreateDietPlanPage() {
  const router = useRouter();

  // Wizard state
  const [step, setStep] = useState(0);

  // Step 1: Goals
  const [targetCarbs, setTargetCarbs] = useState("");
  const [targetCalories, setTargetCalories] = useState("");

  // Step 2: Preferences
  const [excludedFoods, setExcludedFoods] = useState<string[]>([]);
  const [includedFoods, setIncludedFoods] = useState<string[]>([]);
  const [restrictions, setRestrictions] = useState<string[]>([]);

  // Step 3/4: Generated plan
  const [generatedPlan, setGeneratedPlan] = useState<DietPlan | null>(null);
  const [generatedMeals, setGeneratedMeals] = useState<DietPlanMeal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [reviewDay, setReviewDay] = useState(0);

  // Generating message cycle
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (step !== 2) return;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % GENERATING_MESSAGES.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [step]);

  function toggleRestriction(restriction: string) {
    setRestrictions((prev) =>
      prev.includes(restriction)
        ? prev.filter((r) => r !== restriction)
        : [...prev, restriction],
    );
  }

  async function generatePlan() {
    setStep(2);
    setError(null);
    setMessageIndex(0);

    try {
      const response = await fetch("/api/diet-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetDailyCarbs: targetCarbs ? parseInt(targetCarbs) : undefined,
          targetDailyCalories: targetCalories
            ? parseInt(targetCalories)
            : undefined,
          excludedFoods: excludedFoods.length > 0 ? excludedFoods : undefined,
          includedFoods: includedFoods.length > 0 ? includedFoods : undefined,
          dietaryRestrictions:
            restrictions.length > 0 ? restrictions : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();

        throw new Error(data.error || "Failed to generate diet plan");
      }

      const data = await response.json();

      setGeneratedPlan(data.plan);
      setGeneratedMeals(data.meals);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep(1); // Go back to preferences step
    }
  }

  async function confirmPlan() {
    if (!generatedPlan) return;

    setSaving(true);

    try {
      const result = await updateDietPlanStatus(generatedPlan.id, "active");

      if (result.error) {
        setError(result.error);
        setSaving(false);

        return;
      }

      router.push(`/diet/${generatedPlan.id}`);
    } catch {
      setError("Failed to activate plan. Please try again.");
      setSaving(false);
    }
  }

  function getMealsForDay(day: number): DietPlanMeal[] {
    return generatedMeals
      .filter((m) => m.day_of_week === day)
      .sort((a, b) => {
        const order = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };

        return (order[a.meal_type] ?? 4) - (order[b.meal_type] ?? 4);
      });
  }

  function getDayTotals(day: number) {
    const meals = getMealsForDay(day);

    return {
      carbs: meals.reduce((sum, m) => sum + (m.carbs || 0), 0),
      calories: meals.reduce((sum, m) => sum + (m.calories || 0), 0),
      protein: meals.reduce((sum, m) => sum + (m.protein || 0), 0),
    };
  }

  const progressValue = ((step + 1) / STEP_LABELS.length) * 100;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {/* Header */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: -20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Create Diet Plan</h1>
        <p className="mt-1 text-sm text-default-500">
          Step {step + 1} of {STEP_LABELS.length}: {STEP_LABELS[step]}
        </p>
      </motion.div>

      {/* Animated progress bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-default-100">
        <motion.div
          animate={{ width: `${progressValue}%` }}
          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-primary to-primary-400"
          initial={{ width: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        />
        {/* Step markers */}
        <div className="absolute inset-0 flex items-center justify-between px-0">
          {STEP_LABELS.map((_, idx) => (
            <motion.div
              key={idx}
              animate={idx === step ? { scale: [1, 1.3, 1] } : {}}
              className={`h-3 w-3 rounded-full border-2 border-default-100 ${
                idx <= step ? "bg-primary" : "bg-default-300"
              }`}
              transition={{ duration: 1, repeat: Infinity }}
            />
          ))}
        </div>
      </div>

      {/* Step labels under progress */}
      <div className="flex justify-between text-xs text-default-400">
        {STEP_LABELS.map((label, idx) => (
          <span
            key={idx}
            className={idx <= step ? "font-medium text-primary" : ""}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Error display */}
      <AnimatePresence>
        {error && (
          <motion.div
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            initial={{ opacity: 0, height: 0 }}
          >
            <Card className="border border-danger-200 bg-danger-50">
              <CardBody>
                <p className="text-sm text-danger">{error}</p>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step content with AnimatePresence */}
      <AnimatePresence mode="wait">
        {/* Step 1: Goals */}
        {step === 0 && (
          <motion.div
            key="step-goals"
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            initial={{ opacity: 0, x: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <Card>
              <CardHeader className="flex-col items-start gap-1 px-6 pt-6">
                <h2 className="text-xl font-semibold">Set Your Daily Goals</h2>
                <p className="text-sm text-default-500">
                  These targets help us create the right balance for your meals.
                </p>
              </CardHeader>
              <CardBody className="gap-6 px-6 pb-6">
                <motion.div
                  animate="show"
                  className="flex flex-col gap-6"
                  initial="hidden"
                  variants={containerVariants}
                >
                  <motion.div variants={itemVariants}>
                    <Input
                      description="Recommended: 130-200g for most people with diabetes"
                      label="Target Daily Carbs (grams)"
                      min={0}
                      placeholder="e.g. 150"
                      type="number"
                      value={targetCarbs}
                      onValueChange={setTargetCarbs}
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <Input
                      description="Leave empty for an auto-calculated amount"
                      label="Target Daily Calories (kcal)"
                      min={0}
                      placeholder="e.g. 2000"
                      type="number"
                      value={targetCalories}
                      onValueChange={setTargetCalories}
                    />
                  </motion.div>
                </motion.div>

                <motion.div
                  animate={{ opacity: 1 }}
                  className="flex justify-end gap-3"
                  initial={{ opacity: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button variant="flat" onPress={() => router.push("/diet")}>
                    Cancel
                  </Button>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button color="primary" onPress={() => setStep(1)}>
                      Next
                    </Button>
                  </motion.div>
                </motion.div>
              </CardBody>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Preferences */}
        {step === 1 && (
          <motion.div
            key="step-preferences"
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            initial={{ opacity: 0, x: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <Card>
              <CardHeader className="flex-col items-start gap-1 px-6 pt-6">
                <h2 className="text-xl font-semibold">Food Preferences</h2>
                <p className="text-sm text-default-500">
                  Tell us what you like and what to avoid.
                </p>
              </CardHeader>
              <CardBody className="gap-6 px-6 pb-6">
                <motion.div
                  animate="show"
                  className="flex flex-col gap-6"
                  initial="hidden"
                  variants={containerVariants}
                >
                  <motion.div variants={itemVariants}>
                    <FoodPreferences
                      label="Foods to Exclude"
                      placeholder="e.g. Shrimp, Peanuts..."
                      value={excludedFoods}
                      onChange={setExcludedFoods}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <FoodPreferences
                      label="Preferred Foods"
                      placeholder="e.g. Salmon, Broccoli..."
                      value={includedFoods}
                      onChange={setIncludedFoods}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <div>
                      <p className="mb-3 text-sm font-medium text-foreground">
                        Dietary Restrictions
                      </p>
                      <motion.div
                        animate="show"
                        className="flex flex-wrap gap-3"
                        initial="hidden"
                        variants={containerVariants}
                      >
                        {DIETARY_RESTRICTIONS.map((restriction) => (
                          <motion.div
                            key={restriction}
                            variants={itemVariants}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Checkbox
                              isSelected={restrictions.includes(restriction)}
                              size="sm"
                              onValueChange={() =>
                                toggleRestriction(restriction)
                              }
                            >
                              {restriction}
                            </Checkbox>
                          </motion.div>
                        ))}
                      </motion.div>
                    </div>
                  </motion.div>
                </motion.div>

                <motion.div
                  animate={{ opacity: 1 }}
                  className="flex justify-between gap-3"
                  initial={{ opacity: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button variant="flat" onPress={() => setStep(0)}>
                      Back
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button color="primary" onPress={generatePlan}>
                      Generate Plan
                    </Button>
                  </motion.div>
                </motion.div>
              </CardBody>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Generating */}
        {step === 2 && (
          <motion.div
            key="step-generating"
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            initial={{ opacity: 0, x: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <Card>
              <CardBody className="flex flex-col items-center gap-8 py-20">
                {/* Animated dots */}
                <div className="flex items-center gap-3">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{
                        scale: [1, 1.4, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      className="h-4 w-4 rounded-full bg-primary"
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>

                {/* Pulsing ring */}
                <div className="relative flex items-center justify-center">
                  <motion.div
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    className="absolute h-20 w-20 rounded-full border-2 border-primary/30"
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                  <motion.div
                    animate={{
                      scale: [1, 1.8, 1],
                      opacity: [0.3, 0, 0.3],
                    }}
                    className="absolute h-20 w-20 rounded-full border-2 border-primary/20"
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeOut",
                      delay: 0.5,
                    }}
                  />
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">
                    🧑‍🍳
                  </div>
                </div>

                {/* Cycling messages */}
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-foreground">
                    Creating Your Meal Plan
                  </h2>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={messageIndex}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 text-sm text-default-500"
                      exit={{ opacity: 0, y: -10 }}
                      initial={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.3 }}
                    >
                      {GENERATING_MESSAGES[messageIndex]}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        )}

        {/* Step 4: Review */}
        {step === 3 && generatedPlan && (
          <motion.div
            key="step-review"
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-6"
            exit={{ opacity: 0, x: -50 }}
            initial={{ opacity: 0, x: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <Card>
              <CardHeader className="flex-col items-start gap-1 px-6 pt-6">
                <h2 className="text-xl font-semibold">Review Your Plan</h2>
                <p className="text-sm text-default-500">
                  {generatedPlan.name} -- review the meals below, then confirm
                  to activate.
                </p>
              </CardHeader>
              <CardBody className="px-6 pb-6">
                <motion.div
                  animate={{ opacity: 1 }}
                  className="flex flex-wrap gap-3 text-sm"
                  initial={{ opacity: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {generatedPlan.target_daily_carbs != null && (
                    <Chip color="warning" variant="flat">
                      Target: {generatedPlan.target_daily_carbs}g carbs/day
                    </Chip>
                  )}
                  {generatedPlan.target_daily_calories != null && (
                    <Chip color="primary" variant="flat">
                      Target: {generatedPlan.target_daily_calories} kcal/day
                    </Chip>
                  )}
                </motion.div>
              </CardBody>
            </Card>

            {/* Day selector with animated indicator */}
            <motion.div
              animate="show"
              className="flex flex-wrap gap-2"
              initial="hidden"
              variants={containerVariants}
            >
              {DAY_NAMES.map((dayName, idx) => {
                const totals = getDayTotals(idx);
                const isActive = reviewDay === idx;

                return (
                  <motion.button
                    key={idx}
                    animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                        : "bg-default-100 text-default-600 hover:bg-default-200"
                    }`}
                    transition={
                      isActive
                        ? { type: "spring", stiffness: 400, damping: 15 }
                        : undefined
                    }
                    variants={itemVariants}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setReviewDay(idx)}
                  >
                    {dayName}
                    {totals.carbs > 0 && (
                      <span className="ml-1 text-xs opacity-70">
                        ({totals.carbs}g)
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>

            {/* Day totals - glass effect */}
            {(() => {
              const totals = getDayTotals(reviewDay);

              return (
                <motion.div
                  key={`totals-${reviewDay}`}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap gap-6 rounded-xl border border-default-100 bg-default-50/80 p-5 backdrop-blur-md"
                  initial={{ opacity: 0, y: 10 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                  }}
                >
                  <div className="text-center">
                    <AnimatedCounter
                      className="text-2xl font-bold text-warning"
                      value={totals.carbs}
                    />
                    <p className="text-xs text-default-400">Carbs (g)</p>
                  </div>
                  <div className="text-center">
                    <AnimatedCounter
                      className="text-2xl font-bold text-primary"
                      value={totals.calories}
                    />
                    <p className="text-xs text-default-400">Calories</p>
                  </div>
                  <div className="text-center">
                    <AnimatedCounter
                      className="text-2xl font-bold text-success"
                      value={totals.protein}
                    />
                    <p className="text-xs text-default-400">Protein (g)</p>
                  </div>
                </motion.div>
              );
            })()}

            {/* Meals for the selected day */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`meals-${reviewDay}`}
                animate="show"
                className="flex flex-col gap-3"
                exit={{ opacity: 0 }}
                initial="hidden"
                variants={containerVariants}
              >
                {getMealsForDay(reviewDay).map((meal) => (
                  <motion.div key={meal.id} variants={itemVariants}>
                    <MealPlanRow carbRatio={null} meal={meal} />
                  </motion.div>
                ))}
                {getMealsForDay(reviewDay).length === 0 && (
                  <motion.p
                    animate={{ opacity: 1 }}
                    className="py-4 text-center text-sm text-default-400"
                    initial={{ opacity: 0 }}
                  >
                    No meals generated for this day.
                  </motion.p>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Actions */}
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between gap-3"
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  variant="flat"
                  onPress={() => {
                    setStep(1);
                    setGeneratedPlan(null);
                    setGeneratedMeals([]);
                  }}
                >
                  Start Over
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  color="primary"
                  isLoading={saving}
                  size="lg"
                  onPress={confirmPlan}
                >
                  Confirm & Activate Plan
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---- AnimatedCounter sub-component ---- */

function AnimatedCounter({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 600;
    const startTime = Date.now();
    const startValue = displayValue;
    const diff = value - startValue;

    function tick() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease out
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplayValue(Math.round(startValue + diff * eased));
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }, [value]);

  return <p className={className}>{displayValue}</p>;
}
