"use client";

import type { Achievement } from "@/types/database";

import { Card, CardBody } from "@heroui/card";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { LockIcon } from "@hugeicons/core-free-icons";

export type AchievementBadgeProps = {
  achievement: Achievement;
  earned: boolean;
  earnedAt?: string;
};

export function AchievementBadge({
  achievement,
  earned,
  earnedAt,
}: AchievementBadgeProps) {
  return (
    <motion.div
      animate={{ scale: 1, opacity: 1 }}
      initial={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      whileHover={{ scale: 1.05 }}
    >
      <Card
        className={`border transition-shadow ${
          earned
            ? "border-warning/40 shadow-md shadow-warning/10"
            : "border-divider opacity-70"
        }`}
      >
        <CardBody className="flex flex-row items-center gap-3 p-3">
          {/* Icon container */}
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
            <span className={`text-3xl ${earned ? "" : "grayscale"}`}>
              {achievement.icon}
            </span>

            {/* Lock overlay for unearned */}
            {!earned && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-default-100/60">
                <HugeiconsIcon
                  color="currentColor"
                  icon={LockIcon}
                  size={16}
                  strokeWidth={2}
                />
              </div>
            )}

            {/* Golden glow for earned */}
            {earned && (
              <motion.div
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                }}
                className="absolute inset-0 rounded-lg bg-warning/10"
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
          </div>

          {/* Text content */}
          <div className="min-w-0 flex-1">
            <h4
              className={`text-sm font-semibold ${
                earned ? "text-foreground" : "text-default-400"
              }`}
            >
              {achievement.name}
            </h4>
            <p className="text-xs text-default-400">
              {achievement.description}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`text-[10px] font-medium ${
                  earned ? "text-warning" : "text-default-300"
                }`}
              >
                +{achievement.xp_reward} XP
              </span>
              {earned && earnedAt && (
                <span className="text-[10px] text-default-300">
                  {new Date(earnedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
}
