"use client";

import type { DietPlan } from "@/types/database";

import { useEffect, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import NextLink from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Restaurant01Icon } from "@hugeicons/core-free-icons";

import { getDietPlans } from "@/lib/actions/diet";
import DietPlanCard from "@/components/diet/diet-plan-card";
import { containerVariants, itemVariants } from "@/lib/motion";

type DietDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

type StatusFilter = "all" | "active" | "completed" | "paused";

const filterOptions: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "paused", label: "Paused" },
];

export function DietDrawer({ isOpen, onClose }: DietDrawerProps) {
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    if (!isOpen) return;

    async function load() {
      setLoading(true);
      const result = await getDietPlans();

      if (result.data) {
        setPlans(result.data);
      }
      setLoading(false);
    }
    load();
  }, [isOpen]);

  const filteredPlans =
    filter === "all" ? plans : plans.filter((p) => p.status === filter);

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="5xl" onClose={onClose}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center justify-between">
              <span className="text-lg font-semibold text-foreground">
                Diet Plans
              </span>
              <Button
                as={NextLink}
                className="cursor-pointer"
                color="primary"
                href="/diet/create"
                size="sm"
                startContent={
                  <HugeiconsIcon
                    color="currentColor"
                    icon={Add01Icon}
                    size={16}
                    strokeWidth={2}
                  />
                }
                onPress={onClose}
              >
                Create New
              </Button>
            </ModalHeader>

            <ModalBody className="px-6 pb-8">
              {/* Status filter */}
              <div className="flex flex-wrap gap-2 pt-2">
                {filterOptions.map((opt) => (
                  <button
                    key={opt.key}
                    className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                      filter === opt.key
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                        : "bg-default-100 text-default-600 hover:bg-default-200"
                    }`}
                    onClick={() => setFilter(opt.key)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Spinner label="Loading diet plans..." size="lg" />
                </div>
              ) : filteredPlans.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-default-200 bg-default-50/50 py-12">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <HugeiconsIcon
                      className="text-primary"
                      color="currentColor"
                      icon={Restaurant01Icon}
                      size={28}
                      strokeWidth={1.5}
                    />
                  </div>

                  <h2 className="mb-1 text-lg font-semibold text-foreground">
                    {filter !== "all"
                      ? `No ${filter} plans found`
                      : "No diet plans yet"}
                  </h2>
                  <p className="mb-5 max-w-sm text-center text-sm text-default-500">
                    {filter !== "all"
                      ? "Try a different filter."
                      : "Create a personalized 7-day meal plan based on your profile."}
                  </p>
                  {filter === "all" && (
                    <Button
                      as={NextLink}
                      className="cursor-pointer"
                      color="primary"
                      href="/diet/create"
                      size="md"
                      startContent={
                        <HugeiconsIcon
                          color="currentColor"
                          icon={Add01Icon}
                          size={16}
                          strokeWidth={2}
                        />
                      }
                      variant="shadow"
                      onPress={onClose}
                    >
                      Create Your First Plan
                    </Button>
                  )}
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={filter}
                    animate="show"
                    className="grid gap-3 pt-2 sm:grid-cols-2"
                    exit={{ opacity: 0, y: 10 }}
                    initial="hidden"
                    variants={containerVariants}
                  >
                    {filteredPlans.map((plan) => (
                      <motion.div key={plan.id} variants={itemVariants}>
                        <div className="cursor-pointer">
                          <DietPlanCard plan={plan} />
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              )}
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
