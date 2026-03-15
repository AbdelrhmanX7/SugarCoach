"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Bread01Icon,
  DropletIcon,
  InjectionIcon,
  Target01Icon,
} from "@hugeicons/core-free-icons";

import { StatCard } from "@/components/ui/stat-card";

export type WeeklySummaryData = {
  avgBG: number | null;
  timeInRangePct: number | null;
  hypoCount: number;
  hyperCount: number;
  totalInsulin: number | null;
  avgCarbs: number | null;
};

export type WeeklySummaryProps = {
  data: WeeklySummaryData;
  title?: string;
};

function getTimeInRangeColor(
  pct: number | null,
): "success" | "warning" | "danger" {
  if (pct == null) return "warning";
  if (pct >= 70) return "success";
  if (pct >= 50) return "warning";

  return "danger";
}

function getAvgBGColor(avg: number | null): "success" | "warning" | "danger" {
  if (avg == null) return "warning";
  if (avg >= 70 && avg <= 180) return "success";
  if (avg >= 54 && avg <= 250) return "warning";

  return "danger";
}

export function WeeklySummaryCard({
  data,
  title = "Summary",
}: WeeklySummaryProps) {
  return (
    <Card className="border border-divider bg-content1">
      <CardHeader className="pb-2">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </CardHeader>
      <CardBody className="pt-0">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <StatCard
            color={getAvgBGColor(data.avgBG)}
            icon={
              <HugeiconsIcon
                color="currentColor"
                icon={DropletIcon}
                size={22}
                strokeWidth={1.8}
              />
            }
            label="Avg Blood Sugar"
            unit="mg/dL"
            value={data.avgBG != null ? data.avgBG : "--"}
          />
          <StatCard
            color={getTimeInRangeColor(data.timeInRangePct)}
            icon={
              <HugeiconsIcon
                color="currentColor"
                icon={Target01Icon}
                size={22}
                strokeWidth={1.8}
              />
            }
            label="Time in Range"
            unit="%"
            value={
              data.timeInRangePct != null ? `${data.timeInRangePct}` : "--"
            }
          />
          <StatCard
            color={
              data.hypoCount > 3
                ? "danger"
                : data.hypoCount > 0
                  ? "warning"
                  : "success"
            }
            icon={
              <HugeiconsIcon
                color="currentColor"
                icon={ArrowDown01Icon}
                size={22}
                strokeWidth={1.8}
              />
            }
            label="Low Events"
            value={data.hypoCount}
          />
          <StatCard
            color={
              data.hyperCount > 5
                ? "danger"
                : data.hyperCount > 0
                  ? "warning"
                  : "success"
            }
            icon={
              <HugeiconsIcon
                color="currentColor"
                icon={ArrowUp01Icon}
                size={22}
                strokeWidth={1.8}
              />
            }
            label="High Events"
            value={data.hyperCount}
          />
          <StatCard
            color="primary"
            icon={
              <HugeiconsIcon
                color="currentColor"
                icon={InjectionIcon}
                size={22}
                strokeWidth={1.8}
              />
            }
            label="Total Insulin"
            unit="units"
            value={data.totalInsulin != null ? data.totalInsulin : "--"}
          />
          <StatCard
            color="default"
            icon={
              <HugeiconsIcon
                color="currentColor"
                icon={Bread01Icon}
                size={22}
                strokeWidth={1.8}
              />
            }
            label="Avg Carbs/Day"
            unit="g"
            value={data.avgCarbs != null ? data.avgCarbs : "--"}
          />
        </div>
      </CardBody>
    </Card>
  );
}
