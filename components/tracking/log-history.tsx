"use client";

import type { BloodSugarReading, InsulinLog, MealLog } from "@/types/database";

import { useState } from "react";
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DropletIcon,
  InjectionIcon,
  Restaurant01Icon,
} from "@hugeicons/core-free-icons";
import { motion } from "framer-motion";

type LogHistoryProps = {
  bloodSugarReadings: BloodSugarReading[];
  insulinLogs: InsulinLog[];
  mealLogs: MealLog[];
  targetMin: number;
  targetMax: number;
};

type Tab = "all" | "blood_sugar" | "insulin" | "meals";

const tabs: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "blood_sugar", label: "Blood Sugar" },
  { key: "insulin", label: "Insulin" },
  { key: "meals", label: "Meals" },
];

type UnifiedEntry = {
  id: string;
  type: "blood_sugar" | "insulin" | "meal";
  time: string;
  data: BloodSugarReading | InsulinLog | MealLog;
};

function buildTimeline(
  bsReadings: BloodSugarReading[],
  insulinLogs: InsulinLog[],
  mealLogs: MealLog[],
): UnifiedEntry[] {
  const entries: UnifiedEntry[] = [
    ...bsReadings.map((r) => ({
      id: r.id,
      type: "blood_sugar" as const,
      time: r.reading_time,
      data: r,
    })),
    ...insulinLogs.map((i) => ({
      id: i.id,
      type: "insulin" as const,
      time: i.injection_time,
      data: i,
    })),
    ...mealLogs.map((m) => ({
      id: m.id,
      type: "meal" as const,
      time: m.meal_time,
      data: m,
    })),
  ];

  return entries.sort(
    (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
  );
}

export function LogHistory({
  bloodSugarReadings,
  insulinLogs,
  mealLogs,
  targetMin,
  targetMax,
}: LogHistoryProps) {
  const [activeTab, setActiveTab] = useState<Tab>("all");

  const timeline = buildTimeline(bloodSugarReadings, insulinLogs, mealLogs);

  const filtered =
    activeTab === "all"
      ? timeline
      : timeline.filter((e) => {
          if (activeTab === "blood_sugar") return e.type === "blood_sugar";
          if (activeTab === "insulin") return e.type === "insulin";

          return e.type === "meal";
        });

  if (timeline.length === 0) return null;

  return (
    <div>
      <h2 className="text-base font-semibold text-foreground">Recent Logs</h2>

      {/* Tabs */}
      <div className="mt-3 flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`relative rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? "text-primary-foreground"
                : "text-default-500 hover:bg-default-100"
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {activeTab === tab.key && (
              <motion.div
                className="absolute inset-0 rounded-lg bg-primary"
                layoutId="activeLogTab"
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Entries */}
      <div className="mt-3 flex flex-col gap-2">
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-default-400">
            No entries for this filter.
          </p>
        ) : (
          filtered.slice(0, 20).map((entry) => (
            <div
              key={`${entry.type}-${entry.id}`}
              className={`rounded-xl border border-default-200 bg-content1 px-4 py-3 ${
                entry.type === "meal" ? "" : "flex items-center gap-3"
              }`}
            >
              {entry.type === "blood_sugar" && (
                <BSRow
                  reading={entry.data as BloodSugarReading}
                  targetMax={targetMax}
                  targetMin={targetMin}
                />
              )}
              {entry.type === "insulin" && (
                <InsulinRow log={entry.data as InsulinLog} />
              )}
              {entry.type === "meal" && <MealRow log={entry.data as MealLog} />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function BSRow({
  reading,
  targetMin,
  targetMax,
}: {
  reading: BloodSugarReading;
  targetMin: number;
  targetMax: number;
}) {
  const inRange = reading.value >= targetMin && reading.value <= targetMax;
  const color = inRange ? "text-success" : "text-warning";

  return (
    <>
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${inRange ? "bg-success/10" : "bg-warning/10"}`}
      >
        <HugeiconsIcon
          className={color}
          color="currentColor"
          icon={DropletIcon}
          size={16}
          strokeWidth={1.8}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1">
          <span className={`text-sm font-bold ${color}`}>{reading.value}</span>
          <span className="text-xs text-default-400">{reading.unit}</span>
        </div>
        <p className="text-xs text-default-400">
          {reading.context?.replace("_", " ") || "Blood Sugar"}
        </p>
      </div>
      <span className="shrink-0 text-xs text-default-400">
        {format(new Date(reading.reading_time), "MMM d, h:mm a")}
      </span>
    </>
  );
}

function InsulinRow({ log }: { log: InsulinLog }) {
  return (
    <>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
        <HugeiconsIcon
          className="text-blue-500"
          color="currentColor"
          icon={InjectionIcon}
          size={16}
          strokeWidth={1.8}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-bold text-foreground">
            {log.units}u
          </span>
          {log.insulin_brand && (
            <span className="text-sm text-default-600">{log.insulin_brand}</span>
          )}
        </div>
        <p className="truncate text-xs text-default-400">
          {log.insulin_type} &middot; {log.method}
        </p>
      </div>
      <span className="shrink-0 text-xs text-default-400">
        {format(new Date(log.injection_time), "MMM d, h:mm a")}
      </span>
    </>
  );
}

function MealRow({ log }: { log: MealLog }) {
  const [expanded, setExpanded] = useState(false);

  const nutritionItems = [
    log.total_carbs != null && { label: "Carbs", value: `${log.total_carbs}g` },
    log.total_calories != null && {
      label: "Calories",
      value: `${log.total_calories} kcal`,
    },
    log.total_protein != null && {
      label: "Protein",
      value: `${log.total_protein}g`,
    },
    log.total_fat != null && { label: "Fat", value: `${log.total_fat}g` },
    log.total_sugar != null && { label: "Sugar", value: `${log.total_sugar}g` },
    log.total_fiber != null && { label: "Fiber", value: `${log.total_fiber}g` },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="flex-1 min-w-0">
      <button
        className="flex w-full items-center gap-3 text-left"
        type="button"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
          <HugeiconsIcon
            className="text-amber-500"
            color="currentColor"
            icon={Restaurant01Icon}
            size={16}
            strokeWidth={1.8}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {log.description || log.meal_type || "Meal"}
          </p>
          <div className="flex items-center gap-2 text-xs text-default-400">
            {log.total_carbs != null && (
              <span>{log.total_carbs}g carbs</span>
            )}
            {log.total_calories != null && (
              <span>{log.total_calories} kcal</span>
            )}
          </div>
        </div>
        <span className="shrink-0 text-xs text-default-400">
          {format(new Date(log.meal_time), "MMM d, h:mm a")}
        </span>
      </button>

      {expanded && (
        <div className="mt-3 ml-12 space-y-2">
          {/* Nutrition grid */}
          {nutritionItems.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {nutritionItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg bg-default-50 px-2.5 py-1.5 text-center"
                >
                  <p className="text-xs font-medium text-foreground">
                    {item.value}
                  </p>
                  <p className="text-[11px] text-default-400">{item.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Meal type + notes */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-default-400">
            {log.meal_type && (
              <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">
                {log.meal_type}
              </span>
            )}
            {log.ai_analyzed && (
              <span className="rounded-md bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary">
                AI analyzed
              </span>
            )}
            {log.recommended_insulin != null &&
              log.recommended_insulin > 0 && (
                <span className="text-xs text-default-500">
                  Suggested: {log.recommended_insulin}u insulin
                </span>
              )}
          </div>

          {log.notes && (
            <p className="text-xs text-default-400">{log.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}
