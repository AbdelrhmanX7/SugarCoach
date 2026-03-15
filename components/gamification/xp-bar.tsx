"use client";

import { motion } from "framer-motion";

import { xpForNextLevel } from "@/lib/gamification/constants";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export type XPBarProps = {
  xp: number;
  level: number;
};

export function XPBar({ xp, level }: XPBarProps) {
  // Calculate progress within the current level
  const currentLevelThreshold = level <= 1 ? 0 : xpForNextLevel(level - 1);
  const nextLevelThreshold = xpForNextLevel(level);
  const xpInLevel = xp - currentLevelThreshold;
  const xpNeeded = nextLevelThreshold - currentLevelThreshold;
  const progress =
    xpNeeded > 0 ? Math.min((xpInLevel / xpNeeded) * 100, 100) : 0;

  return (
    <div className="flex items-center gap-2">
      {/* Level badge */}
      <motion.div
        animate={{ scale: 1 }}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-xs font-bold text-white shadow-sm shadow-purple-500/30"
        initial={{ scale: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        {level}
      </motion.div>

      {/* Progress bar container */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium text-default-500">
            Lv.{level}
          </span>
          <span className="text-[10px] tabular-nums text-default-400">
            <AnimatedCounter duration={800} value={xpInLevel} />/{xpNeeded} XP
          </span>
        </div>

        {/* Progress bar track */}
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-default-200/50">
          <motion.div
            animate={{ width: `${progress}%` }}
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
            initial={{ width: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          {/* Shimmer effect on the fill */}
          <motion.div
            animate={{ width: `${progress}%` }}
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ width: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}
