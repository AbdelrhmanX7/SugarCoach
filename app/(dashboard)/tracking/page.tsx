"use client";

import type {
  ChartReading,
  InsulinReading,
  CarbReading,
} from "@/components/tracking/blood-sugar-chart";
import type { WeeklySummaryData } from "@/components/tracking/weekly-summary";
import type { BloodSugarReading, InsulinLog, MealLog } from "@/types/database";

import { useEffect, useState, useCallback } from "react";
import { Spinner } from "@heroui/spinner";
import NextLink from "next/link";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
} from "date-fns";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Sun01Icon,
  Calendar01Icon,
  CalendarCheckIn01Icon,
  DropletIcon,
  Target01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  InjectionIcon,
  Bread01Icon,
  AiChat02Icon,
} from "@hugeicons/core-free-icons";

import { BloodSugarChart } from "@/components/tracking/blood-sugar-chart";
import { TimeInRangeChart } from "@/components/tracking/time-in-range";
import { LogHistory } from "@/components/tracking/log-history";
import { createClient } from "@/lib/supabase/client";

type Period = "day" | "week" | "month";

type TrackingPageData = {
  chartReadings: ChartReading[];
  insulinReadings: InsulinReading[];
  carbReadings: CarbReading[];
  summary: WeeklySummaryData;
  targetMin: number;
  targetMax: number;
  inRangePct: number;
  aboveRangePct: number;
  belowRangePct: number;
  rawReadings: BloodSugarReading[];
  rawInsulin: InsulinLog[];
  rawMeals: MealLog[];
};

const periodTabs: { key: Period; label: string; icon: typeof Sun01Icon }[] = [
  { key: "day", label: "Day", icon: Sun01Icon },
  { key: "week", label: "Week", icon: Calendar01Icon },
  { key: "month", label: "Month", icon: CalendarCheckIn01Icon },
];

export default function TrackingPage() {
  const [period, setPeriod] = useState<Period>("week");
  const [data, setData] = useState<TrackingPageData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTrackingData = useCallback(async (selectedPeriod: Period) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);

        return;
      }

      const now = new Date();
      let rangeStart: Date;
      let rangeEnd: Date;

      switch (selectedPeriod) {
        case "day":
          rangeStart = startOfDay(now);
          rangeEnd = endOfDay(now);
          break;
        case "week":
          rangeStart = startOfWeek(now, { weekStartsOn: 1 });
          rangeEnd = endOfWeek(now, { weekStartsOn: 1 });
          break;
        case "month":
          rangeStart = startOfMonth(now);
          rangeEnd = endOfMonth(now);
          break;
      }

      const rangeStartStr = rangeStart.toISOString();
      const rangeEndStr = rangeEnd.toISOString();

      const [profileRes, readingsRes, insulinRes, mealsRes] = await Promise.all(
        [
          supabase
            .from("profiles")
            .select("target_bg_min, target_bg_max")
            .eq("user_id", user.id)
            .single(),
          supabase
            .from("blood_sugar_readings")
            .select("*")
            .eq("user_id", user.id)
            .gte("reading_time", rangeStartStr)
            .lte("reading_time", rangeEndStr)
            .order("reading_time", { ascending: true }),
          supabase
            .from("insulin_logs")
            .select("*")
            .eq("user_id", user.id)
            .gte("injection_time", rangeStartStr)
            .lte("injection_time", rangeEndStr)
            .order("injection_time", { ascending: true }),
          supabase
            .from("meal_logs")
            .select("*")
            .eq("user_id", user.id)
            .gte("meal_time", rangeStartStr)
            .lte("meal_time", rangeEndStr)
            .order("meal_time", { ascending: true }),
        ],
      );

      const profile = profileRes.data;
      const readings = readingsRes.data ?? [];
      const insulin = insulinRes.data ?? [];
      const meals = mealsRes.data ?? [];

      const targetMin = profile?.target_bg_min ?? 70;
      const targetMax = profile?.target_bg_max ?? 180;

      let chartReadings: ChartReading[];

      if (selectedPeriod === "day") {
        // Day view: show each reading individually
        chartReadings = readings.map(
          (r: { reading_time: string; value: number }) => ({
            time: r.reading_time,
            value: r.value,
            label: format(new Date(r.reading_time), "HH:mm"),
          }),
        );
      } else {
        // Week/Month view: average readings per day
        const dayMap = new Map<
          string,
          { sum: number; count: number; time: string }
        >();

        readings.forEach((r: { reading_time: string; value: number }) => {
          const dayKey = format(new Date(r.reading_time), "yyyy-MM-dd");

          if (!dayMap.has(dayKey)) {
            dayMap.set(dayKey, { sum: 0, count: 0, time: r.reading_time });
          }
          const entry = dayMap.get(dayKey)!;

          entry.sum += r.value;
          entry.count += 1;
        });

        chartReadings = Array.from(dayMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([, { sum, count, time }]) => ({
            time,
            value: Math.round(sum / count),
            label:
              selectedPeriod === "week"
                ? format(new Date(time), "EEE")
                : format(new Date(time), "MMM dd"),
          }));
      }

      let avgBG: number | null = null;
      let timeInRangePct: number | null = null;
      let hypoCount = 0;
      let hyperCount = 0;
      let inRangePct = 0;
      let aboveRangePct = 0;
      let belowRangePct = 0;

      if (readings.length > 0) {
        const sum = readings.reduce(
          (acc: number, r: { value: number }) => acc + r.value,
          0,
        );

        avgBG = Math.round(sum / readings.length);

        const inRange = readings.filter(
          (r: { value: number }) =>
            r.value >= targetMin && r.value <= targetMax,
        ).length;
        const above = readings.filter(
          (r: { value: number }) => r.value > targetMax,
        ).length;
        const below = readings.filter(
          (r: { value: number }) => r.value < targetMin,
        ).length;

        timeInRangePct = Math.round((inRange / readings.length) * 100);
        inRangePct = Math.round((inRange / readings.length) * 100);
        aboveRangePct = Math.round((above / readings.length) * 100);
        belowRangePct = Math.round((below / readings.length) * 100);

        hypoCount = below;
        hyperCount = above;
      }

      const totalInsulin =
        insulin.length > 0
          ? Math.round(
              insulin.reduce(
                (acc: number, i: { units: number }) => acc + i.units,
                0,
              ) * 10,
            ) / 10
          : null;

      const totalCarbs = meals
        .filter((m: { total_carbs: number | null }) => m.total_carbs != null)
        .reduce(
          (acc: number, m: { total_carbs: number | null }) =>
            acc + (m.total_carbs ?? 0),
          0,
        );
      const periodDays =
        selectedPeriod === "day" ? 1 : selectedPeriod === "week" ? 7 : 30;
      const avgCarbs =
        meals.length > 0 ? Math.round(totalCarbs / periodDays) : null;

      let insulinChartReadings: InsulinReading[];
      let carbChartReadings: CarbReading[];

      if (selectedPeriod === "day") {
        insulinChartReadings = insulin.map(
          (i: { injection_time: string; units: number }) => ({
            time: i.injection_time,
            units: i.units,
            label: format(new Date(i.injection_time), "HH:mm"),
          }),
        );

        carbChartReadings = meals
          .filter((m: { total_carbs: number | null }) => m.total_carbs != null)
          .map((m: { meal_time: string; total_carbs: number | null }) => ({
            time: m.meal_time,
            carbs: m.total_carbs ?? 0,
            label: format(new Date(m.meal_time), "HH:mm"),
          }));
      } else {
        // Week/Month: sum per day
        const insulinDayMap = new Map<
          string,
          { total: number; time: string }
        >();

        insulin.forEach((i: { injection_time: string; units: number }) => {
          const dayKey = format(new Date(i.injection_time), "yyyy-MM-dd");

          if (!insulinDayMap.has(dayKey)) {
            insulinDayMap.set(dayKey, { total: 0, time: i.injection_time });
          }
          insulinDayMap.get(dayKey)!.total += i.units;
        });

        insulinChartReadings = Array.from(insulinDayMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([, { total, time }]) => ({
            time,
            units: Math.round(total * 10) / 10,
            label:
              selectedPeriod === "week"
                ? format(new Date(time), "EEE")
                : format(new Date(time), "MMM dd"),
          }));

        const carbDayMap = new Map<string, { total: number; time: string }>();

        meals
          .filter((m: { total_carbs: number | null }) => m.total_carbs != null)
          .forEach((m: { meal_time: string; total_carbs: number | null }) => {
            const dayKey = format(new Date(m.meal_time), "yyyy-MM-dd");

            if (!carbDayMap.has(dayKey)) {
              carbDayMap.set(dayKey, { total: 0, time: m.meal_time });
            }
            carbDayMap.get(dayKey)!.total += m.total_carbs ?? 0;
          });

        carbChartReadings = Array.from(carbDayMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([, { total, time }]) => ({
            time,
            carbs: Math.round(total),
            label:
              selectedPeriod === "week"
                ? format(new Date(time), "EEE")
                : format(new Date(time), "MMM dd"),
          }));
      }

      setData({
        chartReadings,
        insulinReadings: insulinChartReadings,
        carbReadings: carbChartReadings,
        summary: {
          avgBG,
          timeInRangePct,
          hypoCount,
          hyperCount,
          totalInsulin,
          avgCarbs,
        },
        targetMin,
        targetMax,
        inRangePct,
        aboveRangePct,
        belowRangePct,
        rawReadings: readings as BloodSugarReading[],
        rawInsulin: insulin as InsulinLog[],
        rawMeals: meals as MealLog[],
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error fetching tracking data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrackingData(period);
  }, [period, fetchTrackingData]);

  const s = data?.summary;
  const hasData = data && data.chartReadings.length > 0;

  const avgBGColor =
    s?.avgBG != null
      ? s.avgBG >= 70 && s.avgBG <= 180
        ? "text-success"
        : "text-warning"
      : "text-default-400";

  const tirColor =
    s?.timeInRangePct != null
      ? s.timeInRangePct >= 70
        ? "text-success"
        : s.timeInRangePct >= 50
          ? "text-warning"
          : "text-danger"
      : "text-default-400";

  const statItems = [
    {
      label: "Avg BG",
      value: s?.avgBG ?? "--",
      unit: "mg/dL",
      color: avgBGColor,
      icon: DropletIcon,
    },
    {
      label: "In Range",
      value: s?.timeInRangePct != null ? `${s.timeInRangePct}` : "--",
      unit: "%",
      color: tirColor,
      icon: Target01Icon,
    },
    {
      label: "Lows",
      value: s?.hypoCount ?? 0,
      color: s?.hypoCount ? "text-warning" : "text-success",
      icon: ArrowDown01Icon,
    },
    {
      label: "Highs",
      value: s?.hyperCount ?? 0,
      color: s?.hyperCount ? "text-danger" : "text-success",
      icon: ArrowUp01Icon,
    },
    {
      label: "Insulin",
      value: s?.totalInsulin ?? "--",
      unit: "u",
      color: "text-blue-500",
      icon: InjectionIcon,
    },
    {
      label: "Carbs/Day",
      value: s?.avgCarbs ?? "--",
      unit: "g",
      color: "text-amber-500",
      icon: Bread01Icon,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-20 lg:pb-6">
      {/* Header + period tabs */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          Tracking
        </h1>

        <div className="flex gap-0.5 rounded-xl border border-divider bg-content2/50 p-0.5">
          {periodTabs.map((tab) => (
            <button
              key={tab.key}
              className="relative flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              onClick={() => setPeriod(tab.key)}
            >
              {period === tab.key && (
                <motion.div
                  className="absolute inset-0 rounded-lg bg-primary"
                  layoutId="activePeriodTab"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span
                className={`relative z-10 flex items-center gap-1 ${
                  period === tab.key
                    ? "text-primary-foreground"
                    : "text-default-500"
                }`}
              >
                <HugeiconsIcon
                  color="currentColor"
                  icon={tab.icon}
                  size={13}
                  strokeWidth={2}
                />
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner label="Loading..." size="lg" />
        </div>
      ) : hasData ? (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {statItems.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-0.5 rounded-xl border border-default-200 bg-content1 py-3"
              >
                <HugeiconsIcon
                  className={stat.color}
                  color="currentColor"
                  icon={stat.icon}
                  size={16}
                  strokeWidth={1.8}
                />
                <div className="flex items-baseline gap-0.5">
                  <span className={`text-lg font-bold ${stat.color}`}>
                    {stat.value}
                  </span>
                  {stat.unit && (
                    <span className="text-[10px] text-default-400">
                      {stat.unit}
                    </span>
                  )}
                </div>
                <span className="text-xs text-default-400">{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Chart + Time in range */}
          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="rounded-2xl border border-default-200 bg-content1 p-1">
              <BloodSugarChart
                carbReadings={data?.carbReadings ?? []}
                insulinReadings={data?.insulinReadings ?? []}
                period={period}
                readings={data?.chartReadings ?? []}
                targetMax={data?.targetMax ?? 180}
                targetMin={data?.targetMin ?? 70}
                title="Blood Sugar Trend"
              />
            </div>

            <TimeInRangeChart
              aboveRange={data?.aboveRangePct ?? 0}
              belowRange={data?.belowRangePct ?? 0}
              inRange={data?.inRangePct ?? 0}
            />
          </div>

          {/* Log History */}
          <LogHistory
            bloodSugarReadings={data?.rawReadings ?? []}
            insulinLogs={data?.rawInsulin ?? []}
            mealLogs={data?.rawMeals ?? []}
            targetMax={data?.targetMax ?? 180}
            targetMin={data?.targetMin ?? 70}
          />
        </>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-default-200 bg-content1 px-6 py-20 text-center">
          <HugeiconsIcon
            className="text-default-300"
            color="currentColor"
            icon={DropletIcon}
            size={36}
            strokeWidth={1.5}
          />
          <h3 className="mt-4 text-base font-semibold text-foreground">
            No data for this period
          </h3>
          <p className="mt-1 max-w-xs text-sm text-default-400">
            Log your blood sugar, insulin, or meals to see your trends here.
          </p>
          <NextLink
            className="mt-4 flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            href="/chat"
          >
            <HugeiconsIcon color="currentColor" icon={AiChat02Icon} size={16} />
            Log via Chat
          </NextLink>
        </div>
      )}
    </div>
  );
}
