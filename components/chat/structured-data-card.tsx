"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Input } from "@heroui/input";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DropletIcon,
  InjectionIcon,
  Note01Icon,
  Restaurant01Icon,
} from "@hugeicons/core-free-icons";

import {
  markChatDataSaved,
  saveChatBloodSugar,
  saveChatInsulin,
  saveChatMeal,
} from "@/lib/actions/chat-log";

interface StructuredDataCardProps {
  data: Record<string, unknown>;
  messageId: string;
  onSaved: () => void;
}

export function StructuredDataCard({
  data,
  messageId,
  onSaved,
}: StructuredDataCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<Record<string, unknown>>(data);

  const dataType = (editedData.type as string) || "unknown";

  const handleFieldChange = (field: string, value: string | number) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      let success = false;

      if (dataType === "blood_sugar") {
        const result = await saveChatBloodSugar({
          value: Number(editedData.value) || 0,
          unit: (editedData.unit as string) || "mg/dL",
          reading_time:
            (editedData.reading_time as string) || new Date().toISOString(),
          context: (editedData.context as string) || null,
          notes: (editedData.notes as string) || null,
        });

        success = result.success;
      } else if (dataType === "insulin") {
        const result = await saveChatInsulin({
          units: Number(editedData.units) || 0,
          insulin_type: (editedData.insulin_type as string) || "rapid",
          insulin_brand: (editedData.insulin_brand as string) || null,
          method: (editedData.method as string) || "pen",
          injection_time:
            (editedData.injection_time as string) || new Date().toISOString(),
          meal_log_id: (editedData.meal_log_id as string) || null,
          notes: (editedData.notes as string) || null,
        });

        success = result.success;
      } else if (dataType === "meal") {
        const items =
          (editedData.items as Array<Record<string, unknown>>) || [];

        const result = await saveChatMeal({
          meal_type: (editedData.meal_type as string) || null,
          description: (editedData.description as string) || null,
          total_carbs:
            editedData.total_carbs != null
              ? Number(editedData.total_carbs)
              : null,
          total_calories:
            editedData.total_calories != null
              ? Number(editedData.total_calories)
              : null,
          total_protein:
            editedData.total_protein != null
              ? Number(editedData.total_protein)
              : null,
          total_fat:
            editedData.total_fat != null ? Number(editedData.total_fat) : null,
          total_sugar:
            editedData.total_sugar != null
              ? Number(editedData.total_sugar)
              : null,
          total_fiber:
            editedData.total_fiber != null
              ? Number(editedData.total_fiber)
              : null,
          image_url: (editedData.image_url as string) || null,
          meal_time:
            (editedData.meal_time as string) ||
            (editedData.time as string) ||
            new Date().toISOString(),
          recommended_insulin:
            editedData.recommended_insulin != null
              ? Number(editedData.recommended_insulin)
              : null,
          notes: (editedData.notes as string) || null,
          items: items.map((item) => ({
            name: (item.name as string) || "",
            quantity: Number(item.quantity) || null,
            unit: (item.unit as string) || null,
            carbs: Number(item.carbs) || null,
            calories: Number(item.calories) || null,
            protein: Number(item.protein) || null,
            fat: Number(item.fat) || null,
            sugar: Number(item.sugar) || null,
            fiber: Number(item.fiber) || null,
          })),
        });

        success = result.success;
      }

      if (!success) {
        setSaveError("Failed to save. Please try again.");

        return;
      }

      await markChatDataSaved(messageId);
      setIsSaved(true);
      onSaved();
    } finally {
      setIsSaving(false);
    }
  };

  if (isSaved) {
    return (
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 rounded-xl bg-success-50 px-4 py-3 dark:bg-success-50/10"
        initial={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
      >
        <motion.svg
          animate={{ pathLength: 1 }}
          className="h-5 w-5 text-success"
          fill="none"
          initial={{ pathLength: 0 }}
          stroke="currentColor"
          strokeWidth={2.5}
          transition={{ delay: 0.1, duration: 0.4 }}
          viewBox="0 0 24 24"
        >
          <motion.path
            d="M5 13l4 4L19 7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
        <span className="text-sm font-medium text-success">
          Data saved successfully!
        </span>
      </motion.div>
    );
  }

  return (
    <Card className="w-full max-w-sm border border-default-200 shadow-sm">
      <CardHeader className="flex items-center gap-2 pb-2">
        <DataTypeIcon type={dataType} />
        <h4 className="text-sm font-semibold capitalize">
          {dataType.replace("_", " ")} Data
        </h4>
        <Chip className="ml-auto" color="warning" size="sm" variant="flat">
          Review
        </Chip>
      </CardHeader>

      <Divider />

      <CardBody className="gap-3 py-3">
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="edit"
              animate={{ opacity: 1 }}
              className="flex flex-col gap-2"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
            >
              <EditableFields
                data={editedData}
                type={dataType}
                onChange={handleFieldChange}
              />
            </motion.div>
          ) : (
            <motion.div
              key="view"
              animate={{ opacity: 1 }}
              className="flex flex-col gap-1.5"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
            >
              <ReadOnlyFields data={editedData} type={dataType} />
            </motion.div>
          )}
        </AnimatePresence>
      </CardBody>

      <Divider />

      <CardFooter className="flex-col items-stretch gap-2 pt-2">
        {saveError && <p className="text-xs text-danger">{saveError}</p>}
        <div className="flex gap-2">
          <Button
            color="primary"
            isLoading={isSaving}
            size="sm"
            variant="solid"
            onPress={handleSave}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button
            size="sm"
            variant="flat"
            onPress={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Done" : "Edit"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

function DataTypeIcon({ type }: { type: string }) {
  if (type === "blood_sugar") {
    return (
      <HugeiconsIcon
        color="currentColor"
        icon={DropletIcon}
        size={18}
        strokeWidth={1.8}
      />
    );
  }

  if (type === "insulin") {
    return (
      <HugeiconsIcon
        color="currentColor"
        icon={InjectionIcon}
        size={18}
        strokeWidth={1.8}
      />
    );
  }

  if (type === "meal") {
    return (
      <HugeiconsIcon
        color="currentColor"
        icon={Restaurant01Icon}
        size={18}
        strokeWidth={1.8}
      />
    );
  }

  return (
    <HugeiconsIcon
      color="currentColor"
      icon={Note01Icon}
      size={18}
      strokeWidth={1.8}
    />
  );
}

function ReadOnlyFields({
  data,
  type,
}: {
  data: Record<string, unknown>;
  type: string;
}) {
  if (type === "blood_sugar") {
    return (
      <>
        <DataRow
          label="Value"
          value={`${data.value} ${data.unit || "mg/dL"}`}
        />
        {data.context && (
          <DataRow
            label="Context"
            value={String(data.context).replace("_", " ")}
          />
        )}
      </>
    );
  }

  if (type === "insulin") {
    return (
      <>
        <DataRow label="Units" value={String(data.units)} />
        <DataRow label="Type" value={String(data.insulin_type || "rapid")} />
        {data.insulin_brand && (
          <DataRow label="Brand" value={String(data.insulin_brand)} />
        )}
        <DataRow label="Method" value={String(data.method || "pen")} />
      </>
    );
  }

  if (type === "meal") {
    const items = (data.items as Array<Record<string, unknown>>) || [];

    return (
      <>
        {data.meal_type && (
          <DataRow label="Meal" value={String(data.meal_type)} />
        )}

        {/* Nutrition summary grid */}
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {data.total_carbs != null && (
            <div className="rounded-lg bg-amber-500/10 px-2 py-1.5 text-center">
              <p className="text-sm font-bold text-amber-500">
                {String(data.total_carbs)}g
              </p>
              <p className="text-[10px] text-default-400">Carbs</p>
            </div>
          )}
          {data.total_calories != null && (
            <div className="rounded-lg bg-purple-500/10 px-2 py-1.5 text-center">
              <p className="text-sm font-bold text-purple-500">
                {String(data.total_calories)}
              </p>
              <p className="text-[10px] text-default-400">Calories</p>
            </div>
          )}
          {data.total_protein != null && (
            <div className="rounded-lg bg-blue-500/10 px-2 py-1.5 text-center">
              <p className="text-sm font-bold text-blue-500">
                {String(data.total_protein)}g
              </p>
              <p className="text-[10px] text-default-400">Protein</p>
            </div>
          )}
          {data.total_fat != null && (
            <div className="rounded-lg bg-red-500/10 px-2 py-1.5 text-center">
              <p className="text-sm font-bold text-red-500">
                {String(data.total_fat)}g
              </p>
              <p className="text-[10px] text-default-400">Fat</p>
            </div>
          )}
          {data.total_sugar != null && (
            <div className="rounded-lg bg-pink-500/10 px-2 py-1.5 text-center">
              <p className="text-sm font-bold text-pink-500">
                {String(data.total_sugar)}g
              </p>
              <p className="text-[10px] text-default-400">Sugar</p>
            </div>
          )}
          {data.total_fiber != null && (
            <div className="rounded-lg bg-emerald-500/10 px-2 py-1.5 text-center">
              <p className="text-sm font-bold text-emerald-500">
                {String(data.total_fiber)}g
              </p>
              <p className="text-[10px] text-default-400">Fiber</p>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="mt-2">
            <span className="text-xs font-medium text-default-500">Items:</span>
            <ul className="mt-1 space-y-1">
              {items.map((item, i) => (
                <li
                  key={`${String(item.name)}-${i}`}
                  className="rounded-lg bg-default-50 px-2 py-1.5"
                >
                  <p className="text-xs font-medium text-default-700">
                    {String(item.name)}
                    {item.quantity
                      ? ` (${String(item.quantity)}${item.unit ? String(item.unit) : ""})`
                      : ""}
                  </p>
                  <div className="mt-0.5 flex flex-wrap gap-2 text-[10px] text-default-400">
                    {item.carbs != null && (
                      <span className="text-amber-500">
                        {String(item.carbs)}g carbs
                      </span>
                    )}
                    {item.calories != null && (
                      <span className="text-purple-500">
                        {String(item.calories)} cal
                      </span>
                    )}
                    {item.protein != null && (
                      <span className="text-blue-500">
                        {String(item.protein)}g protein
                      </span>
                    )}
                    {item.fat != null && (
                      <span className="text-red-500">
                        {String(item.fat)}g fat
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </>
    );
  }

  return <p className="text-xs text-default-400">Unknown data type</p>;
}

function EditableFields({
  data,
  type,
  onChange,
}: {
  data: Record<string, unknown>;
  type: string;
  onChange: (field: string, value: string | number) => void;
}) {
  if (type === "blood_sugar") {
    return (
      <>
        <Input
          label="Value"
          size="sm"
          type="number"
          value={String(data.value || "")}
          onChange={(e) => onChange("value", Number(e.target.value))}
        />
        <Input
          label="Unit"
          size="sm"
          value={String(data.unit || "mg/dL")}
          onChange={(e) => onChange("unit", e.target.value)}
        />
        <Input
          label="Context"
          placeholder="fasting, before_meal, after_meal, bedtime"
          size="sm"
          value={String(data.context || "")}
          onChange={(e) => onChange("context", e.target.value)}
        />
      </>
    );
  }

  if (type === "insulin") {
    return (
      <>
        <Input
          label="Units"
          size="sm"
          type="number"
          value={String(data.units || "")}
          onChange={(e) => onChange("units", Number(e.target.value))}
        />
        <Input
          label="Type"
          placeholder="rapid, short, intermediate, long, mixed"
          size="sm"
          value={String(data.insulin_type || "")}
          onChange={(e) => onChange("insulin_type", e.target.value)}
        />
        <Input
          label="Brand"
          size="sm"
          value={String(data.insulin_brand || "")}
          onChange={(e) => onChange("insulin_brand", e.target.value)}
        />
        <Input
          label="Method"
          placeholder="syringe or pen"
          size="sm"
          value={String(data.method || "")}
          onChange={(e) => onChange("method", e.target.value)}
        />
      </>
    );
  }

  if (type === "meal") {
    return (
      <>
        <Input
          label="Meal type"
          placeholder="breakfast, lunch, dinner, snack"
          size="sm"
          value={String(data.meal_type || "")}
          onChange={(e) => onChange("meal_type", e.target.value)}
        />
        <Input
          label="Total carbs (g)"
          size="sm"
          type="number"
          value={String(data.total_carbs || "")}
          onChange={(e) => onChange("total_carbs", Number(e.target.value))}
        />
        <Input
          label="Description"
          size="sm"
          value={String(data.description || "")}
          onChange={(e) => onChange("description", e.target.value)}
        />
      </>
    );
  }

  return null;
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-default-400">{label}</span>
      <span className="text-sm font-medium capitalize text-foreground">
        {value}
      </span>
    </div>
  );
}
