"use client";

import type { AchievementWithStatus } from "@/lib/actions/gamification";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Avatar } from "@heroui/avatar";
import { Tooltip } from "@heroui/tooltip";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiChat02Icon,
  Award01Icon,
  ChartLineData01Icon,
  FavouriteIcon,
  FireIcon,
  Home01Icon,
  Logout02Icon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";

import { StreakSheet } from "@/components/gamification/streak-sheet";
import { xpForNextLevel } from "@/lib/gamification/constants";
import {
  getGamificationStatus,
  getUserAchievements,
} from "@/lib/actions/gamification";
import { createClient } from "@/lib/supabase/client";

interface NavItem {
  href: string;
  label: string;
  color: string;
  bgActive: string;
  borderActive: string;
  glowActive: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    href: "/home",
    label: "Home",
    color: "text-emerald-400",
    bgActive: "bg-emerald-500/15",
    borderActive: "border-emerald-500/30",
    glowActive: "shadow-emerald-500/10",
    icon: (
      <HugeiconsIcon
        color="currentColor"
        icon={Home01Icon}
        size={20}
        strokeWidth={1.8}
      />
    ),
  },
  {
    href: "/chat",
    label: "Chat",
    color: "text-violet-400",
    bgActive: "bg-violet-500/15",
    borderActive: "border-violet-500/30",
    glowActive: "shadow-violet-500/10",
    icon: (
      <HugeiconsIcon
        color="currentColor"
        icon={AiChat02Icon}
        size={20}
        strokeWidth={1.8}
      />
    ),
  },
  {
    href: "/tracking",
    label: "Tracking",
    color: "text-blue-400",
    bgActive: "bg-blue-500/15",
    borderActive: "border-blue-500/30",
    glowActive: "shadow-blue-500/10",
    icon: (
      <HugeiconsIcon
        color="currentColor"
        icon={ChartLineData01Icon}
        size={20}
        strokeWidth={1.8}
      />
    ),
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [streakSheetOpen, setStreakSheetOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [gamification, setGamification] = useState({
    xp: 0,
    level: 1,
    currentStreak: 0,
    bestStreak: 0,
  });
  const [achievements, setAchievements] = useState<AchievementWithStatus[]>([]);

  useEffect(() => {
    getGamificationStatus().then((result) => {
      if (result.success && result.data) {
        setGamification({
          xp: result.data.xp,
          level: result.data.level,
          currentStreak: result.data.currentStreak,
          bestStreak: result.data.bestStreak,
        });
      }
    });

    getUserAchievements().then((result) => {
      if (result.success && result.data) {
        setAchievements(result.data);
      }
    });

    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", user.id)
          .single()
          .then(({ data }) => {
            if (data?.display_name) setDisplayName(data.display_name);
          });
      }
    });
  }, [pathname]);

  const handleLogout = async () => {
    const supabase = createClient();

    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const isNavActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            animate={{ opacity: 1 }}
            aria-label="Close sidebar"
            className="fixed inset-0 z-40 bg-foreground/10 backdrop-blur-sm lg:hidden"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            role="button"
            tabIndex={0}
            onClick={() => setSidebarOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSidebarOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar (desktop + mobile drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-background backdrop-blur-xl transition-transform duration-300 ease-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="sidebar-accent-strip absolute inset-y-0 left-0 w-[3px]" />
        <div className="absolute inset-y-0 right-0 w-px bg-divider" />

        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
            <HugeiconsIcon color="white" icon={FavouriteIcon} size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">SugarCoach</h1>
            <p className="text-[10px] text-default-400">AI Diabetes Buddy</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="mt-2 flex-1 overflow-y-auto px-3">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = isNavActive(item.href);

              return (
                <NextLink
                  key={item.href}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? `${item.bgActive} border ${item.borderActive} ${item.color} shadow-sm ${item.glowActive}`
                      : "border border-transparent text-default-500 hover:bg-default-100 hover:text-default-700"
                  }`}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span
                    className={`transition-transform duration-200 ${
                      isActive ? item.color : "text-default-500"
                    } ${isActive ? "scale-110" : ""}`}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                  {isActive && (
                    <motion.div
                      className="ml-auto h-2 w-2 rounded-full bg-current"
                      layoutId="nav-indicator"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                </NextLink>
              );
            })}
          </div>

          {/* Sidebar streak card */}
          <div className="mt-6">
            <button
              className="group w-full rounded-xl border border-warning/20 bg-warning-50 p-3 text-left transition-all duration-200 hover:border-warning/40 hover:shadow-lg hover:shadow-warning/10"
              onClick={() => setStreakSheetOpen(true)}
            >
              <div className="flex items-center gap-3">
                <HugeiconsIcon
                  className="text-warning"
                  color="currentColor"
                  icon={FireIcon}
                  size={22}
                  strokeWidth={1.8}
                />
                <div>
                  <p className="text-lg font-bold text-warning">
                    {gamification.currentStreak}
                    <span className="ml-1 text-xs font-normal text-default-400">
                      day streak
                    </span>
                  </p>
                  <p className="text-[10px] text-default-400">
                    Best: {gamification.bestStreak}d
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <HugeiconsIcon
                  className="text-default-400"
                  color="currentColor"
                  icon={Award01Icon}
                  size={14}
                />
                <span className="text-[10px] text-default-400 transition-colors group-hover:text-default-300">
                  Tap to view achievements
                </span>
              </div>
            </button>
          </div>
        </nav>

        {/* User section */}
        <div className="border-t border-divider p-3">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2">
            <NextLink
              className="flex flex-1 items-center gap-3 transition-colors hover:opacity-80"
              href="/profile"
              onClick={() => setSidebarOpen(false)}
            >
              <Avatar
                className="h-8 w-8 shrink-0"
                color="secondary"
                name={displayName || "U"}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {displayName || "User"}
                </p>
                <p className="text-[10px] text-default-400">
                  Level {gamification.level}
                </p>
              </div>
            </NextLink>
            <Tooltip content="Sign out">
              <Button
                isIconOnly
                aria-label="Sign out"
                className="shrink-0 text-default-400 hover:text-danger"
                size="sm"
                variant="light"
                onPress={handleLogout}
              >
                <HugeiconsIcon
                  color="currentColor"
                  icon={Logout02Icon}
                  size={16}
                />
              </Button>
            </Tooltip>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="dashboard-bg grid-pattern flex flex-1 flex-col overflow-hidden">
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 pb-24 lg:p-6 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav — Home | Chat | 🔥 Streak | Tracking */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-divider bg-background/97 backdrop-blur-xl lg:hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-divider" />

        <div className="relative flex items-end justify-around px-2 pb-1 pt-1">
          {/* Home */}
          {navItems.slice(0, 2).map((item) => {
            const isActive = isNavActive(item.href);

            return (
              <NextLink
                key={item.href}
                className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                  isActive ? item.color : "text-default-500"
                }`}
                href={item.href}
              >
                {isActive && (
                  <motion.div
                    className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-current"
                    layoutId="bottom-nav-indicator"
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}
                <span className={isActive ? "scale-110" : ""}>{item.icon}</span>
                {item.label}
              </NextLink>
            );
          })}

          {/* CENTER: Streak Button with XP ring */}
          <div className="flex flex-1 justify-center">
            {(() => {
              const currentLevelThreshold =
                gamification.level <= 1
                  ? 0
                  : xpForNextLevel(gamification.level - 1);
              const nextLevelThreshold = xpForNextLevel(gamification.level);
              const xpInLevel = gamification.xp - currentLevelThreshold;
              const xpNeeded = nextLevelThreshold - currentLevelThreshold;
              const progress =
                xpNeeded > 0 ? Math.min((xpInLevel / xpNeeded) * 100, 100) : 0;
              const circumference = 2 * Math.PI * 33;
              const strokeOffset =
                circumference - (progress / 100) * circumference;

              return (
                <button
                  className="relative -mt-6 flex h-[68px] w-[68px] items-center justify-center transition-transform active:scale-90"
                  onClick={() => setStreakSheetOpen(true)}
                >
                  {/* XP progress ring */}
                  <svg
                    className="absolute inset-0 -rotate-90"
                    viewBox="0 0 68 68"
                  >
                    {/* Track */}
                    <circle
                      cx="34"
                      cy="34"
                      fill="none"
                      r="33"
                      stroke="#E5E0D9"
                      strokeWidth="3"
                    />
                    {/* Progress */}
                    <motion.circle
                      animate={{ strokeDashoffset: strokeOffset }}
                      cx="34"
                      cy="34"
                      fill="none"
                      initial={{ strokeDashoffset: circumference }}
                      r="33"
                      stroke="#F5A623"
                      strokeDasharray={circumference}
                      strokeLinecap="round"
                      strokeWidth="3"
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </svg>

                  {/* Inner button */}
                  <div className="flex h-[56px] w-[56px] items-center justify-center rounded-full bg-warning shadow-lg shadow-warning/40">
                    <span className="text-lg font-bold leading-none text-white">
                      {gamification.currentStreak}
                    </span>
                  </div>
                </button>
              );
            })()}
          </div>

          {/* Tracking */}
          {(() => {
            const item = navItems[2];
            const isActive = isNavActive(item.href);

            return (
              <NextLink
                className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                  isActive ? item.color : "text-default-500"
                }`}
                href={item.href}
              >
                {isActive && (
                  <motion.div
                    className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-current"
                    layoutId="bottom-nav-indicator"
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}
                <span className={isActive ? "scale-110" : ""}>{item.icon}</span>
                {item.label}
              </NextLink>
            );
          })()}

          {/* Profile */}
          {(() => {
            const isActive = isNavActive("/profile");

            return (
              <NextLink
                className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                  isActive ? "text-pink-400" : "text-default-500"
                }`}
                href="/profile"
              >
                {isActive && (
                  <motion.div
                    className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-current"
                    layoutId="bottom-nav-indicator"
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}
                <span className={isActive ? "scale-110" : ""}>
                  <HugeiconsIcon
                    color="currentColor"
                    icon={Settings02Icon}
                    size={20}
                    strokeWidth={1.8}
                  />
                </span>
                Profile
              </NextLink>
            );
          })()}
        </div>
      </nav>

      {/* Streak Bottom Sheet */}
      <StreakSheet
        isOpen={streakSheetOpen}
        recentAchievements={achievements}
        status={gamification}
        onClose={() => setStreakSheetOpen(false)}
      />
    </div>
  );
}
