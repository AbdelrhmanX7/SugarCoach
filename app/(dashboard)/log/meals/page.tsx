"use client";

import { Link } from "@heroui/link";
import NextLink from "next/link";
import { motion } from "framer-motion";

import MealForm from "@/components/log/meal-form";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export default function MealsPage() {
  return (
    <motion.div
      animate="show"
      className="mx-auto max-w-2xl space-y-6"
      initial="hidden"
      variants={containerVariants}
    >
      {/* Breadcrumb */}
      <motion.div
        className="flex items-center gap-2 text-sm text-default-500"
        variants={itemVariants}
      >
        <Link
          as={NextLink}
          className="hover:text-foreground transition-colors"
          href="/log"
        >
          Quick Log
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Meal</span>
      </motion.div>

      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-foreground">Log a Meal</h1>
        <p className="mt-1 text-default-500">
          Tell us what you ate! You can snap a photo for instant AI nutrition
          analysis or enter the details yourself.
        </p>
      </motion.div>

      {/* Form */}
      <motion.div variants={itemVariants}>
        <MealForm />
      </motion.div>
    </motion.div>
  );
}
