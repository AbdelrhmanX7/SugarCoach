"use client";

import { useCallback, useRef, useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  CloudUploadIcon,
} from "@hugeicons/core-free-icons";
import { motion, AnimatePresence } from "framer-motion";

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  accept: string;
}

export function FileUploader({ onFileSelect, accept }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedExtensions = accept
    .split(",")
    .map((ext) => ext.trim().toLowerCase());

  const validateFile = useCallback(
    (file: File): boolean => {
      const fileName = file.name.toLowerCase();
      const isValid = acceptedExtensions.some((ext) => fileName.endsWith(ext));

      if (!isValid) {
        setError(`Invalid file type. Accepted: ${accept}`);

        return false;
      }

      // Max 50MB
      if (file.size > 50 * 1024 * 1024) {
        setError("File is too large. Maximum size is 50MB.");

        return false;
      }

      setError(null);

      return true;
    },
    [accept, acceptedExtensions],
  );

  const handleFile = useCallback(
    (file: File) => {
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [validateFile, onFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;

      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile],
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;

      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile],
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <motion.div
      animate={isDragging ? { scale: 1.02 } : { scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Card
        className={`overflow-hidden transition-colors duration-300 ${
          isDragging
            ? "border-primary bg-primary/5"
            : selectedFile
              ? "border-success bg-success/5"
              : "border-default-300 hover:border-primary/50"
        }`}
        style={{ border: "none" }}
      >
        <CardBody className="p-0">
          <div
            className="relative flex cursor-pointer flex-col items-center justify-center p-10"
            role="button"
            tabIndex={0}
            onClick={handleClick}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClick();
              }
            }}
          >
            {/* Animated dashed border using SVG */}
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              preserveAspectRatio="none"
            >
              <rect
                fill="none"
                height="calc(100% - 4px)"
                rx="12"
                ry="12"
                stroke={
                  isDragging
                    ? "hsl(var(--heroui-primary))"
                    : selectedFile
                      ? "hsl(var(--heroui-success))"
                      : "hsl(var(--heroui-default-300))"
                }
                strokeDasharray="8 6"
                strokeLinecap="round"
                strokeWidth="2"
                width="calc(100% - 4px)"
                x="2"
                y="2"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  dur="2s"
                  from="0"
                  repeatCount="indefinite"
                  to="28"
                />
              </rect>
            </svg>

            <input
              ref={fileInputRef}
              accept={accept}
              className="hidden"
              type="file"
              onChange={handleInputChange}
            />

            {/* Upload icon with animation */}
            <div className="mb-4">
              <AnimatePresence mode="wait">
                {selectedFile ? (
                  <motion.div
                    key="selected"
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    initial={{ scale: 0, rotate: -180 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                  >
                    <span className="text-success">
                      <HugeiconsIcon
                        color="currentColor"
                        icon={CheckmarkCircle02Icon}
                        size={52}
                        strokeWidth={1.5}
                      />
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="upload"
                    animate={{
                      scale: isDragging ? 1.15 : [1, 1.06, 1],
                    }}
                    transition={
                      isDragging
                        ? { type: "spring", stiffness: 300 }
                        : {
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }
                    }
                  >
                    <span
                      className={`transition-colors duration-300 ${isDragging ? "text-primary" : "text-default-400"}`}
                    >
                      <HugeiconsIcon
                        color="currentColor"
                        icon={CloudUploadIcon}
                        size={52}
                        strokeWidth={1.5}
                      />
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Text with smooth transitions */}
            <AnimatePresence mode="wait">
              {selectedFile ? (
                <motion.div
                  key="file-info"
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                  exit={{ opacity: 0, y: -10 }}
                  initial={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.25 }}
                >
                  <p className="text-sm font-medium text-foreground">
                    {selectedFile.name}
                  </p>
                  <p className="mt-1 text-xs text-default-500">
                    {formatFileSize(selectedFile.size)}
                  </p>
                  <p className="mt-2 text-xs text-default-400">
                    Click or drop to replace
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="upload-prompt"
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                  exit={{ opacity: 0, y: -10 }}
                  initial={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.25 }}
                >
                  <p className="text-sm font-medium text-foreground">
                    {isDragging ? "Drop it here!" : "Drop your file here"}
                  </p>
                  <p className="mt-1 text-xs text-default-500">
                    or click to browse
                  </p>
                  <p className="mt-2 text-xs text-default-400">
                    Accepts {accept} files (max 50MB)
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.p
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 text-xs text-danger"
                  exit={{ opacity: 0 }}
                  initial={{ opacity: 0, y: 5 }}
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
}
