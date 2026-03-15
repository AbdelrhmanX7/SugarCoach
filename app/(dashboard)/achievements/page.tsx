"use client";

import type {
  AchievementWithStatus,
  GamificationStatus,
} from "@/lib/actions/gamification";

import { useEffect, useState, useCallback } from "react";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { Spinner } from "@heroui/spinner";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Award01Icon,
  FireIcon,
  StarIcon,
  LockIcon,
  Target01Icon,
  SparklesIcon,
  Medal01Icon,
  ZapIcon,
} from "@hugeicons/core-free-icons";

import {
  getUserAchievements,
  getGamificationStatus,
} from "@/lib/actions/gamification";
import { xpForNextLevel } from "@/lib/gamification/constants";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  PageTransition,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/page-transition";

type CategoryFilter = "all" | "streak" | "logging" | "target" | "milestone";

const categoryConfig: Record<
  CategoryFilter,
  {
    label: string;
    icon: typeof Award01Icon;
    color: string;
    chipColor: "primary" | "success" | "warning" | "secondary" | "default";
  }
> = {
  all: {
    label: "All",
    icon: SparklesIcon,
    color: "text-foreground",
    chipColor: "default",
  },
  logging: {
    label: "Logging",
    icon: StarIcon,
    color: "text-primary",
    chipColor: "primary",
  },
  streak: {
    label: "Streak",
    icon: FireIcon,
    color: "text-warning",
    chipColor: "warning",
  },
  target: {
    label: "Target",
    icon: Target01Icon,
    color: "text-success",
    chipColor: "success",
  },
  milestone: {
    label: "Milestone",
    icon: Medal01Icon,
    color: "text-secondary",
    chipColor: "secondary",
  },
};

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<AchievementWithStatus[]>([]);
  const [status, setStatus] = useState<GamificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<CategoryFilter>("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [achResult, statusResult] = await Promise.all([
        getUserAchievements(),
        getGamificationStatus(),
      ]);

      if (achResult.success && achResult.data) {
        setAchievements(achResult.data);
      }
      if (statusResult.success && statusResult.data) {
        setStatus(statusResult.data);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to load achievements:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredAchievements =
    category === "all"
      ? achievements
      : achievements.filter((a) => a.category === category);

  const earnedCount = achievements.filter((a) => a.earned).length;
  const nextLevelXP = status ? xpForNextLevel(status.level) : 100;
  const currentXP = status?.xp || 0;
  const xpProgress = Math.min((currentXP / nextLevelXP) * 100, 100);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner label="Loading achievements..." size="lg" />
      </div>
    );
  }

  return (
    <PageTransition className="mx-auto max-w-5xl space-y-6 p-4">
      {/* Header */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: -20 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      >
        <h1 className="text-3xl font-bold">Your Achievements</h1>
        <p className="mt-1 text-sm text-default-400">
          Keep going, every log brings you closer to the next badge!
        </p>
      </motion.div>

      {/* Level & XP Summary */}
      {status && (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: -16 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 22,
            delay: 0.1,
          }}
        >
          <Card className="overflow-hidden border border-primary/20 bg-gradient-to-br from-primary-900/30 via-content1 to-secondary-900/30">
            <CardBody className="gap-5 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Level badge */}
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={{ scale: 1, rotate: 0 }}
                    className="relative flex h-20 w-20 items-center justify-center"
                    initial={{ scale: 0, rotate: -180 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 15,
                      delay: 0.3,
                    }}
                  >
                    {/* Rotating gradient ring */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      className="absolute inset-0 rounded-full"
                      style={{
                        background:
                          "conic-gradient(from 0deg, #f59e0b, #8b5cf6, #3b82f6, #10b981, #f59e0b)",
                        padding: "3px",
                      }}
                      transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-content1" />
                    </motion.div>
                    <span className="absolute text-3xl font-black text-primary">
                      {status.level}
                    </span>
                  </motion.div>
                  <div>
                    <p className="text-lg font-bold">Level {status.level}</p>
                    <p className="text-sm text-default-400">
                      <AnimatedCounter
                        className="font-semibold text-primary"
                        value={currentXP}
                      />{" "}
                      / {nextLevelXP} XP
                    </p>
                  </div>
                </div>

                {/* Streak with fire animation */}
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{
                      scale: [1, 1.15, 1],
                      rotate: [0, -5, 5, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <HugeiconsIcon
                      color="currentColor"
                      icon={FireIcon}
                      size={28}
                      strokeWidth={2}
                    />
                  </motion.div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-warning">
                      <AnimatedCounter value={status.currentStreak} />
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-default-500">
                      Day Streak
                    </p>
                  </div>
                </div>
              </div>

              {/* XP Progress bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-default-400">
                  <span>Progress to Level {status.level + 1}</span>
                  <span>{Math.round(xpProgress)}%</span>
                </div>
                <motion.div
                  animate={{ scaleX: 1 }}
                  initial={{ scaleX: 0 }}
                  style={{ originX: 0 }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                >
                  <Progress
                    aria-label="XP progress to next level"
                    className="w-full"
                    color="primary"
                    size="md"
                    value={xpProgress}
                  />
                </motion.div>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      )}

      {/* Stats bar */}
      <StaggerContainer className="grid grid-cols-3 gap-3" delay={0.2}>
        <StaggerItem>
          <Card className="border border-divider bg-content1">
            <CardBody className="items-center gap-1 p-4 text-center">
              <HugeiconsIcon
                className="text-secondary"
                color="currentColor"
                icon={Award01Icon}
                size={24}
                strokeWidth={2}
              />
              <AnimatedCounter
                className="text-2xl font-bold text-secondary"
                value={earnedCount}
              />
              <p className="text-[10px] uppercase tracking-wider text-default-500">
                Earned
              </p>
            </CardBody>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="border border-divider bg-content1">
            <CardBody className="items-center gap-1 p-4 text-center">
              <HugeiconsIcon
                className="text-warning"
                color="currentColor"
                icon={FireIcon}
                size={24}
                strokeWidth={2}
              />
              <AnimatedCounter
                className="text-2xl font-bold text-warning"
                value={status?.currentStreak || 0}
              />
              <p className="text-[10px] uppercase tracking-wider text-default-500">
                Streak
              </p>
            </CardBody>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="border border-divider bg-content1">
            <CardBody className="items-center gap-1 p-4 text-center">
              <HugeiconsIcon
                className="text-primary"
                color="currentColor"
                icon={ZapIcon}
                size={24}
                strokeWidth={2}
              />
              <AnimatedCounter
                className="text-2xl font-bold text-primary"
                value={status?.xp || 0}
              />
              <p className="text-[10px] uppercase tracking-wider text-default-500">
                Total XP
              </p>
            </CardBody>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {/* Category tabs - custom animated */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-1 overflow-x-auto rounded-xl border border-divider bg-content2/50 p-1"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        {(Object.keys(categoryConfig) as CategoryFilter[]).map((cat) => {
          const config = categoryConfig[cat];
          const isActive = category === cat;

          return (
            <button
              key={cat}
              className={`relative flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "text-foreground"
                  : "text-default-400 hover:text-default-600"
              }`}
              onClick={() => setCategory(cat)}
            >
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-lg bg-content1 shadow-sm"
                  layoutId="achievement-tab"
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}
              <span className={`relative z-10 ${isActive ? config.color : ""}`}>
                <HugeiconsIcon
                  color="currentColor"
                  icon={config.icon}
                  size={16}
                  strokeWidth={2}
                />
              </span>
              <span className="relative z-10">{config.label}</span>
            </button>
          );
        })}
      </motion.div>

      {/* Achievement Grid */}
      <AnimatePresence mode="wait">
        {filteredAchievements.length === 0 ? (
          <motion.div
            key="empty"
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            initial={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border border-dashed border-default-300">
              <CardBody className="flex flex-col items-center gap-4 py-16">
                <motion.div
                  animate={{
                    y: [0, -8, 0],
                    rotate: [0, -5, 5, 0],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <HugeiconsIcon
                    className="text-warning/60"
                    color="currentColor"
                    icon={Award01Icon}
                    size={56}
                    strokeWidth={1.5}
                  />
                </motion.div>
                <div className="text-center">
                  <p className="text-lg font-semibold">
                    No achievements here yet
                  </p>
                  <p className="mt-1 max-w-xs text-sm text-default-400">
                    Start logging your meals, blood sugar, and insulin to earn
                    your first badges!
                  </p>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key={category}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAchievements.map((achievement) => (
                <StaggerItem key={achievement.id}>
                  <AchievementCard achievement={achievement} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}

function AchievementCard({
  achievement,
}: {
  achievement: AchievementWithStatus;
}) {
  const earned = achievement.earned;
  const config =
    categoryConfig[achievement.category as CategoryFilter] ||
    categoryConfig.all;

  return (
    <motion.div
      className="h-full"
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card
        className={`h-full border transition-all duration-300 ${
          earned
            ? "border-warning/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
            : "border-divider opacity-60 grayscale"
        }`}
        style={
          earned
            ? {
                boxShadow:
                  "0 0 24px rgba(245, 158, 11, 0.12), 0 0 8px rgba(245, 158, 11, 0.08)",
              }
            : undefined
        }
      >
        <CardBody className="flex flex-col items-center gap-3 p-5 text-center">
          {/* Icon area */}
          <div className="relative">
            {earned ? (
              <motion.div
                animate={{ scale: 1 }}
                initial={{ scale: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 15,
                  delay: 0.1,
                }}
              >
                <span className="text-5xl">{achievement.icon}</span>
              </motion.div>
            ) : (
              <div className="relative">
                <span className="text-5xl grayscale">{achievement.icon}</span>
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-default-100/50">
                  <HugeiconsIcon
                    className="text-default-400"
                    color="currentColor"
                    icon={LockIcon}
                    size={24}
                    strokeWidth={2}
                  />
                </div>
              </div>
            )}

            {/* Sparkle effect for earned */}
            {earned && (
              <motion.div
                animate={{
                  opacity: [0, 0.8, 0],
                  scale: [0.8, 1.2, 0.8],
                }}
                className="pointer-events-none absolute -right-1 -top-1"
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: Math.random() * 2,
                }}
              >
                <HugeiconsIcon
                  className="text-warning"
                  color="currentColor"
                  icon={SparklesIcon}
                  size={16}
                  strokeWidth={2}
                />
              </motion.div>
            )}
          </div>

          {/* Name & description */}
          <div>
            <p className="text-sm font-bold">{achievement.name}</p>
            <p className="mt-0.5 text-xs text-default-400">
              {achievement.description}
            </p>
          </div>

          {/* Category + XP badge */}
          <div className="flex items-center gap-2">
            <Chip color={config.chipColor} size="sm" variant="flat">
              {achievement.category}
            </Chip>
            <Chip
              className={earned ? "bg-warning/15 text-warning" : ""}
              color={earned ? "warning" : "default"}
              size="sm"
              variant="flat"
            >
              +{achievement.xp_reward} XP
            </Chip>
          </div>

          {/* Earned date or progress hint */}
          {earned && achievement.earned_at && (
            <p className="text-[11px] text-success">
              Earned{" "}
              {new Date(achievement.earned_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
          {!earned && (
            <p className="text-[11px] italic text-default-400">
              {getProgressHint(achievement)}
            </p>
          )}
        </CardBody>
      </Card>
    </motion.div>
  );
}

function getProgressHint(achievement: AchievementWithStatus): string {
  const criteria = achievement.criteria as Record<string, unknown>;

  switch (criteria.type) {
    case "total_logs":
      return `Log ${criteria.count} total entries to unlock`;
    case "streak":
      return `Maintain a ${criteria.days}-day streak to unlock`;
    case "food_photos":
      return `Analyze ${criteria.count} food photos to unlock`;
    case "cgm_import":
      return "Import CGM data to unlock";
    case "diet_plan":
      return "Create a diet plan to unlock";
    case "daily_meals":
      return `Log ${criteria.count} meals in one day to unlock`;
    case "full_day_in_range":
      return "Keep all readings in range for a full day";
    case "a1c_improved":
      return "Improve your A1C to unlock";
    default:
      return "Keep going to unlock this achievement!";
  }
}
