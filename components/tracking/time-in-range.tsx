"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Card, CardBody, CardHeader } from "@heroui/card";

export type TimeInRangeProps = {
  inRange: number;
  aboveRange: number;
  belowRange: number;
};

const COLORS = {
  inRange: "#22c55e",
  aboveRange: "#f97316",
  belowRange: "#ef4444",
};

export function TimeInRangeChart({
  inRange,
  aboveRange,
  belowRange,
}: TimeInRangeProps) {
  const total = inRange + aboveRange + belowRange;
  const hasData = total > 0;

  const chartData = hasData
    ? [
        { name: "In Range", value: inRange, color: COLORS.inRange },
        { name: "Above Range", value: aboveRange, color: COLORS.aboveRange },
        { name: "Below Range", value: belowRange, color: COLORS.belowRange },
      ].filter((d) => d.value > 0)
    : [{ name: "No Data", value: 100, color: "#404040" }];

  const inRangePct = hasData ? Math.round(inRange) : 0;

  return (
    <Card className="border border-divider bg-content1">
      <CardHeader className="pb-0">
        <h3 className="text-lg font-semibold text-foreground">Time in Range</h3>
      </CardHeader>
      <CardBody className="flex flex-col items-center pt-2">
        <div className="relative h-48 w-48">
          <ResponsiveContainer height="100%" width="100%">
            <PieChart>
              <Pie
                cx="50%"
                cy="50%"
                data={chartData}
                dataKey="value"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={hasData ? 2 : 0}
                strokeWidth={0}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`text-3xl font-bold ${
                !hasData
                  ? "text-default-400"
                  : inRangePct >= 70
                    ? "text-success"
                    : inRangePct >= 50
                      ? "text-warning"
                      : "text-danger"
              }`}
            >
              {hasData ? `${inRangePct}%` : "--"}
            </span>
            <span className="text-xs text-default-400">in range</span>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-2 flex flex-wrap justify-center gap-4">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: COLORS.inRange }}
            />
            <span className="text-xs text-default-500">
              In Range {hasData ? `${Math.round(inRange)}%` : ""}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: COLORS.aboveRange }}
            />
            <span className="text-xs text-default-500">
              Above {hasData ? `${Math.round(aboveRange)}%` : ""}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: COLORS.belowRange }}
            />
            <span className="text-xs text-default-500">
              Below {hasData ? `${Math.round(belowRange)}%` : ""}
            </span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
