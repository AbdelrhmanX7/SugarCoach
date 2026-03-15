"use client";

import type { DietPlan } from "@/types/database";

import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const STATUS_COLORS: Record<
  DietPlan["status"],
  "success" | "warning" | "primary" | "default"
> = {
  active: "success",
  paused: "warning",
  completed: "primary",
  draft: "default",
};

const STATUS_LABELS: Record<DietPlan["status"], string> = {
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  draft: "Draft",
};

const STATUS_GRADIENT_BORDER: Record<DietPlan["status"], string> = {
  active: "from-green-400 to-emerald-600",
  paused: "from-amber-400 to-orange-500",
  completed: "from-blue-400 to-indigo-600",
  draft: "from-default-300 to-default-500",
};

const STATUS_GLOW: Record<DietPlan["status"], string> = {
  active: "hover:shadow-green-500/20",
  paused: "hover:shadow-amber-500/20",
  completed: "hover:shadow-blue-500/20",
  draft: "hover:shadow-default-500/10",
};

interface DietPlanCardProps {
  plan: DietPlan;
}

export default function DietPlanCard({ plan }: DietPlanCardProps) {
  const router = useRouter();

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "--";

    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  return (
    <motion.div
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        isPressable
        className={`w-full overflow-hidden transition-shadow duration-300 hover:shadow-xl ${STATUS_GLOW[plan.status]}`}
        onPress={() => router.push(`/diet/${plan.id}`)}
      >
        <CardBody className="relative gap-3 p-0">
          {/* Gradient left border */}
          <div
            className={`absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b ${STATUS_GRADIENT_BORDER[plan.status]}`}
          />

          <div className="flex flex-col gap-3 py-4 pl-5 pr-4">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold text-foreground">
                  {plan.name}
                </h3>
                {(plan.start_date || plan.end_date) && (
                  <p className="text-sm text-default-500">
                    {formatDate(plan.start_date)} - {formatDate(plan.end_date)}
                  </p>
                )}
              </div>
              <Chip color={STATUS_COLORS[plan.status]} size="sm" variant="flat">
                {STATUS_LABELS[plan.status]}
              </Chip>
            </div>

            {/* Key stats - prominent display */}
            <div className="flex flex-wrap gap-4">
              {plan.target_daily_carbs != null && (
                <div className="flex items-baseline gap-1.5 rounded-lg bg-warning/10 px-3 py-1.5">
                  <span className="text-xl font-bold text-warning">
                    {plan.target_daily_carbs}g
                  </span>
                  <span className="text-xs text-default-400">carbs/day</span>
                </div>
              )}
              {plan.target_daily_calories != null && (
                <div className="flex items-baseline gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5">
                  <span className="text-xl font-bold text-primary">
                    {plan.target_daily_calories}
                  </span>
                  <span className="text-xs text-default-400">kcal/day</span>
                </div>
              )}
            </div>

            {plan.dietary_restrictions &&
              plan.dietary_restrictions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {plan.dietary_restrictions.map((restriction) => (
                    <Chip
                      key={restriction}
                      color="secondary"
                      size="sm"
                      variant="bordered"
                    >
                      {restriction}
                    </Chip>
                  ))}
                </div>
              )}

            <p className="text-xs text-default-400">
              Created {new Date(plan.created_at).toLocaleDateString()}
            </p>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
}
