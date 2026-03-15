"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon, AlertCircleIcon } from "@hugeicons/core-free-icons";
import { motion, AnimatePresence } from "framer-motion";

import { FileUploader } from "@/components/import/file-uploader";
import { ImportPreview } from "@/components/import/import-preview";
import { parseDexcomCSV } from "@/lib/import/dexcom";
import { parseLibreCSV } from "@/lib/import/libre";
import { parseMySugrCSV, parseMySugrExcel } from "@/lib/import/mysugr";
import { NormalizedReading, normalizeReadings } from "@/lib/import/normalize";
import { createClient } from "@/lib/supabase/client";
import { CGMImport } from "@/types/database";

type Source = "libre" | "dexcom" | "mysugr";

interface ImportResult {
  recordsImported: number;
  dateRange: { start: string; end: string };
  importId: string;
}

const sources: {
  id: Source;
  name: string;
  description: string;
  icon: string;
  accept: string;
  brandColor: string;
  brandGlow: string;
  brandBg: string;
  brandBorder: string;
}[] = [
  {
    id: "libre",
    name: "FreeStyle Libre",
    description: "Import from FreeStyle Libre CGM exports",
    icon: "L",
    accept: ".csv",
    brandColor: "from-blue-500 to-blue-700",
    brandGlow: "shadow-blue-500/30",
    brandBg: "bg-blue-500/10",
    brandBorder: "border-blue-500",
  },
  {
    id: "dexcom",
    name: "Dexcom",
    description: "Import from Dexcom Clarity exports",
    icon: "D",
    accept: ".csv",
    brandColor: "from-green-500 to-emerald-700",
    brandGlow: "shadow-green-500/30",
    brandBg: "bg-green-500/10",
    brandBorder: "border-green-500",
  },
  {
    id: "mysugr",
    name: "MySugr",
    description: "Import from MySugr app exports",
    icon: "M",
    accept: ".csv,.xlsx",
    brandColor: "from-orange-500 to-amber-600",
    brandGlow: "shadow-orange-500/30",
    brandBg: "bg-orange-500/10",
    brandBorder: "border-orange-500",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

const historyItemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

/* Simple confetti particle component */
function ConfettiParticle({ delay, color }: { delay: number; color: string }) {
  return (
    <motion.div
      animate={{
        opacity: [1, 1, 0],
        x: (Math.random() - 0.5) * 200,
        y: [0, -60 - Math.random() * 80, 40 + Math.random() * 60],
        scale: [1, 1.2, 0.5],
        rotate: Math.random() * 720,
      }}
      className={`absolute h-2 w-2 rounded-full ${color}`}
      initial={{
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
      }}
      transition={{
        duration: 1.5,
        delay,
        ease: "easeOut",
      }}
    />
  );
}

const CONFETTI_COLORS = [
  "bg-green-400",
  "bg-blue-400",
  "bg-yellow-400",
  "bg-pink-400",
  "bg-purple-400",
  "bg-cyan-400",
];

export default function ImportPage() {
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedReadings, setParsedReadings] = useState<NormalizedReading[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importHistory, setImportHistory] = useState<CGMImport[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Load import history
  useEffect(() => {
    async function loadHistory() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("cgm_imports")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);

        if (data) {
          setImportHistory(data as CGMImport[]);
        }
      } catch {
        // Silently fail for history loading
      } finally {
        setIsLoadingHistory(false);
      }
    }

    loadHistory();
  }, [importResult]);

  // Parse file when selected
  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      if (!selectedSource) return;

      setFile(selectedFile);
      setParsedReadings([]);
      setParseError(null);
      setImportResult(null);
      setIsParsing(true);

      try {
        let readings: NormalizedReading[] = [];

        if (selectedSource === "libre") {
          const text = await selectedFile.text();

          readings = parseLibreCSV(text);
        } else if (selectedSource === "dexcom") {
          const text = await selectedFile.text();

          readings = parseDexcomCSV(text);
        } else if (selectedSource === "mysugr") {
          const isExcel =
            selectedFile.name.endsWith(".xlsx") ||
            selectedFile.name.endsWith(".xls");

          if (isExcel) {
            const buffer = await selectedFile.arrayBuffer();
            const result = parseMySugrExcel(buffer);

            readings = result.readings;
          } else {
            const text = await selectedFile.text();
            const result = parseMySugrCSV(text);

            readings = result.readings;
          }
        }

        const normalized = normalizeReadings(readings);

        if (normalized.length === 0) {
          setParseError(
            "No valid readings found in the file. Please check the file format.",
          );
        } else {
          setParsedReadings(normalized);
        }
      } catch (err) {
        setParseError(
          err instanceof Error ? err.message : "Failed to parse file",
        );
      } finally {
        setIsParsing(false);
      }
    },
    [selectedSource],
  );

  // Confirm import
  const handleConfirmImport = useCallback(async () => {
    if (!file || !selectedSource) return;

    setIsImporting(true);

    try {
      const formData = new FormData();

      formData.append("file", file);
      formData.append("source", selectedSource);

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Import failed");
      }

      setImportResult(data as ImportResult);
      setParsedReadings([]);
      setFile(null);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setIsImporting(false);
    }
  }, [file, selectedSource]);

  // Reset to start over
  const handleReset = useCallback(() => {
    setSelectedSource(null);
    setFile(null);
    setParsedReadings([]);
    setParseError(null);
    setImportResult(null);
  }, []);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (iso: string) => {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Page header */}
      <motion.div
        animate={{ opacity: 1, x: 0 }}
        initial={{ opacity: 0, x: -30 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Import Your Data</h1>
        <p className="mt-1 text-default-500">
          Import blood sugar readings from your CGM device or tracking app.
        </p>
      </motion.div>

      {/* Success message with confetti */}
      <AnimatePresence>
        {importResult && (
          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            initial={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
          >
            <Card className="relative overflow-hidden border-success bg-success/10">
              {/* Confetti particles */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                {Array.from({ length: 18 }).map((_, i) => (
                  <ConfettiParticle
                    key={i}
                    color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]}
                    delay={i * 0.05}
                  />
                ))}
              </div>

              <CardBody className="relative p-6">
                <motion.div
                  animate="show"
                  className="flex items-start gap-4"
                  initial="hidden"
                  variants={containerVariants}
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-success/20"
                    transition={{
                      duration: 0.6,
                      delay: 0.3,
                    }}
                    variants={itemVariants}
                  >
                    <span className="text-success">
                      <HugeiconsIcon
                        color="currentColor"
                        icon={Tick02Icon}
                        size={24}
                        strokeWidth={2}
                      />
                    </span>
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <h3 className="text-lg font-semibold text-foreground">
                      Import Successful!
                    </h3>
                    <motion.div
                      animate="show"
                      className="mt-2 flex flex-wrap gap-3"
                      initial="hidden"
                      variants={containerVariants}
                    >
                      <motion.div
                        className="rounded-lg bg-success/10 px-3 py-1.5"
                        variants={itemVariants}
                      >
                        <span className="text-lg font-bold text-success">
                          {importResult.recordsImported.toLocaleString()}
                        </span>
                        <span className="ml-1 text-xs text-default-500">
                          readings imported
                        </span>
                      </motion.div>
                      <motion.div
                        className="rounded-lg bg-primary/10 px-3 py-1.5"
                        variants={itemVariants}
                      >
                        <span className="text-xs text-default-500">
                          {formatDate(importResult.dateRange.start)} -{" "}
                          {formatDate(importResult.dateRange.end)}
                        </span>
                      </motion.div>
                    </motion.div>
                    <motion.div className="mt-4" variants={itemVariants}>
                      <Button
                        color="success"
                        size="sm"
                        variant="flat"
                        onPress={handleReset}
                      >
                        Import More Data
                      </Button>
                    </motion.div>
                  </motion.div>
                </motion.div>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step 1: Select source */}
      {!importResult && (
        <>
          <div>
            <motion.h2
              animate={{ opacity: 1 }}
              className="mb-4 text-lg font-semibold text-foreground"
              initial={{ opacity: 0 }}
            >
              {selectedSource ? "1. Source Selected" : "1. Select Your Source"}
            </motion.h2>
            <motion.div
              animate="show"
              className="grid grid-cols-1 gap-4 sm:grid-cols-3"
              initial="hidden"
              variants={containerVariants}
            >
              {sources.map((src) => {
                const isSelected = selectedSource === src.id;

                return (
                  <motion.div
                    key={src.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Card
                      isPressable
                      className={`relative overflow-hidden transition-all duration-300 ${
                        isSelected
                          ? `border-2 ${src.brandBorder} shadow-lg ${src.brandGlow}`
                          : "border-2 border-transparent hover:border-default-300"
                      }`}
                      onPress={() => {
                        setSelectedSource(src.id);
                        setFile(null);
                        setParsedReadings([]);
                        setParseError(null);
                      }}
                    >
                      <CardBody className="p-5">
                        {/* Large icon/logo area with gradient */}
                        <div
                          className={`mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${src.brandColor} text-2xl font-bold text-white shadow-md`}
                        >
                          {src.icon}
                        </div>
                        <p className="text-base font-semibold text-foreground">
                          {src.name}
                        </p>
                        <p className="mt-1 text-xs text-default-500">
                          {src.description}
                        </p>

                        {/* Selected checkmark badge */}
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              animate={{ scale: 1, opacity: 1 }}
                              className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary"
                              exit={{ scale: 0, opacity: 0 }}
                              initial={{ scale: 0, opacity: 0 }}
                              transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 20,
                              }}
                            >
                              <HugeiconsIcon
                                color="white"
                                icon={Tick02Icon}
                                size={14}
                                strokeWidth={2.5}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardBody>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Step 2: Upload file - animate in when source selected */}
          <AnimatePresence>
            {selectedSource && (
              <motion.div
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                initial={{ opacity: 0, y: -20, height: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  2. Upload Your File
                </h2>
                <FileUploader
                  accept={
                    sources.find((s) => s.id === selectedSource)?.accept ||
                    ".csv"
                  }
                  onFileSelect={handleFileSelect}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Parsing indicator */}
          <AnimatePresence>
            {isParsing && (
              <motion.div
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-3 py-8"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
              >
                <Spinner size="md" />
                <p className="text-default-500">Parsing your file...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Parse error */}
          <AnimatePresence>
            {parseError && (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                initial={{ opacity: 0, y: -10 }}
              >
                <Card className="border-danger bg-danger/10">
                  <CardBody className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 shrink-0 text-danger">
                        <HugeiconsIcon
                          color="currentColor"
                          icon={AlertCircleIcon}
                          size={20}
                          strokeWidth={2}
                        />
                      </span>
                      <div>
                        <p className="font-medium text-danger">Error</p>
                        <p className="mt-1 text-sm text-danger/80">
                          {parseError}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 3: Preview & confirm */}
          <AnimatePresence>
            {parsedReadings.length > 0 && selectedSource && (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                initial={{ opacity: 0, y: 30 }}
                transition={{ type: "spring", stiffness: 250, damping: 22 }}
              >
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  3. Review & Import
                </h2>
                <ImportPreview
                  isImporting={isImporting}
                  readings={parsedReadings}
                  source={selectedSource}
                  onConfirm={handleConfirmImport}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Import history */}
      <motion.div
        animate={{ opacity: 1 }}
        initial={{ opacity: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Import History
        </h2>
        {isLoadingHistory ? (
          <div className="flex justify-center py-8">
            <Spinner size="md" />
          </div>
        ) : importHistory.length === 0 ? (
          <motion.div animate={{ opacity: 1 }} initial={{ opacity: 0 }}>
            <Card>
              <CardBody className="p-8 text-center">
                <p className="text-default-400">
                  No imports yet. Upload your first file above.
                </p>
              </CardBody>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            animate="show"
            className="space-y-3"
            initial="hidden"
            variants={containerVariants}
          >
            {importHistory.map((imp) => {
              const src = sources.find((s) => s.id === imp.source);

              return (
                <motion.div key={imp.id} variants={historyItemVariants}>
                  <Card className="transition-shadow hover:shadow-md">
                    <CardBody className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-sm font-bold text-white ${
                              src?.brandColor ||
                              "from-default-400 to-default-600"
                            }`}
                          >
                            {imp.source === "libre"
                              ? "L"
                              : imp.source === "dexcom"
                                ? "D"
                                : "M"}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {imp.file_name}
                            </p>
                            <p className="text-xs text-default-500">
                              {formatDateTime(imp.created_at)}
                              {imp.date_range_start && imp.date_range_end && (
                                <span>
                                  {" "}
                                  &middot; {formatDate(
                                    imp.date_range_start,
                                  )} - {formatDate(imp.date_range_end)}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {imp.records_imported > 0 && (
                            <span className="text-sm text-default-500">
                              {imp.records_imported.toLocaleString()} records
                            </span>
                          )}
                          <Chip
                            color={
                              imp.status === "completed"
                                ? "success"
                                : imp.status === "failed"
                                  ? "danger"
                                  : imp.status === "processing"
                                    ? "warning"
                                    : "default"
                            }
                            size="sm"
                            variant="flat"
                          >
                            {imp.status}
                          </Chip>
                        </div>
                      </div>
                      {imp.error_message && (
                        <p className="mt-2 text-xs text-danger">
                          {imp.error_message}
                        </p>
                      )}
                    </CardBody>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
