"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Input, Textarea } from "@heroui/input";
import { RadioGroup, Radio } from "@heroui/radio";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { HugeiconsIcon } from "@hugeicons/react";
import { MinusSignIcon, PlusSignIcon } from "@hugeicons/core-free-icons";

import { saveBloodSugar } from "@/lib/actions/log";
import { getDefaultDateTime } from "@/lib/utils/date";

const contextOptions = [
  {
    key: "fasting",
    label: "Fasting",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  {
    key: "before_meal",
    label: "Before Meal",
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  {
    key: "after_meal",
    label: "After Meal",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  {
    key: "bedtime",
    label: "Bedtime",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
  {
    key: "other",
    label: "Other",
    color: "bg-default-500/20 text-default-400 border-default-500/30",
  },
];

function getValueColor(
  val: string,
  unit: string,
): { color: string; label: string } | null {
  const num = parseFloat(val);

  if (!val || isNaN(num) || num <= 0) return null;

  if (unit === "mg/dL") {
    if (num < 54) return { color: "text-red-500", label: "Low" };
    if (num < 70) return { color: "text-amber-500", label: "Slightly Low" };
    if (num <= 180) return { color: "text-emerald-500", label: "In Range" };
    if (num <= 250) return { color: "text-amber-500", label: "High" };

    return { color: "text-red-500", label: "Very High" };
  } else {
    if (num < 3.0) return { color: "text-red-500", label: "Low" };
    if (num < 3.9) return { color: "text-amber-500", label: "Slightly Low" };
    if (num <= 10.0) return { color: "text-emerald-500", label: "In Range" };
    if (num <= 13.9) return { color: "text-amber-500", label: "High" };

    return { color: "text-red-500", label: "Very High" };
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
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

type BloodSugarFormProps = {
  compact?: boolean;
};

export default function BloodSugarForm({
  compact = false,
}: BloodSugarFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [unit, setUnit] = useState("mg/dL");
  const [value, setValue] = useState("");
  const [context, setContext] = useState("");
  const [dateTime, setDateTime] = useState(getDefaultDateTime());
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [valueError, setValueError] = useState("");
  const [showXp, setShowXp] = useState(false);

  const valueColor = getValueColor(value, unit);

  // Clear XP animation
  useEffect(() => {
    if (showXp) {
      const timer = setTimeout(() => setShowXp(false), 2000);

      return () => clearTimeout(timer);
    }
  }, [showXp]);

  function validateValue(val: string): boolean {
    const num = parseFloat(val);

    if (!val || isNaN(num) || num <= 0) {
      setValueError("Please enter a positive number.");

      return false;
    }

    if (unit === "mg/dL" && (num < 20 || num > 600)) {
      setValueError("Value seems unusual for mg/dL (expected 20-600).");

      return false;
    }

    if (unit === "mmol/L" && (num < 1 || num > 33)) {
      setValueError("Value seems unusual for mmol/L (expected 1-33).");

      return false;
    }

    setValueError("");

    return true;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!validateValue(value)) return;

    setIsLoading(true);
    setMessage(null);

    const formData = new FormData();

    formData.set("value", value);
    formData.set("unit", unit);
    formData.set("context", context);
    formData.set(
      "reading_time",
      dateTime ? new Date(dateTime).toISOString() : new Date().toISOString(),
    );
    formData.set("notes", notes);

    const result = await saveBloodSugar(formData);

    setIsLoading(false);

    if (result.success) {
      setMessage({
        type: "success",
        text: "Blood sugar reading saved! Great job keeping track!",
      });
      setShowXp(true);
      confetti({
        particleCount: 60,
        spread: 50,
        origin: { y: 0.7 },
        colors: ["#f43f5e", "#ec4899", "#a855f7"],
      });
      setValue("");
      setNotes("");
      setContext("");
      setDateTime(getDefaultDateTime());
    } else {
      setMessage({
        type: "error",
        text: result.error || "Something went wrong.",
      });
    }
  }

  const formContent = (
    <motion.form
      animate="show"
      className="space-y-5"
      initial="hidden"
      variants={containerVariants}
      onSubmit={handleSubmit}
    >
      {/* Blood Sugar Value - Prominent */}
      <motion.div variants={itemVariants}>
        <span className="mb-2 block text-sm font-medium text-foreground">
          Blood Sugar Value <span className="text-danger">*</span>
        </span>
        <div className="flex items-center gap-3">
          <button
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-default-200 text-default-600 transition-colors hover:bg-default-100 hover:text-foreground"
            type="button"
            onClick={() => {
              const num = parseFloat(value) || 0;
              const step = unit === "mg/dL" ? 5 : 0.5;
              const next = Math.max(0, num - step);

              setValue(String(Math.round(next * 10) / 10));
            }}
          >
            <HugeiconsIcon
              color="currentColor"
              icon={MinusSignIcon}
              size={20}
              strokeWidth={2}
            />
          </button>

          <div
            className={`relative flex-1 rounded-2xl border-2 transition-colors ${
              valueError ? "border-danger" : "border-default-200"
            }`}
          >
            <input
              className="w-full bg-transparent px-4 py-4 text-center text-3xl font-bold text-foreground outline-none placeholder:text-default-300"
              inputMode="decimal"
              min="0"
              placeholder={unit === "mg/dL" ? "120" : "6.7"}
              step="any"
              type="number"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (valueError) validateValue(e.target.value);
              }}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-default-400">
              {unit}
            </span>
          </div>

          <button
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-default-200 text-default-600 transition-colors hover:bg-default-100 hover:text-foreground"
            type="button"
            onClick={() => {
              const num = parseFloat(value) || 0;
              const step = unit === "mg/dL" ? 5 : 0.5;

              setValue(String(Math.round((num + step) * 10) / 10));
            }}
          >
            <HugeiconsIcon
              color="currentColor"
              icon={PlusSignIcon}
              size={20}
              strokeWidth={2}
            />
          </button>
        </div>

        {/* Value color indicator */}
        <div className="mt-2 flex items-center justify-between">
          <div>
            {valueError && <p className="text-xs text-danger">{valueError}</p>}
            {!valueError && (
              <p className="text-xs text-default-400">
                Enter your reading in {unit}
              </p>
            )}
          </div>
          <AnimatePresence>
            {valueColor && (
              <motion.span
                animate={{ opacity: 1, scale: 1 }}
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${valueColor.color}`}
                exit={{ opacity: 0, scale: 0.8 }}
                initial={{ opacity: 0, scale: 0.8 }}
              >
                {valueColor.label}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Unit Selector */}
      <motion.div variants={itemVariants}>
        <RadioGroup
          label="Unit"
          orientation="horizontal"
          value={unit}
          onValueChange={setUnit}
        >
          <Radio value="mg/dL">mg/dL</Radio>
          <Radio value="mmol/L">mmol/L</Radio>
        </RadioGroup>
      </motion.div>

      {/* Context - Colored Pills */}
      <motion.div variants={itemVariants}>
        <span className="mb-2 block text-sm font-medium text-foreground">
          When was this reading?
        </span>
        <div className="flex flex-wrap gap-2">
          {contextOptions.map((option) => (
            <button
              key={option.key}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                context === option.key
                  ? `${option.color} border-current shadow-sm`
                  : "border-default-200 text-default-500 hover:border-default-400 hover:text-foreground"
              }`}
              type="button"
              onClick={() =>
                setContext(option.key === context ? "" : option.key)
              }
            >
              {option.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Date/Time */}
      <motion.div variants={itemVariants}>
        <Input
          label="Date & Time"
          labelPlacement="outside"
          type="datetime-local"
          value={dateTime}
          variant="bordered"
          onValueChange={setDateTime}
        />
      </motion.div>

      {/* Notes */}
      <motion.div variants={itemVariants}>
        <Textarea
          label="Notes"
          labelPlacement="outside"
          maxRows={4}
          minRows={2}
          placeholder="How are you feeling? Any extra details..."
          value={notes}
          variant="bordered"
          onValueChange={setNotes}
        />
      </motion.div>

      {/* Status message */}
      <AnimatePresence>
        {message && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-lg p-3 text-sm ${
              message.type === "success"
                ? "bg-success-50 text-success-700 border border-success-200"
                : "bg-danger-50 text-danger-700 border border-danger-200"
            }`}
            exit={{ opacity: 0, y: -10 }}
            initial={{ opacity: 0, y: 10 }}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buttons */}
      <motion.div className="flex gap-3 pt-2" variants={itemVariants}>
        <motion.div
          className="flex-1"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            className="w-full bg-gradient-to-r from-rose-500 to-pink-500 font-semibold text-white shadow-lg shadow-rose-500/25 transition-shadow hover:shadow-rose-500/40"
            isLoading={isLoading}
            size="lg"
            type="submit"
          >
            {isLoading ? "Saving..." : "Save Reading"}
          </Button>
        </motion.div>
        {!compact && (
          <Button size="lg" variant="flat" onPress={() => router.push("/")}>
            Cancel
          </Button>
        )}
      </motion.div>
    </motion.form>
  );

  return (
    <div className="relative">
      {/* XP float-up animation */}
      <AnimatePresence>
        {showXp && (
          <motion.div
            animate={{ opacity: 0, y: -60 }}
            className="pointer-events-none absolute inset-x-0 top-0 z-50 flex justify-center"
            exit={{ opacity: 0 }}
            initial={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            <span className="rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-2 text-lg font-bold text-white shadow-lg">
              Saved! +5 XP
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {compact ? (
        formContent
      ) : (
        <Card className="mx-auto max-w-lg border border-default-200">
          <CardBody className="p-6">{formContent}</CardBody>
        </Card>
      )}
    </div>
  );
}
