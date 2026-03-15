"use client";

import type { AchievementWithStatus } from "@/lib/actions/gamification";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
} from "@heroui/drawer";
import { Chip } from "@heroui/chip";
import NextLink from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  StarIcon,
  Award01Icon,
  FireIcon,
  ZapIcon,
} from "@hugeicons/core-free-icons";

import { xpForNextLevel } from "@/lib/gamification/constants";

type StreakSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  status: {
    xp: number;
    level: number;
    currentStreak: number;
    bestStreak: number;
  };
  recentAchievements?: AchievementWithStatus[];
};

export function StreakSheet({
  isOpen,
  onClose,
  status,
  recentAchievements,
}: StreakSheetProps) {
  const { xp, level, currentStreak, bestStreak } = status;

  const currentLevelThreshold = level <= 1 ? 0 : xpForNextLevel(level - 1);
  const nextLevelThreshold = xpForNextLevel(level);
  const xpInLevel = xp - currentLevelThreshold;
  const xpNeeded = nextLevelThreshold - currentLevelThreshold;
  const progressPercent =
    xpNeeded > 0 ? Math.min((xpInLevel / xpNeeded) * 100, 100) : 0;

  const earnedAchievements = (recentAchievements || [])
    .filter((a) => a.earned)
    .sort(
      (a, b) =>
        new Date(b.earned_at || 0).getTime() -
        new Date(a.earned_at || 0).getTime(),
    )
    .slice(0, 3);

  const earnedCount = (recentAchievements || []).filter((a) => a.earned).length;

  return (
    <Drawer isOpen={isOpen} placement="bottom" size="lg" onClose={onClose}>
      <DrawerContent className="rounded-t-3xl">
        <DrawerHeader className="flex flex-col items-center gap-1 pb-0">
          <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-default-300" />
          <span className="text-sm font-medium text-default-500">
            Your Progress
          </span>
        </DrawerHeader>

        <DrawerBody className="px-6 pb-8">
          {/* Streak + Level row */}
          <div className="mt-2 flex items-center justify-center gap-8">
            {/* Streak */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <HugeiconsIcon
                  className="text-warning"
                  color="currentColor"
                  icon={FireIcon}
                  size={24}
                  strokeWidth={1.8}
                />
                <span className="text-3xl font-bold text-warning">
                  {currentStreak}
                </span>
              </div>
              <span className="text-sm text-default-500">day streak</span>
              {bestStreak > 0 && (
                <span className="text-xs text-default-400">
                  Best: {bestStreak}d
                </span>
              )}
            </div>

            {/* Divider */}
            <div className="h-12 w-px bg-divider" />

            {/* Level */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <HugeiconsIcon
                  className="text-secondary"
                  color="currentColor"
                  icon={StarIcon}
                  size={24}
                  strokeWidth={1.8}
                />
                <span className="text-3xl font-bold text-foreground">
                  {level}
                </span>
              </div>
              <span className="text-sm text-default-500">level</span>
            </div>
          </div>

          {/* XP Progress bar */}
          <div className="mt-5 rounded-xl border border-default-200 bg-content1 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <HugeiconsIcon
                  className="text-warning"
                  color="currentColor"
                  icon={ZapIcon}
                  size={14}
                />
                <span className="text-xs font-semibold text-foreground">
                  {xp} XP total
                </span>
              </div>
              <span className="text-xs tabular-nums text-default-400">
                {xpInLevel} / {xpNeeded} to next level
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-default-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-warning to-primary transition-[width] duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center gap-1 rounded-xl border border-default-200 bg-content1 py-3">
              <HugeiconsIcon
                className="text-warning"
                color="currentColor"
                icon={ZapIcon}
                size={18}
              />
              <span className="text-lg font-bold text-foreground">{xp}</span>
              <span className="text-xs text-default-400">Total XP</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-xl border border-default-200 bg-content1 py-3">
              <HugeiconsIcon
                className="text-secondary"
                color="currentColor"
                icon={StarIcon}
                size={18}
              />
              <span className="text-lg font-bold text-foreground">{level}</span>
              <span className="text-xs text-default-400">Level</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-xl border border-default-200 bg-content1 py-3">
              <HugeiconsIcon
                className="text-primary"
                color="currentColor"
                icon={Award01Icon}
                size={18}
              />
              <span className="text-lg font-bold text-foreground">
                {earnedCount}
              </span>
              <span className="text-xs text-default-400">Badges</span>
            </div>
          </div>

          {/* Recent Achievements */}
          <div className="mt-5">
            <span className="text-sm font-semibold text-foreground">
              Recent Achievements
            </span>

            {earnedAchievements.length > 0 ? (
              <div className="mt-2 flex flex-col gap-2">
                {earnedAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-center gap-3 rounded-xl border border-default-200 bg-content1 px-3 py-2.5"
                  >
                    <span className="text-xl leading-none">
                      {achievement.icon}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium text-foreground">
                        {achievement.name}
                      </span>
                      <span className="text-xs text-default-400">
                        {achievement.earned_at
                          ? new Date(achievement.earned_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              },
                            )
                          : ""}
                      </span>
                    </div>
                    <Chip color="warning" size="sm" variant="flat">
                      +{achievement.xp_reward} XP
                    </Chip>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-2 flex items-center justify-center rounded-xl border border-default-200 py-6">
                <span className="text-sm text-default-400">
                  Start logging to earn badges!
                </span>
              </div>
            )}
          </div>

          {/* View All */}
          <div className="mt-5">
            <NextLink
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary/10 px-4 py-2.5 text-sm font-medium text-secondary transition-colors hover:bg-secondary/20"
              href="/achievements"
              onClick={onClose}
            >
              <HugeiconsIcon
                color="currentColor"
                icon={Award01Icon}
                size={18}
              />
              View All Achievements
            </NextLink>
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
