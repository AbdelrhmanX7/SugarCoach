"use client";

import type { FamilyMemberWithProfile } from "@/lib/actions/profile";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";
import NextLink from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  UserGroupIcon,
  UserAdd01Icon,
  Add01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";

import {
  getFamilyMembers,
  addFamilyMember,
  removeFamilyMember,
} from "@/lib/actions/profile";
import FamilyMemberCard from "@/components/profile/family-member-card";
import {
  PageTransition,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/page-transition";

const RELATIONSHIPS = [
  { key: "Parent", label: "Parent" },
  { key: "Child", label: "Child" },
  { key: "Sibling", label: "Sibling" },
  { key: "Spouse", label: "Spouse" },
  { key: "Caregiver", label: "Caregiver" },
];

const PERMISSIONS = [
  { key: "view", label: "View" },
  { key: "edit", label: "Edit" },
];

export default function FamilyPage() {
  const [members, setMembers] = useState<FamilyMemberWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Add member form state
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("");
  const [permission, setPermission] = useState("");

  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    const result = await getFamilyMembers();

    if (result.error) {
      setFeedback({ type: "error", message: result.error });
    } else {
      setMembers(result.data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleAddMember = async () => {
    if (!email.trim()) {
      showFeedback("error", "Please enter an email address");

      return;
    }
    if (!relationship) {
      showFeedback("error", "Please select a relationship");

      return;
    }
    if (!permission) {
      showFeedback("error", "Please select a permission level");

      return;
    }

    setIsAdding(true);
    setAddSuccess(false);
    const result = await addFamilyMember(
      email.trim(),
      relationship,
      permission as "view" | "edit",
    );

    if (result.error) {
      showFeedback("error", result.error);
    } else {
      showFeedback("success", "Family member added successfully");
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 2000);
      setEmail("");
      setRelationship("");
      setPermission("");
      await loadMembers();
    }
    setIsAdding(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    const result = await removeFamilyMember(memberId);

    if (result.error) {
      showFeedback("error", result.error);
    } else {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      showFeedback("success", "Family member removed");
    }
  };

  return (
    <PageTransition className="mx-auto max-w-2xl space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
        initial={{ opacity: 0, y: -16 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      >
        <NextLink href="/profile">
          <motion.div
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-divider bg-content1 transition-colors hover:bg-content2"
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.95 }}
          >
            <HugeiconsIcon
              color="currentColor"
              icon={ArrowLeft01Icon}
              size={18}
              strokeWidth={2}
            />
          </motion.div>
        </NextLink>
        <div>
          <h1 className="text-2xl font-bold">Family Members</h1>
          <p className="text-sm text-default-400">
            Share your progress with family
          </p>
        </div>
      </motion.div>

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

      {/* Add member form - expandable */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="border border-divider">
          <CardHeader
            className="cursor-pointer select-none"
            onClick={() => setIsFormOpen(!isFormOpen)}
          >
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                <HugeiconsIcon
                  className="text-primary"
                  color="currentColor"
                  icon={UserAdd01Icon}
                  size={20}
                  strokeWidth={2}
                />
                <h2 className="text-xl font-semibold">Add Family Member</h2>
              </div>
              <motion.div
                animate={{ rotate: isFormOpen ? 45 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <HugeiconsIcon
                  className="text-default-400"
                  color="currentColor"
                  icon={Add01Icon}
                  size={20}
                  strokeWidth={2}
                />
              </motion.div>
            </div>
          </CardHeader>

          <AnimatePresence>
            {isFormOpen && (
              <motion.div
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                initial={{ height: 0, opacity: 0 }}
                style={{ overflow: "hidden" }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <CardBody className="gap-4 pt-0">
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    initial={{ opacity: 0, y: 10 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Input
                      label="Email"
                      placeholder="Enter family member's email"
                      type="email"
                      value={email}
                      onValueChange={setEmail}
                    />
                  </motion.div>

                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    initial={{ opacity: 0, y: 10 }}
                    transition={{ delay: 0.15 }}
                  >
                    <Select
                      label="Relationship"
                      placeholder="Select relationship"
                      selectedKeys={relationship ? [relationship] : []}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0];

                        if (selected) setRelationship(selected as string);
                      }}
                    >
                      {RELATIONSHIPS.map((rel) => (
                        <SelectItem key={rel.key}>{rel.label}</SelectItem>
                      ))}
                    </Select>
                  </motion.div>

                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    initial={{ opacity: 0, y: 10 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Select
                      label="Permission"
                      placeholder="Select permission level"
                      selectedKeys={permission ? [permission] : []}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0];

                        if (selected) setPermission(selected as string);
                      }}
                    >
                      {PERMISSIONS.map((perm) => (
                        <SelectItem key={perm.key}>{perm.label}</SelectItem>
                      ))}
                    </Select>
                  </motion.div>

                  <motion.div
                    animate={{ opacity: 1 }}
                    initial={{ opacity: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <Button
                      className={`w-full font-semibold transition-all ${
                        addSuccess
                          ? "bg-success text-white"
                          : "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
                      }`}
                      isLoading={isAdding}
                      onPress={handleAddMember}
                    >
                      <AnimatePresence mode="wait">
                        {addSuccess ? (
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
                            Added!
                          </motion.span>
                        ) : (
                          <motion.span
                            key="add"
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            initial={{ opacity: 0 }}
                          >
                            Add Member
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Button>
                  </motion.div>
                </CardBody>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* Members list */}
      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Spinner label="Loading family members..." size="lg" />
        </div>
      ) : members.length === 0 ? (
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          initial={{ opacity: 0, scale: 0.95 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Card className="border border-dashed border-default-300">
            <CardBody className="flex flex-col items-center gap-4 py-12">
              <motion.div
                animate={{
                  y: [0, -6, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <HugeiconsIcon
                  className="text-secondary/50"
                  color="currentColor"
                  icon={UserGroupIcon}
                  size={48}
                  strokeWidth={1.5}
                />
              </motion.div>
              <div className="text-center">
                <p className="text-lg font-semibold">No family members yet</p>
                <p className="mt-1 max-w-xs text-sm text-default-400">
                  Add family members to share your progress and let them keep
                  track of your health journey!
                </p>
              </div>
              {!isFormOpen && (
                <Button
                  className="mt-2 bg-gradient-to-r from-primary to-secondary text-white"
                  size="sm"
                  onPress={() => setIsFormOpen(true)}
                >
                  Add Your First Member
                </Button>
              )}
            </CardBody>
          </Card>
        </motion.div>
      ) : (
        <StaggerContainer className="space-y-3" delay={0.1}>
          <AnimatePresence>
            {members.map((member) => (
              <StaggerItem key={member.id}>
                <FamilyMemberCard
                  avatarUrl={member.member_profile?.avatar_url ?? null}
                  displayName={
                    member.member_profile?.display_name ?? "Unknown User"
                  }
                  id={member.id}
                  permission={member.permission}
                  relationship={member.relationship}
                  onRemove={handleRemoveMember}
                />
              </StaggerItem>
            ))}
          </AnimatePresence>
        </StaggerContainer>
      )}
    </PageTransition>
  );
}
