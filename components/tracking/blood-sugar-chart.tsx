"use client";

import type { Key } from "react";

import { useMemo, useState } from "react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Tabs, Tab } from "@heroui/tabs";

type CustomTooltipPayload = {
  value?: number;
  name?: string;
  color?: string;
  payload?: MergedReading;
};

export type ChartReading = {
  time: string;
  value: number;
  label: string;
};

export type InsulinReading = {
  time: string;
  units: number;
  label: string;
};

export type CarbReading = {
  time: string;
  carbs: number;
  label: string;
};

type MergedReading = {
  time: string;
  label: string;
  bg?: number;
  insulin?: number;
  carbs?: number;
};

export type BloodSugarChartProps = {
  readings: ChartReading[];
  insulinReadings?: InsulinReading[];
  carbReadings?: CarbReading[];
  targetMin: number;
  targetMax: number;
  period: "day" | "week" | "month";
  onPeriodChange?: (period: "day" | "week" | "month") => void;
  title?: string;
  compact?: boolean;
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: CustomTooltipPayload[];
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-divider bg-content1 px-3 py-2 shadow-lg">
      {payload.map((entry, i) => {
        if (entry.value == null || entry.value === 0) return null;

        const unit =
          entry.name === "bg"
            ? " mg/dL"
            : entry.name === "insulin"
              ? " units"
              : entry.name === "carbs"
                ? "g carbs"
                : "";

        const label =
          entry.name === "bg"
            ? "Blood Sugar"
            : entry.name === "insulin"
              ? "Insulin"
              : entry.name === "carbs"
                ? "Carbs"
                : "";

        return (
          <p key={i} className="text-xs" style={{ color: entry.color }}>
            <span className="font-semibold">
              {entry.value}
              {unit}
            </span>{" "}
            <span className="text-default-400">{label}</span>
          </p>
        );
      })}
      {payload[0]?.payload?.label && (
        <p className="mt-0.5 text-[10px] text-default-400">
          {payload[0].payload.label}
        </p>
      )}
    </div>
  );
}

type DotProps = {
  cx?: number;
  cy?: number;
  payload?: MergedReading;
  targetMin: number;
  targetMax: number;
};

function CustomDot({ cx, cy, payload, targetMin, targetMax }: DotProps) {
  if (cx == null || cy == null || !payload || payload.bg == null) return null;

  let fill = "#22c55e";

  if (payload.bg < targetMin) {
    fill = "#ef4444";
  } else if (payload.bg > targetMax) {
    fill = "#f97316";
  }

  return <circle cx={cx} cy={cy} fill={fill} r={4} stroke="none" />;
}

export function BloodSugarChart({
  readings,
  insulinReadings = [],
  carbReadings = [],
  targetMin,
  targetMax,
  period,
  onPeriodChange,
  title = "Blood Sugar Trend",
  compact = false,
}: BloodSugarChartProps) {
  const [visibleLines, setVisibleLines] = useState({
    bg: true,
    insulin: true,
    carbs: true,
  });

  // Merge all data sources into a single timeline
  const chartData = useMemo(() => {
    const timeMap = new Map<string, MergedReading>();

    for (const r of readings) {
      const key = r.label;
      const existing = timeMap.get(key) || { time: r.time, label: r.label };

      existing.bg = r.value;
      timeMap.set(key, existing);
    }

    for (const r of insulinReadings) {
      const key = r.label;
      const existing = timeMap.get(key) || { time: r.time, label: r.label };

      existing.insulin = (existing.insulin || 0) + r.units;
      timeMap.set(key, existing);
    }

    for (const r of carbReadings) {
      const key = r.label;
      const existing = timeMap.get(key) || { time: r.time, label: r.label };

      existing.carbs = (existing.carbs || 0) + r.carbs;
      timeMap.set(key, existing);
    }

    return Array.from(timeMap.values()).sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
    );
  }, [readings, insulinReadings, carbReadings]);

  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [40, 300];
    const values = chartData
      .map((d) => d.bg)
      .filter((v): v is number => v != null);

    if (values.length === 0) return [40, 300];
    const min = Math.min(...values, targetMin);
    const max = Math.max(...values, targetMax);

    return [Math.max(0, min - 20), max + 30];
  }, [chartData, targetMin, targetMax]);

  const hasInsulin = insulinReadings.length > 0;
  const hasCarbs = carbReadings.length > 0;
  const chartHeight = compact ? 200 : 320;

  function handleLegendClick(dataKey: string) {
    setVisibleLines((prev) => ({
      ...prev,
      [dataKey]: !prev[dataKey as keyof typeof prev],
    }));
  }

  return (
    <Card className="border border-divider bg-content1">
      <CardHeader className="flex flex-col items-start gap-2 pb-0 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {onPeriodChange && (
          <Tabs
            classNames={{ tabList: "bg-default-100" }}
            selectedKey={period}
            size="sm"
            onSelectionChange={(key: Key) =>
              onPeriodChange(key as "day" | "week" | "month")
            }
          >
            <Tab key="day" title="Day" />
            <Tab key="week" title="Week" />
            <Tab key="month" title="Month" />
          </Tabs>
        )}
      </CardHeader>
      <CardBody className="pt-4">
        {chartData.length === 0 ? (
          <div
            className="flex items-center justify-center text-default-400"
            style={{ height: chartHeight }}
          >
            <p>No readings for this period</p>
          </div>
        ) : (
          <>
            {/* Toggle buttons for data layers */}
            {(hasInsulin || hasCarbs) && !compact && (
              <div className="mb-2 flex gap-1.5">
                <button
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-all ${
                    visibleLines.bg
                      ? "bg-indigo-500/10 text-indigo-500 ring-1 ring-indigo-500/30"
                      : "bg-default-100 text-default-400"
                  }`}
                  onClick={() => handleLegendClick("bg")}
                >
                  Blood Sugar
                </button>
                {hasInsulin && (
                  <button
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-all ${
                      visibleLines.insulin
                        ? "bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/30"
                        : "bg-default-100 text-default-400"
                    }`}
                    onClick={() => handleLegendClick("insulin")}
                  >
                    Insulin
                  </button>
                )}
                {hasCarbs && (
                  <button
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-all ${
                      visibleLines.carbs
                        ? "bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/30"
                        : "bg-default-100 text-default-400"
                    }`}
                    onClick={() => handleLegendClick("carbs")}
                  >
                    Carbs
                  </button>
                )}
              </div>
            )}

            <ResponsiveContainer height={chartHeight} width="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid
                  opacity={0.3}
                  stroke="#E5E0D9"
                  strokeDasharray="3 3"
                />

                {/* BG zones */}
                {visibleLines.bg && (
                  <>
                    <ReferenceArea
                      fill="#ef4444"
                      fillOpacity={0.04}
                      y1={yDomain[0]}
                      y2={targetMin}
                      yAxisId="bg"
                    />
                    <ReferenceArea
                      fill="#22c55e"
                      fillOpacity={0.06}
                      y1={targetMin}
                      y2={targetMax}
                      yAxisId="bg"
                    />
                    <ReferenceArea
                      fill="#f97316"
                      fillOpacity={0.04}
                      y1={targetMax}
                      y2={yDomain[1]}
                      yAxisId="bg"
                    />
                  </>
                )}

                <XAxis
                  axisLine={false}
                  dataKey="label"
                  interval="preserveStartEnd"
                  tick={{ fontSize: 10, fill: "#8A8279" }}
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  domain={yDomain}
                  tick={{ fontSize: 10, fill: "#8A8279" }}
                  tickFormatter={(v: number) => `${v}`}
                  tickLine={false}
                  yAxisId="bg"
                />

                {/* Right Y axis for insulin/carbs */}
                {(hasInsulin || hasCarbs) && (
                  <YAxis
                    axisLine={false}
                    orientation="right"
                    tick={{ fontSize: 10, fill: "#8A8279" }}
                    tickLine={false}
                    yAxisId="secondary"
                  />
                )}

                <Tooltip content={<CustomTooltip />} />

                {/* BG line */}
                {visibleLines.bg && (
                  <Line
                    activeDot={{
                      r: 6,
                      fill: "#6366f1",
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                    dataKey="bg"
                    dot={(props: Record<string, unknown>) => (
                      <CustomDot
                        key={`dot-${props.index}`}
                        cx={props.cx as number}
                        cy={props.cy as number}
                        payload={props.payload as MergedReading}
                        targetMax={targetMax}
                        targetMin={targetMin}
                      />
                    )}
                    name="bg"
                    stroke="#6366f1"
                    strokeWidth={2}
                    type="monotone"
                    yAxisId="bg"
                  />
                )}

                {/* Insulin bars */}
                {hasInsulin && visibleLines.insulin && (
                  <Bar
                    barSize={8}
                    dataKey="insulin"
                    fill="#3b82f6"
                    name="insulin"
                    opacity={0.6}
                    radius={[4, 4, 0, 0]}
                    yAxisId="secondary"
                  />
                )}

                {/* Carbs bars */}
                {hasCarbs && visibleLines.carbs && (
                  <Bar
                    barSize={8}
                    dataKey="carbs"
                    fill="#f59e0b"
                    name="carbs"
                    opacity={0.5}
                    radius={[4, 4, 0, 0]}
                    yAxisId="secondary"
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </>
        )}
      </CardBody>
    </Card>
  );
}
