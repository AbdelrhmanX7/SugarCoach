"use client";

import type { Profile } from "@/types/database";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Avatar } from "@heroui/avatar";
import { Spinner } from "@heroui/spinner";
import { Chip } from "@heroui/chip";
import NextLink from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserCircleIcon,
  ArrowRight01Icon,
  UserGroupIcon,
  CheckmarkCircle02Icon,
  StarIcon,
} from "@hugeicons/core-free-icons";

import {
  getProfile,
  updateProfile,
  updateDiabetesSettings,
} from "@/lib/actions/profile";
import DiabetesSettings from "@/components/profile/diabetes-settings";
import {
  PageTransition,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/page-transition";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Personal info form state
  const [displayName, setDisplayName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    const result = await getProfile();

    if (result.error) {
      setFeedback({ type: "error", message: result.error });
    } else if (result.data) {
      setProfile(result.data);
      setDisplayName(result.data.display_name ?? "");
      setDateOfBirth(result.data.date_of_birth ?? "");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSavePersonalInfo = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    const result = await updateProfile({
      display_name: displayName,
      date_of_birth: dateOfBirth || null,
    });

    if (result.error) {
      showFeedback("error", result.error);
    } else if (result.data) {
      setProfile(result.data);
      showFeedback("success", "Personal information updated successfully");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
    setIsSaving(false);
  };

  const handleSaveDiabetesSettings = async (data: Partial<Profile>) => {
    const result = await updateDiabetesSettings(data);

    if (result.error) {
      showFeedback("error", result.error);
    } else if (result.data) {
      setProfile(result.data);
      showFeedback("success", "Diabetes settings updated successfully");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner label="Loading profile..." size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-default-500">
          Unable to load profile. Please try again.
        </p>
      </div>
    );
  }

  return (
    <PageTransition className="mx-auto max-w-2xl space-y-6 pb-20 lg:pb-6">
      {/* Feedback banner */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-lg px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "bg-success/10 text-success"
                : "bg-danger/10 text-danger"
            }`}
            exit={{ opacity: 0, y: -10 }}
            initial={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {feedback.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile header card */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: -20 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
      >
        <Card className="overflow-hidden border border-primary/20 bg-gradient-to-br from-primary-900/20 via-content1 to-secondary-900/20">
          <CardBody className="flex flex-col items-center gap-4 p-8">
            {/* Avatar with rotating gradient ring */}
            <motion.div
              animate={{ scale: 1 }}
              className="relative"
              initial={{ scale: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.2,
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                className="absolute -inset-1.5 rounded-full"
                style={{
                  background:
                    "conic-gradient(from 0deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b, #3b82f6)",
                  padding: "3px",
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <div className="h-full w-full rounded-full bg-content1" />
              </motion.div>
              <Avatar
                className="relative z-10 h-24 w-24"
                name={displayName}
                src={profile.avatar_url ?? undefined}
              />
            </motion.div>

            {/* Name and level */}
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
              initial={{ opacity: 0, y: 10 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-2xl font-bold">
                  {displayName || "Your Profile"}
                </h1>
                <Chip
                  className="bg-primary/15 text-primary"
                  size="sm"
                  startContent={
                    <HugeiconsIcon
                      color="currentColor"
                      icon={StarIcon}
                      size={12}
                      strokeWidth={2}
                    />
                  }
                  variant="flat"
                >
                  Lvl {profile.level}
                </Chip>
              </div>
              <p className="mt-1 text-sm text-default-400">
                Member since{" "}
                {new Date(profile.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </motion.div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Personal Info */}
      <StaggerContainer className="space-y-6" delay={0.2}>
        <StaggerItem>
          <Card className="border border-divider backdrop-blur-sm">
            <CardHeader className="flex items-center gap-2 pb-2">
              <HugeiconsIcon
                className="text-primary"
                color="currentColor"
                icon={UserCircleIcon}
                size={20}
                strokeWidth={2}
              />
              <h2 className="text-xl font-semibold">Personal Information</h2>
            </CardHeader>
            <CardBody className="gap-5">
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                initial={{ opacity: 0, x: -10 }}
                transition={{ delay: 0.4 }}
              >
                <Input
                  label="Display Name"
                  placeholder="Your name"
                  value={displayName}
                  onValueChange={setDisplayName}
                />
              </motion.div>

              <motion.div
                animate={{ opacity: 1, x: 0 }}
                initial={{ opacity: 0, x: -10 }}
                transition={{ delay: 0.5 }}
              >
                <Input
                  label="Date of Birth"
                  placeholder="YYYY-MM-DD"
                  type="date"
                  value={dateOfBirth}
                  onValueChange={setDateOfBirth}
                />
              </motion.div>

              <motion.div
                animate={{ opacity: 1 }}
                initial={{ opacity: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Button
                  className={`w-full font-semibold transition-all ${
                    saveSuccess
                      ? "bg-success text-white"
                      : "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
                  }`}
                  isLoading={isSaving}
                  onPress={handleSavePersonalInfo}
                >
                  <AnimatePresence mode="wait">
                    {saveSuccess ? (
                      <motion.span
                        key="success"
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-2"
                        exit={{ opacity: 0 }}
                        initial={{ opacity: 0, scale: 0.5 }}
                      >
                        <HugeiconsIcon
                          color="currentColor"
                          icon={CheckmarkCircle02Icon}
                          size={18}
                          strokeWidth={2}
                        />
                        Saved!
                      </motion.span>
                    ) : (
                      <motion.span
                        key="save"
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        initial={{ opacity: 0 }}
                      >
                        Save Personal Info
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            </CardBody>
          </Card>
        </StaggerItem>

        {/* Diabetes Settings */}
        <StaggerItem>
          <DiabetesSettings
            profile={profile}
            onSave={handleSaveDiabetesSettings}
          />
        </StaggerItem>

        {/* Family link card */}
        <StaggerItem>
          <NextLink href="/profile/family">
            <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
              <Card className="cursor-pointer border border-divider transition-colors hover:border-primary/30">
                <CardBody className="flex flex-row items-center gap-4 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/10">
                    <HugeiconsIcon
                      className="text-secondary"
                      color="currentColor"
                      icon={UserGroupIcon}
                      size={24}
                      strokeWidth={2}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">Family Members</p>
                    <p className="text-sm text-default-400">
                      Manage who can view or edit your data
                    </p>
                  </div>
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <HugeiconsIcon
                      className="text-default-400"
                      color="currentColor"
                      icon={ArrowRight01Icon}
                      size={20}
                      strokeWidth={2}
                    />
                  </motion.div>
                </CardBody>
              </Card>
            </motion.div>
          </NextLink>
        </StaggerItem>
      </StaggerContainer>
    </PageTransition>
  );
}
