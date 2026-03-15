"use client";

import type { ReactNode } from "react";

import { Card, CardBody } from "@heroui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUp01Icon,
  ArrowDown01Icon,
  MinusSignIcon,
} from "@hugeicons/core-free-icons";

export type TrendDirection = "up" | "down" | "stable";

export type StatCardProps = {
  icon: ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  trend?: TrendDirection;
  color?: "default" | "primary" | "success" | "warning" | "danger";
};

const colorMap: Record<string, string> = {
  default: "text-foreground",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

const bgColorMap: Record<string, string> = {
  default: "bg-default-100",
  primary: "bg-primary/10",
  success: "bg-success/10",
  warning: "bg-warning/10",
  danger: "bg-danger/10",
};

function TrendArrow({ direction }: { direction: TrendDirection }) {
  if (direction === "stable") {
    return (
      <span className="text-default-400">
        <HugeiconsIcon
          color="currentColor"
          icon={MinusSignIcon}
          size={16}
          strokeWidth={2}
        />
      </span>
    );
  }

  if (direction === "up") {
    return (
      <span className="text-danger">
        <HugeiconsIcon
          color="currentColor"
          icon={ArrowUp01Icon}
          size={16}
          strokeWidth={2}
        />
      </span>
    );
  }

  return (
    <span className="text-success">
      <HugeiconsIcon
        color="currentColor"
        icon={ArrowDown01Icon}
        size={16}
        strokeWidth={2}
      />
    </span>
  );
}

export function StatCard({
  icon,
  label,
  value,
  unit,
  trend,
  color = "default",
}: StatCardProps) {
  return (
    <Card className="border border-divider bg-content1">
      <CardBody className="flex flex-row items-center gap-4 p-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${bgColorMap[color]}`}
        >
          <span className={colorMap[color]}>{icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${colorMap[color]}`}>
              {value}
            </span>
            {unit && <span className="text-sm text-default-400">{unit}</span>}
            {trend && <TrendArrow direction={trend} />}
          </div>
          <p className="truncate text-sm text-default-500">{label}</p>
        </div>
      </CardBody>
    </Card>
  );
}
