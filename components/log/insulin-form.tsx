"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Input, Textarea } from "@heroui/input";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PenTool01Icon,
  InjectionIcon,
  MinusSignIcon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";

import { saveInsulin } from "@/lib/actions/log";
import { getDefaultDateTime } from "@/lib/utils/date";

const insulinTypes = [
  {
    key: "rapid",
    label: "Rapid-Acting",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  {
    key: "short",
    label: "Short-Acting",
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  },
  {
    key: "intermediate",
    label: "Intermediate",
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  {
    key: "long",
    label: "Long-Acting",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  {
    key: "mixed",
    label: "Mixed",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
];

const commonBrands = [
  "NovoRapid",
  "Humalog",
  "Apidra",
  "Lantus",
  "Levemir",
  "Tresiba",
  "Humulin",
  "Novolin",
  "Toujeo",
];

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

type InsulinFormProps = {
  compact?: boolean;
};

export default function InsulinForm({ compact = false }: InsulinFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [units, setUnits] = useState("");
  const [insulinType, setInsulinType] = useState("");
  const [brand, setBrand] = useState("");
  const [method, setMethod] = useState("pen");
  const [dateTime, setDateTime] = useState(getDefaultDateTime());
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [unitsError, setUnitsError] = useState("");
  const [showXp, setShowXp] = useState(false);

  useEffect(() => {
    if (showXp) {
      const timer = setTimeout(() => setShowXp(false), 2000);

      return () => clearTimeout(timer);
    }
  }, [showXp]);

  function validateUnits(val: string): boolean {
    const num = parseFloat(val);

    if (!val || isNaN(num) || num <= 0) {
      setUnitsError("Please enter a positive number of units.");

      return false;
    }

    if (num > 100) {
      setUnitsError("That seems like a lot. Please double-check.");

      return false;
    }

    setUnitsError("");

    return true;
  }

  function stepUnits(delta: number) {
    const current = parseFloat(units) || 0;
    const next = Math.max(0, current + delta);

    setUnits(String(next));
    if (unitsError) validateUnits(String(next));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!validateUnits(units)) return;

    if (!insulinType) {
      setMessage({ type: "error", text: "Please select an insulin type." });

      return;
    }

    setIsLoading(true);
    setMessage(null);

    const formData = new FormData();

    formData.set("units", units);
    formData.set("insulin_type", insulinType);
    formData.set("insulin_brand", brand);
    formData.set("method", method);
    formData.set(
      "injection_time",
      dateTime ? new Date(dateTime).toISOString() : new Date().toISOString(),
    );
    formData.set("notes", notes);

    const result = await saveInsulin(formData);

    setIsLoading(false);

    if (result.success) {
      setMessage({
        type: "success",
        text: "Insulin log saved! Nice work staying on track!",
      });
      setShowXp(true);
      confetti({
        particleCount: 60,
        spread: 50,
        origin: { y: 0.7 },
        colors: ["#3b82f6", "#6366f1", "#818cf8"],
      });
      setUnits("");
      setInsulinType("");
      setBrand("");
      setNotes("");
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
      {/* Units - Large with stepper */}
      <motion.div variants={itemVariants}>
        <span className="mb-2 block text-sm font-medium text-foreground">
          Insulin Units <span className="text-danger">*</span>
        </span>
        <div className="flex items-center gap-3">
          <motion.button
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-default-200 bg-default-50 text-default-600 transition-colors hover:bg-default-100 hover:text-foreground"
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => stepUnits(-0.5)}
          >
            <HugeiconsIcon
              color="currentColor"
              icon={MinusSignIcon}
              size={20}
              strokeWidth={2}
            />
          </motion.button>

          <div
            className={`relative flex-1 rounded-2xl border-2 transition-colors ${unitsError ? "border-danger" : "border-default-200"}`}
          >
            <input
              className="w-full bg-transparent px-4 py-4 text-center text-3xl font-bold text-foreground outline-none placeholder:text-default-300"
              inputMode="decimal"
              min="0"
              placeholder="0"
              step="0.5"
              type="number"
              value={units}
              onChange={(e) => {
                setUnits(e.target.value);
                if (unitsError) validateUnits(e.target.value);
              }}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-default-400">
              units
            </span>
          </div>

          <motion.button
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-default-200 bg-default-50 text-default-600 transition-colors hover:bg-default-100 hover:text-foreground"
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => stepUnits(0.5)}
          >
            <HugeiconsIcon
              color="currentColor"
              icon={PlusSignIcon}
              size={20}
              strokeWidth={2}
            />
          </motion.button>
        </div>
        {unitsError && <p className="mt-1 text-xs text-danger">{unitsError}</p>}
        {!unitsError && (
          <p className="mt-1 text-xs text-default-400">
            How many units did you take?
          </p>
        )}
      </motion.div>

      {/* Insulin Type - Colored Pills */}
      <motion.div variants={itemVariants}>
        <span className="mb-2 block text-sm font-medium text-foreground">
          Insulin Type <span className="text-danger">*</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {insulinTypes.map((type) => (
            <button
              key={type.key}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                insulinType === type.key
                  ? `${type.color} border-current shadow-sm`
                  : "border-default-200 text-default-500 hover:border-default-400 hover:text-foreground"
              }`}
              type="button"
              onClick={() =>
                setInsulinType(type.key === insulinType ? "" : type.key)
              }
            >
              {type.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Method - Visual Toggle */}
      <motion.div variants={itemVariants}>
        <span className="mb-2 block text-sm font-medium text-foreground">
          Injection Method
        </span>
        <div className="flex gap-3">
          <motion.button
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all duration-200 ${
              method === "pen"
                ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                : "border-default-200 text-default-500 hover:border-default-400"
            }`}
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMethod("pen")}
          >
            <HugeiconsIcon
              color="currentColor"
              icon={PenTool01Icon}
              size={20}
              strokeWidth={1.5}
            />
            Pen
          </motion.button>
          <motion.button
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all duration-200 ${
              method === "syringe"
                ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                : "border-default-200 text-default-500 hover:border-default-400"
            }`}
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMethod("syringe")}
          >
            <HugeiconsIcon
              color="currentColor"
              icon={InjectionIcon}
              size={20}
              strokeWidth={1.5}
            />
            Syringe
          </motion.button>
        </div>
      </motion.div>

      {/* Brand */}
      <motion.div variants={itemVariants}>
        <Input
          label="Brand (optional)"
          labelPlacement="outside"
          placeholder="e.g. NovoRapid, Lantus, Humalog"
          value={brand}
          variant="bordered"
          onValueChange={setBrand}
        />
        {/* Quick-select brand chips */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {commonBrands.map((b) => (
            <button
              key={b}
              className={`rounded-full border px-3 py-1 text-xs transition-all duration-150 ${
                brand === b
                  ? "border-primary/50 bg-primary/10 text-primary font-medium"
                  : "border-default-200 text-default-400 hover:border-default-400 hover:text-default-600"
              }`}
              type="button"
              onClick={() => setBrand(brand === b ? "" : b)}
            >
              {b}
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
          placeholder="Anything else to note? Injection site, how you felt..."
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
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 font-semibold text-white shadow-lg shadow-blue-500/25 transition-shadow hover:shadow-blue-500/40"
            isLoading={isLoading}
            size="lg"
            type="submit"
          >
            {isLoading ? "Saving..." : "Save Insulin Log"}
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
            <span className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2 text-lg font-bold text-white shadow-lg">
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
