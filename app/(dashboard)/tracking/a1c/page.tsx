"use client";

import type { A1CEstimate } from "@/lib/tracking/a1c-estimator";
import type { A1CRecord } from "@/types/database";

import { useEffect, useState, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Divider } from "@heroui/divider";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  MinusSignIcon,
  SparklesIcon,
  Stethoscope02Icon,
  Analytics02Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";

import { A1CGauge } from "@/components/tracking/a1c-gauge";
import {
  saveLabA1C,
  getA1CHistory,
  getEstimatedA1C,
  getA1CTrend,
  getCurrentA1CData,
  type A1CTrend,
} from "@/lib/actions/a1c";
import { containerVariants, itemVariants, slideFromLeft } from "@/lib/motion";

const gaugeReveal = {
  hidden: { opacity: 0, scale: 0 },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 15,
      delay: 0.1,
    },
  },
};

const slideFromRight = {
  hidden: { opacity: 0, x: 40 },
  show: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 260, damping: 20 },
  },
};

const historyItemVariants = {
  hidden: { opacity: 0, x: -30 },
  show: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

const formExpandVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: "auto",
    transition: {
      height: { type: "spring" as const, stiffness: 300, damping: 30 },
      opacity: { duration: 0.2, delay: 0.1 },
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: {
      height: { type: "spring" as const, stiffness: 300, damping: 30 },
      opacity: { duration: 0.15 },
    },
  },
};

export default function A1CPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Data state
  const [currentA1C, setCurrentA1C] = useState<number | null>(null);
  const [targetA1C, setTargetA1C] = useState<number | null>(null);
  const [trend, setTrend] = useState<A1CTrend | null>(null);
  const [estimate, setEstimate] = useState<A1CEstimate | null>(null);
  const [history, setHistory] = useState<A1CRecord[]>([]);

  // Form state
  const [formValue, setFormValue] = useState("");
  const [formDate, setFormDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [formLabName, setFormLabName] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formError, setFormError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [a1cData, trendData, historyData] = await Promise.all([
        getCurrentA1CData(),
        getA1CTrend(),
        getA1CHistory(),
      ]);

      setCurrentA1C(a1cData.currentA1C);
      setTargetA1C(a1cData.targetA1C);
      setTrend(trendData);
      setHistory(historyData);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error loading A1C data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEstimate = async () => {
    setEstimating(true);
    try {
      const result = await getEstimatedA1C();

      setEstimate(result.estimate);

      if (result.estimate) {
        setCurrentA1C(result.estimate.estimatedA1C);
      }

      if (result.saved) {
        const historyData = await getA1CHistory();

        setHistory(historyData);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error estimating A1C:", err);
    } finally {
      setEstimating(false);
    }
  };

  const handleSaveLabResult = async () => {
    setFormError("");

    const value = parseFloat(formValue);

    if (isNaN(value) || value < 3 || value > 20) {
      setFormError("Please enter a valid A1C value between 3 and 20.");

      return;
    }

    if (!formDate) {
      setFormError("Please select a test date.");

      return;
    }

    setSaving(true);
    try {
      const result = await saveLabA1C({
        value,
        testDate: formDate,
        labName: formLabName || undefined,
        notes: formNotes || undefined,
      });

      if (!result.success) {
        setFormError(result.error || "Failed to save lab result.");

        return;
      }

      setFormValue("");
      setFormDate(new Date().toISOString().split("T")[0]);
      setFormLabName("");
      setFormNotes("");
      setShowForm(false);

      setCurrentA1C(value);
      await loadData();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error saving lab A1C:", err);
      setFormError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const getTrendDisplay = (
    t: A1CTrend,
  ): {
    icon: typeof ArrowDown01Icon;
    color: string;
    bgColor: string;
    message: string;
  } => {
    switch (t) {
      case "improving":
        return {
          icon: ArrowDown01Icon,
          color: "text-success",
          bgColor: "bg-success/10",
          message: "Your A1C is trending down. Keep up the great work!",
        };
      case "stable":
        return {
          icon: MinusSignIcon,
          color: "text-primary",
          bgColor: "bg-primary/10",
          message: "Your A1C is holding steady. Stay consistent!",
        };
      case "worsening":
        return {
          icon: ArrowUp01Icon,
          color: "text-danger",
          bgColor: "bg-danger/10",
          message:
            "Your A1C is trending up. Consider discussing with your healthcare team.",
        };
    }
  };

  const getConfidenceColor = (
    confidence: string,
  ): "success" | "warning" | "default" => {
    switch (confidence) {
      case "high":
        return "success";
      case "medium":
        return "warning";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner label="Loading A1C data..." size="lg" />
      </div>
    );
  }

  return (
    <motion.div
      animate="show"
      className="mx-auto max-w-4xl space-y-6 pb-20 lg:pb-6"
      initial="hidden"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div variants={slideFromLeft}>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          A1C{" "}
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Management
          </span>
        </h1>
        <p className="mt-1 text-default-500">
          Track your A1C levels and monitor your long-term glucose control
        </p>
      </motion.div>

      {/* Gauge + Trend row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* A1C Gauge */}
        <motion.div variants={gaugeReveal}>
          <motion.div
            className="group"
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            whileHover={{ y: -2 }}
          >
            <Card className="border border-divider bg-content1 transition-shadow duration-300 group-hover:shadow-lg group-hover:shadow-primary/5">
              <CardBody className="py-6">
                {currentA1C != null ? (
                  <A1CGauge currentA1C={currentA1C} targetA1C={targetA1C} />
                ) : (
                  <motion.div
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-3 py-8 text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: 0.2 }}
                  >
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <HugeiconsIcon
                        className="text-primary"
                        color="currentColor"
                        icon={Analytics02Icon}
                        size={32}
                        strokeWidth={1.5}
                      />
                    </motion.div>
                    <p className="text-default-500">
                      No A1C data yet. Add a lab result or estimate from your
                      readings.
                    </p>
                  </motion.div>
                )}
              </CardBody>
            </Card>
          </motion.div>
        </motion.div>

        {/* Trend + Estimated */}
        <div className="flex flex-col gap-6">
          {/* Trend indicator */}
          <motion.div variants={itemVariants}>
            <motion.div
              className="group"
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              whileHover={{ y: -2 }}
            >
              <Card
                className={`border border-divider bg-content1 transition-shadow duration-300 group-hover:shadow-lg ${
                  trend === "improving"
                    ? "group-hover:shadow-success/10"
                    : trend === "worsening"
                      ? "group-hover:shadow-danger/10"
                      : "group-hover:shadow-primary/10"
                }`}
              >
                <CardHeader className="pb-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    Trend
                  </h3>
                </CardHeader>
                <CardBody className="pt-0">
                  {trend ? (
                    <div className="flex items-start gap-3">
                      <motion.div
                        animate={{ scale: 1 }}
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${getTrendDisplay(trend).bgColor}`}
                        initial={{ scale: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 15,
                          delay: 0.3,
                        }}
                      >
                        <motion.div
                          animate={
                            trend === "improving"
                              ? {
                                  y: [0, 3, 0],
                                }
                              : trend === "worsening"
                                ? {
                                    y: [0, -3, 0],
                                  }
                                : {}
                          }
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        >
                          <HugeiconsIcon
                            className={getTrendDisplay(trend).color}
                            color="currentColor"
                            icon={getTrendDisplay(trend).icon}
                            size={24}
                            strokeWidth={2}
                          />
                        </motion.div>
                      </motion.div>
                      <div>
                        <p
                          className={`font-semibold capitalize ${getTrendDisplay(trend).color}`}
                        >
                          {trend}
                        </p>
                        <p className="mt-1 text-sm text-default-500">
                          {getTrendDisplay(trend).message}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-default-400">
                      Need at least 2 A1C records to show a trend.
                    </p>
                  )}
                </CardBody>
              </Card>
            </motion.div>
          </motion.div>

          {/* Estimated A1C */}
          <motion.div variants={slideFromRight}>
            <motion.div
              className="group"
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              whileHover={{ y: -2 }}
            >
              <Card className="border border-divider bg-content1 transition-shadow duration-300 group-hover:shadow-lg group-hover:shadow-secondary/5">
                <CardHeader className="flex items-center justify-between pb-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    Estimated A1C
                  </h3>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      color="primary"
                      isLoading={estimating}
                      size="sm"
                      variant="flat"
                      onPress={handleEstimate}
                    >
                      <HugeiconsIcon
                        color="currentColor"
                        icon={SparklesIcon}
                        size={14}
                        strokeWidth={2}
                      />
                      {estimate ? "Recalculate" : "Estimate"}
                    </Button>
                  </motion.div>
                </CardHeader>
                <CardBody className="pt-0">
                  <AnimatePresence mode="wait">
                    {estimate ? (
                      <motion.div
                        key="estimate-data"
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                        exit={{ opacity: 0, y: -10 }}
                        initial={{ opacity: 0, y: 10 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 24,
                        }}
                      >
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-foreground">
                            {estimate.estimatedA1C.toFixed(1)}%
                          </span>
                          <motion.div
                            animate={
                              estimate.confidence === "low"
                                ? {
                                    scale: [1, 1.15, 1],
                                  }
                                : {}
                            }
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          >
                            <Chip
                              color={getConfidenceColor(estimate.confidence)}
                              size="sm"
                              variant="flat"
                            >
                              {estimate.confidence} confidence
                            </Chip>
                          </motion.div>
                        </div>
                        <p className="text-sm text-default-500">
                          Estimated from your last 90 days of readings
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div>
                            <span className="text-default-400">Readings: </span>
                            <span className="font-medium text-foreground">
                              {estimate.readingCount}
                            </span>
                          </div>
                          <div>
                            <span className="text-default-400">
                              Avg Glucose:{" "}
                            </span>
                            <span className="font-medium text-foreground">
                              {estimate.avgGlucose} mg/dL
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.p
                        key="estimate-empty"
                        animate={{ opacity: 1 }}
                        className="text-sm text-default-400"
                        initial={{ opacity: 0 }}
                      >
                        Click &quot;Estimate&quot; to calculate your A1C from
                        blood glucose readings.
                      </motion.p>
                    )}
                  </AnimatePresence>
                </CardBody>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Add Lab Result */}
      <motion.div variants={itemVariants}>
        <Card className="border border-divider bg-content1">
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HugeiconsIcon
                className="text-primary"
                color="currentColor"
                icon={Stethoscope02Icon}
                size={20}
                strokeWidth={1.8}
              />
              <h3 className="text-lg font-semibold text-foreground">
                Lab Results
              </h3>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                color="primary"
                size="sm"
                variant={showForm ? "flat" : "solid"}
                onPress={() => setShowForm(!showForm)}
              >
                {showForm ? "Cancel" : "Add Lab Result"}
              </Button>
            </motion.div>
          </CardHeader>

          <AnimatePresence>
            {showForm && (
              <motion.div
                animate="visible"
                exit="exit"
                initial="hidden"
                style={{ overflow: "hidden" }}
                variants={formExpandVariants}
              >
                <CardBody className="pt-0">
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        isRequired
                        label="A1C Value (%)"
                        max={20}
                        min={3}
                        placeholder="e.g. 6.5"
                        step={0.1}
                        type="number"
                        value={formValue}
                        variant="bordered"
                        onValueChange={setFormValue}
                      />
                      <Input
                        isRequired
                        label="Test Date"
                        type="date"
                        value={formDate}
                        variant="bordered"
                        onValueChange={setFormDate}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        label="Lab Name"
                        placeholder="e.g. Quest Diagnostics"
                        value={formLabName}
                        variant="bordered"
                        onValueChange={setFormLabName}
                      />
                      <Input
                        label="Notes"
                        placeholder="Optional notes..."
                        value={formNotes}
                        variant="bordered"
                        onValueChange={setFormNotes}
                      />
                    </div>

                    {formError && (
                      <motion.p
                        animate={{ opacity: 1, x: 0 }}
                        className="text-sm text-danger"
                        initial={{ opacity: 0, x: -10 }}
                      >
                        {formError}
                      </motion.p>
                    )}

                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        className="w-full sm:w-auto"
                        color="primary"
                        isLoading={saving}
                        onPress={handleSaveLabResult}
                      >
                        Save Lab Result
                      </Button>
                    </motion.div>
                  </div>
                </CardBody>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* History */}
      <motion.div variants={itemVariants}>
        <Card className="border border-divider bg-content1">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <HugeiconsIcon
                className="text-default-400"
                color="currentColor"
                icon={Clock01Icon}
                size={20}
                strokeWidth={1.8}
              />
              <h3 className="text-lg font-semibold text-foreground">
                A1C History
              </h3>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            {history.length === 0 ? (
              <motion.p
                animate={{ opacity: 1 }}
                className="py-4 text-center text-sm text-default-400"
                initial={{ opacity: 0 }}
                transition={{ delay: 0.3 }}
              >
                No A1C records yet. Add a lab result or estimate from your
                readings to get started.
              </motion.p>
            ) : (
              <motion.div
                animate="show"
                className="space-y-1"
                initial="hidden"
                variants={containerVariants}
              >
                {history.map((record, index) => (
                  <motion.div
                    key={record.id}
                    custom={index}
                    variants={historyItemVariants}
                  >
                    {index > 0 && <Divider className="my-1" />}
                    <motion.div
                      className="flex items-center justify-between rounded-lg px-2 py-3 transition-colors hover:bg-default-50"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                      }}
                      whileHover={{ x: 4 }}
                    >
                      <div className="flex items-center gap-4">
                        {/* Date */}
                        <div className="min-w-[80px]">
                          <p className="text-sm font-medium text-foreground">
                            {format(new Date(record.test_date), "MMM d, yyyy")}
                          </p>
                        </div>

                        {/* Value */}
                        <div>
                          <span className="text-xl font-bold text-foreground">
                            {record.value.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Source badge */}
                        <Chip
                          color={
                            record.source === "lab" ? "primary" : "default"
                          }
                          size="sm"
                          variant="flat"
                        >
                          {record.source === "lab" ? "Lab" : "Estimated"}
                        </Chip>

                        {/* Confidence badge */}
                        <Chip
                          color={getConfidenceColor(record.confidence)}
                          size="sm"
                          variant="dot"
                        >
                          {record.confidence}
                        </Chip>
                      </div>
                    </motion.div>

                    {/* Additional details row */}
                    {(record.lab_name || record.notes) && (
                      <motion.div
                        animate={{ opacity: 1 }}
                        className="px-2 pb-2 text-xs text-default-400"
                        initial={{ opacity: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        {record.lab_name && (
                          <span className="mr-3">Lab: {record.lab_name}</span>
                        )}
                        {record.notes && <span>{record.notes}</span>}
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </CardBody>
        </Card>
      </motion.div>
    </motion.div>
  );
}
