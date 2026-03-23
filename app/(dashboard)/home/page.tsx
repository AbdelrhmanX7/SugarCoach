"use client";

import type { ChartReading } from "@/components/tracking/blood-sugar-chart";
import type { Profile } from "@/types/database";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Spinner } from "@heroui/spinner";
import NextLink from "next/link";
import { startOfDay, endOfDay, format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiChat02Icon,
  ChartLineData01Icon,
  DropletIcon,
  InjectionIcon,
  Bread01Icon,
  BulbIcon,
  Restaurant01Icon,
  Upload02Icon,
  ShoppingBasket03Icon,
} from "@hugeicons/core-free-icons";

import { BloodSugarChart } from "@/components/tracking/blood-sugar-chart";
import { BleSyncCard } from "@/components/home/ble-sync-card";
import { QuickLogTabs } from "@/components/home/quick-log-tabs";
import { DietDrawer } from "@/components/home/diet-drawer";
import { ImportDrawer } from "@/components/home/import-drawer";
import { PantryModal } from "@/components/pantry/pantry-modal";
import { MealTimer } from "@/components/home/meal-timer";
import { createClient } from "@/lib/supabase/client";

const tips = [
  "Drinking water can help keep blood sugar levels in check. Stay hydrated!",
  "A short walk after meals can help lower blood sugar spikes.",
  "Consistency is key -- try to eat meals at similar times each day.",
  "Getting enough sleep helps your body manage insulin better.",
  "Celebrate your wins, no matter how small. Every reading counts!",
  "Deep breathing can help reduce stress, which affects blood sugar.",
  "Fiber-rich foods help slow down sugar absorption. Try adding veggies!",
  "You are doing amazing! Keep tracking and learning about your body.",
];

type DashboardData = {
  profile: Profile | null;
  readingsCount: number;
  avgBG: number | null;
  totalInsulin: number | null;
  totalCarbs: number | null;
  chartReadings: ChartReading[];
  targetMin: number;
  targetMax: number;
};

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";

  return "Good evening";
}

const quickAccess = [
  {
    key: "chat",
    label: "AI Coach",
    icon: AiChat02Icon,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    href: "/chat",
  },
  {
    key: "pantry",
    label: "Pantry",
    icon: ShoppingBasket03Icon,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    key: "diet",
    label: "Diet",
    icon: Restaurant01Icon,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    key: "import",
    label: "Import",
    icon: Upload02Icon,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
];

export default function DashboardHome() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dietOpen, setDietOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [pantryOpen, setPantryOpen] = useState(false);

  const randomTip = useMemo(
    () => tips[Math.floor(Math.random() * tips.length)],
    [],
  );

  const fetchData = useCallback(async () => {
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
      const todayStart = startOfDay(now).toISOString();
      const todayEnd = endOfDay(now).toISOString();

      const [profileRes, readingsRes, insulinRes, mealsRes] = await Promise.all(
        [
          supabase.from("profiles").select("*").eq("user_id", user.id).single(),
          supabase
            .from("blood_sugar_readings")
            .select("*")
            .eq("user_id", user.id)
            .gte("reading_time", todayStart)
            .lte("reading_time", todayEnd)
            .order("reading_time", { ascending: true }),
          supabase
            .from("insulin_logs")
            .select("units")
            .eq("user_id", user.id)
            .gte("injection_time", todayStart)
            .lte("injection_time", todayEnd),
          supabase
            .from("meal_logs")
            .select("total_carbs")
            .eq("user_id", user.id)
            .gte("meal_time", todayStart)
            .lte("meal_time", todayEnd),
        ],
      );

      const profile = profileRes.data;
      const readings = readingsRes.data ?? [];
      const insulin = insulinRes.data ?? [];
      const meals = mealsRes.data ?? [];

      const targetMin = profile?.target_bg_min ?? 70;
      const targetMax = profile?.target_bg_max ?? 180;

      const avgBG =
        readings.length > 0
          ? Math.round(
              readings.reduce(
                (acc: number, r: { value: number }) => acc + r.value,
                0,
              ) / readings.length,
            )
          : null;

      const totalInsulin =
        insulin.length > 0
          ? Math.round(
              insulin.reduce(
                (acc: number, i: { units: number }) => acc + i.units,
                0,
              ) * 10,
            ) / 10
          : null;

      const totalCarbs =
        meals.length > 0
          ? Math.round(
              meals
                .filter(
                  (m: { total_carbs: number | null }) => m.total_carbs != null,
                )
                .reduce(
                  (acc: number, m: { total_carbs: number | null }) =>
                    acc + (m.total_carbs ?? 0),
                  0,
                ),
            )
          : null;

      const chartReadings: ChartReading[] = readings.map(
        (r: { reading_time: string; value: number }) => ({
          time: r.reading_time,
          value: r.value,
          label: format(new Date(r.reading_time), "HH:mm"),
        }),
      );

      setData({
        profile: profile as Profile | null,
        readingsCount: readings.length,
        avgBG,
        totalInsulin,
        totalCarbs,
        chartReadings,
        targetMin,
        targetMax,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner label="Loading..." size="lg" />
      </div>
    );
  }

  const displayName = data?.profile?.display_name || "Coach";
  const greeting = getGreeting();

  function handleQuickAction(key: string) {
    if (key === "pantry") setPantryOpen(true);
    if (key === "diet") setDietOpen(true);
    if (key === "import") setImportOpen(true);
  }

  const statItems = [
    {
      label: "Readings",
      value: data?.readingsCount ?? 0,
      icon: DropletIcon,
      color: "text-primary",
      hasValue: true,
    },
    {
      label: "Avg BG",
      value: data?.avgBG,
      icon: ChartLineData01Icon,
      color:
        data?.avgBG != null
          ? data.avgBG >= 70 && data.avgBG <= 180
            ? "text-success"
            : "text-warning"
          : "text-default-400",
      hasValue: data?.avgBG != null,
    },
    {
      label: "Insulin",
      value: data?.totalInsulin != null ? Math.round(data.totalInsulin) : null,
      suffix: "u",
      icon: InjectionIcon,
      color: "text-primary",
      hasValue: data?.totalInsulin != null,
    },
    {
      label: "Carbs",
      value: data?.totalCarbs,
      suffix: "g",
      icon: Bread01Icon,
      color: "text-warning",
      hasValue: data?.totalCarbs != null,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20 lg:pb-6">
      {/* Greeting + Stats row */}
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          {greeting},{" "}
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {displayName}
          </span>
        </h1>
        <p className="mt-0.5 text-sm text-default-400">
          {format(new Date(), "EEEE, MMMM d")}
        </p>
      </div>

      {/* Today's Stats + Quick Access — single block */}
      <div className="rounded-2xl border border-default-200 bg-content1 p-4">
        {/* Stats row */}
        <div className="flex items-center justify-around">
          {statItems.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-0.5"
            >
              <div className="flex items-center gap-1.5">
                <HugeiconsIcon
                  className={stat.color}
                  color="currentColor"
                  icon={stat.icon}
                  size={16}
                  strokeWidth={1.8}
                />
                <span className={`text-xl font-bold ${stat.color}`}>
                  {stat.hasValue ? (
                    <>
                      {stat.value}
                      {stat.suffix}
                    </>
                  ) : (
                    "--"
                  )}
                </span>
              </div>
              <span className="text-xs text-default-400">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="my-3 h-px bg-divider" />

        {/* Quick Access row */}
        <div className="flex items-center justify-around">
          {quickAccess.map((item) => {
            const inner = (
              <button
                className="flex flex-col items-center gap-1.5 rounded-xl px-3 py-2 transition-colors hover:bg-default-100"
                type="button"
                onClick={() => !item.href && handleQuickAction(item.key)}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.bg}`}
                >
                  <HugeiconsIcon
                    className={item.color}
                    color="currentColor"
                    icon={item.icon}
                    size={18}
                    strokeWidth={1.8}
                  />
                </div>
                <span className="text-xs font-medium text-default-500">
                  {item.label}
                </span>
              </button>
            );

            if (item.href) {
              return (
                <NextLink key={item.key} href={item.href}>
                  {inner}
                </NextLink>
              );
            }

            return <div key={item.key}>{inner}</div>;
          })}
          <BleSyncCard onSyncComplete={fetchData} />
        </div>
      </div>

      {/* Meal Timer */}
      <MealTimer />

      {/* Quick Log */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-foreground">
          Quick Log
        </h2>
        <QuickLogTabs />
      </div>

      {/* Blood Sugar Chart */}
      <div>
        <div className="rounded-2xl border border-divider/50 bg-content1/50 p-1 backdrop-blur-sm">
          <BloodSugarChart
            compact
            period="day"
            readings={data?.chartReadings ?? []}
            targetMax={data?.targetMax ?? 180}
            targetMin={data?.targetMin ?? 70}
            title="Today's Blood Sugar"
          />
        </div>
      </div>

      {/* Daily Tip — subtle */}
      <div className="flex items-start gap-3 rounded-xl bg-secondary/5 px-4 py-3">
        <HugeiconsIcon
          className="mt-0.5 shrink-0 text-secondary"
          color="currentColor"
          icon={BulbIcon}
          size={18}
          strokeWidth={1.8}
        />
        <div>
          <p className="text-xs font-semibold text-foreground">Daily Tip</p>
          <p className="mt-0.5 text-sm leading-relaxed text-default-500">
            {randomTip}
          </p>
        </div>
      </div>

      {/* Modals */}
      <PantryModal isOpen={pantryOpen} onClose={() => setPantryOpen(false)} />
      <DietDrawer isOpen={dietOpen} onClose={() => setDietOpen(false)} />
      <ImportDrawer isOpen={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
