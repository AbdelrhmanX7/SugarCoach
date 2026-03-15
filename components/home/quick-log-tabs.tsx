"use client";

import { useState } from "react";
import { Tabs, Tab } from "@heroui/tabs";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DropletIcon,
  InjectionIcon,
  Restaurant01Icon,
} from "@hugeicons/core-free-icons";
import { motion, AnimatePresence } from "framer-motion";

import BloodSugarForm from "@/components/log/blood-sugar-form";
import InsulinForm from "@/components/log/insulin-form";
import MealForm from "@/components/log/meal-form";

const tabs = [
  {
    key: "blood-sugar",
    label: "Blood Sugar",
    icon: DropletIcon,
    color: "text-rose-400",
  },
  {
    key: "insulin",
    label: "Insulin",
    icon: InjectionIcon,
    color: "text-blue-400",
  },
  {
    key: "meal",
    label: "Meal",
    icon: Restaurant01Icon,
    color: "text-emerald-400",
  },
];

export function QuickLogTabs() {
  const [activeTab, setActiveTab] = useState("blood-sugar");

  return (
    <div>
      <Tabs
        fullWidth
        aria-label="Quick log options"
        classNames={{
          tabList:
            "gap-2 w-full rounded-xl bg-content2/50 border border-divider p-1",
          tab: "h-10 rounded-lg",
          cursor: "rounded-lg bg-primary shadow-sm",
          tabContent:
            "group-data-[selected=true]:text-primary-foreground text-default-500 font-medium text-sm",
        }}
        selectedKey={activeTab}
        variant="solid"
        onSelectionChange={(key) => setActiveTab(key as string)}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.key}
            title={
              <div className="flex items-center gap-1.5">
                <HugeiconsIcon
                  color="currentColor"
                  icon={tab.icon}
                  size={16}
                  strokeWidth={1.8}
                />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(" ").pop()}</span>
              </div>
            }
          />
        ))}
      </Tabs>

      <div className="mt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            initial={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "blood-sugar" && <BloodSugarForm compact />}
            {activeTab === "insulin" && <InsulinForm compact />}
            {activeTab === "meal" && <MealForm compact />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
