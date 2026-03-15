"use client";

import type { PantryItem } from "@/types/database";

import { useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete02Icon,
  Edit02Icon,
  MinusSignIcon,
  Add01Icon,
  Tick02Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";

import { updatePantryItem } from "@/lib/actions/pantry";

type PantryItemCardProps = {
  item: PantryItem;
  onDelete: (id: string) => void;
  onUpdate?: (updated: PantryItem) => void;
};

const categoryColors: Record<string, { bg: string; text: string }> = {
  produce: { bg: "bg-green-500/15", text: "text-green-500" },
  dairy: { bg: "bg-blue-500/15", text: "text-blue-500" },
  protein: { bg: "bg-red-500/15", text: "text-red-500" },
  grains: { bg: "bg-amber-500/15", text: "text-amber-500" },
  snacks: { bg: "bg-pink-500/15", text: "text-pink-500" },
  beverages: { bg: "bg-cyan-500/15", text: "text-cyan-500" },
  condiments: { bg: "bg-orange-500/15", text: "text-orange-500" },
  other: { bg: "bg-default-500/15", text: "text-default-500" },
};

function getCategoryColor(category: string) {
  return categoryColors[category.toLowerCase()] ?? categoryColors.other;
}

export default function PantryItemCard({
  item,
  onDelete,
  onUpdate,
}: PantryItemCardProps) {
  const catColor = getCategoryColor(item.category);
  const [editing, setEditing] = useState(false);
  const [quantity, setQuantity] = useState(item.quantity ?? 0);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState(item.name);
  const [editBrand, setEditBrand] = useState(item.brand ?? "");
  const [editCarbs, setEditCarbs] = useState(item.carbs?.toString() ?? "");
  const [editCalories, setEditCalories] = useState(
    item.calories?.toString() ?? "",
  );
  const [editProtein, setEditProtein] = useState(
    item.protein?.toString() ?? "",
  );

  const isOutOfStock = quantity <= 0;

  async function handleQuantityChange(newQty: number) {
    const clamped = Math.max(0, newQty);

    setQuantity(clamped);
    setSaving(true);
    const result = await updatePantryItem(item.id, { quantity: clamped });

    if (result.data && onUpdate) onUpdate(result.data);
    setSaving(false);
  }

  async function handleSaveEdit() {
    setSaving(true);
    const result = await updatePantryItem(item.id, {
      name: editName,
      brand: editBrand || null,
      carbs: editCarbs ? parseFloat(editCarbs) : null,
      calories: editCalories ? parseFloat(editCalories) : null,
      protein: editProtein ? parseFloat(editProtein) : null,
    });

    if (result.data && onUpdate) onUpdate(result.data);
    setSaving(false);
    setEditing(false);
  }

  if (editing) {
    return (
      <Card className="border border-primary/30 shadow-none">
        <CardBody className="gap-3 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              Edit Item
            </span>
            <button
              className="rounded-md p-1 text-default-400 hover:text-danger"
              type="button"
              onClick={() => setEditing(false)}
            >
              <HugeiconsIcon
                color="currentColor"
                icon={Cancel01Icon}
                size={16}
              />
            </button>
          </div>

          <Input
            label="Name"
            size="sm"
            value={editName}
            variant="bordered"
            onValueChange={setEditName}
          />
          <Input
            label="Brand"
            size="sm"
            value={editBrand}
            variant="bordered"
            onValueChange={setEditBrand}
          />
          <div className="grid grid-cols-3 gap-2">
            <Input
              label="Carbs (g)"
              size="sm"
              type="number"
              value={editCarbs}
              variant="bordered"
              onValueChange={setEditCarbs}
            />
            <Input
              label="Calories"
              size="sm"
              type="number"
              value={editCalories}
              variant="bordered"
              onValueChange={setEditCalories}
            />
            <Input
              label="Protein (g)"
              size="sm"
              type="number"
              value={editProtein}
              variant="bordered"
              onValueChange={setEditProtein}
            />
          </div>

          <Button
            className="w-full"
            color="primary"
            isLoading={saving}
            size="sm"
            startContent={
              <HugeiconsIcon color="currentColor" icon={Tick02Icon} size={16} />
            }
            onPress={handleSaveEdit}
          >
            Save
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card
      className={`border shadow-none ${isOutOfStock ? "border-danger/20 opacity-60" : "border-default-200"}`}
    >
      <CardBody className="gap-2 px-4 py-3">
        {/* Row 1: name, category, actions */}
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="truncate text-sm font-semibold text-foreground">
                {item.name}
              </h4>
              <Chip
                classNames={{
                  base: `${catColor.bg} border-none`,
                  content: `${catColor.text} text-xs font-medium capitalize`,
                }}
                size="sm"
                variant="flat"
              >
                {item.category}
              </Chip>
              {isOutOfStock && (
                <span className="text-xs font-medium text-danger">
                  Out of stock
                </span>
              )}
            </div>
            {item.brand && (
              <p className="mt-0.5 truncate text-xs text-default-400">
                {item.brand}
              </p>
            )}
          </div>

          <button
            className="shrink-0 rounded-md p-1.5 text-default-400 transition-colors hover:bg-default-100 hover:text-foreground"
            type="button"
            onClick={() => setEditing(true)}
          >
            <HugeiconsIcon color="currentColor" icon={Edit02Icon} size={14} />
          </button>
          <button
            className="shrink-0 rounded-md p-1.5 text-default-400 transition-colors hover:bg-danger/10 hover:text-danger"
            type="button"
            onClick={() => onDelete(item.id)}
          >
            <HugeiconsIcon color="currentColor" icon={Delete02Icon} size={14} />
          </button>
        </div>

        {/* Row 2: nutrition */}
        <div className="flex items-center gap-3">
          {item.carbs !== null && (
            <span className="text-xs text-default-500">
              <span className="font-medium text-amber-500">{item.carbs}g</span>{" "}
              carbs
            </span>
          )}
          {item.calories !== null && (
            <span className="text-xs text-default-500">
              <span className="font-medium text-purple-500">
                {item.calories}
              </span>{" "}
              kcal
            </span>
          )}
          {item.protein !== null && (
            <span className="text-xs text-default-500">
              <span className="font-medium text-blue-500">{item.protein}g</span>{" "}
              protein
            </span>
          )}
        </div>

        {/* Row 3: quantity control */}
        <div className="flex items-center justify-between rounded-lg bg-default-50 px-3 py-2">
          <span className="text-xs text-default-500">Quantity</span>
          <div className="flex items-center gap-2">
            <button
              className="flex h-7 w-7 items-center justify-center rounded-md border border-default-200 text-default-600 transition-colors hover:bg-default-100"
              disabled={saving}
              type="button"
              onClick={() => handleQuantityChange(quantity - 1)}
            >
              <HugeiconsIcon
                color="currentColor"
                icon={MinusSignIcon}
                size={12}
                strokeWidth={2}
              />
            </button>
            <span className="min-w-[2rem] text-center text-sm font-bold text-foreground">
              {quantity}
            </span>
            <button
              className="flex h-7 w-7 items-center justify-center rounded-md border border-default-200 text-default-600 transition-colors hover:bg-default-100"
              disabled={saving}
              type="button"
              onClick={() => handleQuantityChange(quantity + 1)}
            >
              <HugeiconsIcon
                color="currentColor"
                icon={Add01Icon}
                size={12}
                strokeWidth={2}
              />
            </button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
