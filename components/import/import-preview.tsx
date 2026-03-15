"use client";

import { useMemo } from "react";
import { Button } from "@heroui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";
import { Chip } from "@heroui/chip";
import { motion } from "framer-motion";

import { NormalizedReading } from "@/lib/import/normalize";

interface ImportPreviewProps {
  readings: NormalizedReading[];
  source: string;
  onConfirm: () => void;
  isImporting: boolean;
}

const sourceLabels: Record<string, string> = {
  libre: "FreeStyle Libre",
  dexcom: "Dexcom",
  mysugr: "MySugr",
};

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

export function ImportPreview({
  readings,
  source,
  onConfirm,
  isImporting,
}: ImportPreviewProps) {
  const stats = useMemo(() => {
    if (readings.length === 0) return null;

    const values = readings.map((r) => r.value);
    const timestamps = readings.map((r) => new Date(r.timestamp).getTime());
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const dateStart = new Date(Math.min(...timestamps));
    const dateEnd = new Date(Math.max(...timestamps));

    return {
      total: readings.length,
      average: avg,
      min,
      max,
      dateStart,
      dateEnd,
      unit: readings[0].unit,
    };
  }, [readings]);

  const previewReadings = readings.slice(0, 20);

  if (!stats) return null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTimestamp = (iso: string) => {
    const date = new Date(iso);

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary stats - stagger in */}
      <motion.div
        animate="show"
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
        initial="hidden"
        variants={containerVariants}
      >
        <motion.div
          className="rounded-xl border border-default-100 bg-content2 p-4"
          variants={itemVariants}
        >
          <p className="text-xs text-default-500">Total Records</p>
          <p className="text-2xl font-bold text-foreground">
            {stats.total.toLocaleString()}
          </p>
        </motion.div>
        <motion.div
          className="rounded-xl border border-default-100 bg-content2 p-4"
          variants={itemVariants}
        >
          <p className="text-xs text-default-500">Date Range</p>
          <p className="text-sm font-semibold text-foreground">
            {formatDate(stats.dateStart)} - {formatDate(stats.dateEnd)}
          </p>
        </motion.div>
        <motion.div
          className="rounded-xl border border-default-100 bg-content2 p-4"
          variants={itemVariants}
        >
          <p className="text-xs text-default-500">Avg Glucose</p>
          <p className="text-2xl font-bold text-foreground">
            {stats.average.toFixed(1)}{" "}
            <span className="text-sm font-normal text-default-400">
              {stats.unit}
            </span>
          </p>
        </motion.div>
        <motion.div
          className="rounded-xl border border-default-100 bg-content2 p-4"
          variants={itemVariants}
        >
          <p className="text-xs text-default-500">Range</p>
          <p className="text-sm font-semibold text-foreground">
            {stats.min} - {stats.max} {stats.unit}
          </p>
        </motion.div>
      </motion.div>

      {/* Source badge */}
      <motion.div
        animate={{ opacity: 1 }}
        className="flex items-center gap-2"
        initial={{ opacity: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Chip color="primary" size="sm" variant="flat">
          {sourceLabels[source] || source}
        </Chip>
        <span className="text-sm text-default-500">
          Showing first {previewReadings.length} of {stats.total} readings
        </span>
      </motion.div>

      {/* Preview table - slide in from bottom */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 250, damping: 22, delay: 0.2 }}
      >
        <Table
          aria-label="Import preview"
          classNames={{
            wrapper: "max-h-[400px]",
          }}
        >
          <TableHeader>
            <TableColumn>TIMESTAMP</TableColumn>
            <TableColumn>VALUE</TableColumn>
            <TableColumn>UNIT</TableColumn>
          </TableHeader>
          <TableBody>
            {previewReadings.map((reading, index) => (
              <TableRow key={`${reading.timestamp}-${index}`}>
                <TableCell>{formatTimestamp(reading.timestamp)}</TableCell>
                <TableCell>
                  <span
                    className={
                      reading.unit === "mg/dL"
                        ? reading.value < 70
                          ? "font-semibold text-danger"
                          : reading.value > 180
                            ? "font-semibold text-warning"
                            : "text-success"
                        : reading.value < 3.9
                          ? "font-semibold text-danger"
                          : reading.value > 10.0
                            ? "font-semibold text-warning"
                            : "text-success"
                    }
                  >
                    {reading.value}
                  </span>
                </TableCell>
                <TableCell>{reading.unit}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>

      {/* Confirm button with gradient + glow */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.4 }}
      >
        <motion.div
          animate={
            isImporting
              ? {
                  scale: [1, 1.02, 1],
                }
              : {}
          }
          transition={
            isImporting
              ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
              : undefined
          }
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Button
            className="bg-gradient-to-r from-primary to-primary-400 font-semibold shadow-lg shadow-primary/25"
            color="primary"
            isLoading={isImporting}
            size="lg"
            onPress={onConfirm}
          >
            {isImporting
              ? "Importing..."
              : `Import ${stats.total.toLocaleString()} Readings`}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
