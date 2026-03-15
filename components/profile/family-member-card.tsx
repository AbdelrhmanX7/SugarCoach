"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Avatar } from "@heroui/avatar";
import { motion, AnimatePresence } from "framer-motion";

type FamilyMemberCardProps = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  relationship: string;
  permission: "view" | "edit";
  onRemove: (id: string) => Promise<void>;
};

const relationshipColors: Record<string, string> = {
  Parent: "ring-primary",
  Child: "ring-success",
  Sibling: "ring-secondary",
  Spouse: "ring-warning",
  Caregiver: "ring-danger",
};

const relationshipChipColors: Record<
  string,
  "primary" | "success" | "secondary" | "warning" | "danger" | "default"
> = {
  Parent: "primary",
  Child: "success",
  Sibling: "secondary",
  Spouse: "warning",
  Caregiver: "danger",
};

export default function FamilyMemberCard({
  id,
  displayName,
  avatarUrl,
  relationship,
  permission,
  onRemove,
}: FamilyMemberCardProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    if (!isConfirming) {
      setIsConfirming(true);

      return;
    }

    setIsRemoving(true);
    try {
      await onRemove(id);
    } finally {
      setIsRemoving(false);
      setIsConfirming(false);
    }
  };

  const handleCancel = () => {
    setIsConfirming(false);
  };

  const ringColor = relationshipColors[relationship] || "ring-default";
  const chipColor = relationshipChipColors[relationship] || "default";

  return (
    <motion.div
      layout
      exit={{ opacity: 0, x: -60, transition: { duration: 0.3 } }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <Card className="border border-divider transition-shadow hover:shadow-md">
        <CardBody className="flex flex-row items-center gap-4 p-4">
          <motion.div
            animate={{ scale: 1, opacity: 1 }}
            initial={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Avatar
              className={`shrink-0 ring-2 ${ringColor}`}
              name={displayName}
              size="lg"
              src={avatarUrl ?? undefined}
            />
          </motion.div>

          <motion.div
            animate={{ opacity: 1, x: 0 }}
            className="flex min-w-0 flex-1 flex-col gap-1.5"
            initial={{ opacity: 0, x: 10 }}
            transition={{ delay: 0.1 }}
          >
            <p className="truncate font-semibold">{displayName}</p>
            <div className="flex flex-wrap gap-2">
              <Chip color={chipColor} size="sm" variant="flat">
                {relationship}
              </Chip>
              <Chip
                color={permission === "edit" ? "warning" : "default"}
                size="sm"
                variant="flat"
              >
                {permission === "edit" ? "Can Edit" : "View Only"}
              </Chip>
            </div>
          </motion.div>

          <div className="flex shrink-0 items-center gap-2">
            <AnimatePresence mode="wait">
              {isConfirming ? (
                <motion.div
                  key="confirm"
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2"
                  exit={{ opacity: 0, x: 10 }}
                  initial={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    color="danger"
                    isLoading={isRemoving}
                    size="sm"
                    variant="solid"
                    onPress={handleRemove}
                  >
                    Confirm
                  </Button>
                  <Button size="sm" variant="flat" onPress={handleCancel}>
                    Cancel
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="remove"
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  initial={{ opacity: 0 }}
                >
                  <Button
                    color="danger"
                    size="sm"
                    variant="light"
                    onPress={handleRemove}
                  >
                    Remove
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
}
