"use client";

import type { PantryItem } from "@/types/database";

import { useEffect, useState, useRef, useCallback } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import { Tabs, Tab } from "@heroui/tabs";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { Image } from "@heroui/image";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Camera01Icon,
  Add01Icon,
  Restaurant01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";

import { containerVariants, itemVariants } from "@/lib/motion";
import {
  getPantryItems,
  addPantryItem,
  deletePantryItem,
  getSuggestedMeals,
} from "@/lib/actions/pantry";
import PantryItemCard from "@/components/pantry/pantry-item-card";

type PantryModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type NutritionResult = {
  name?: string;
  brand?: string;
  category?: string;
  carbs?: number | null;
  calories?: number | null;
  protein?: number | null;
  fat?: number | null;
  sugar?: number | null;
  fiber?: number | null;
  serving_size?: number | null;
  serving_unit?: string | null;
  source?: "open_food_facts" | "gemini";
};

type AddMethod = "search" | "photo";

export function PantryModal({ isOpen, onClose }: PantryModalProps) {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("pantry");

  // Unit conversion state
  const [viewUnit, setViewUnit] = useState<string>("100g");

  // Add food state
  const [addMethod, setAddMethod] = useState<AddMethod>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [nutritionResult, setNutritionResult] =
    useState<NutritionResult | null>(null);
  const [editName, setEditName] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editCategory, setEditCategory] = useState("other");
  const [isSaving, setIsSaving] = useState(false);
  const [addMessage, setAddMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Photo state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Meal suggestions state
  const [mealSuggestions, setMealSuggestions] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);

    const result = await getPantryItems();

    if (result.data) {
      setItems(Array.isArray(result.data) ? result.data : [result.data]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    loadItems();
  }, [isOpen, loadItems]);

  async function handleDelete(id: string) {
    await deletePantryItem(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setNutritionResult(null);
    setAddMessage(null);

    try {
      const response = await fetch("/api/search-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!response.ok) {
        const err = await response.json();

        setAddMessage({
          type: "error",
          text: err.error || "Failed to search for food.",
        });
        setIsSearching(false);

        return;
      }

      const result = await response.json();
      const n = result.nutrition;

      if (n) {
        setNutritionResult(n);
        setEditName(n.name || searchQuery);
        setEditQuantity("");
        setEditUnit(n.serving_unit || "g");
        setEditCategory(n.category || "other");
      }
    } catch {
      setAddMessage({
        type: "error",
        text: "Failed to search. Please try again.",
      });
    }

    setIsSearching(false);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    setImageFile(file);

    const reader = new FileReader();

    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleAnalyzePhoto() {
    if (!imageFile) return;

    setIsAnalyzing(true);
    setNutritionResult(null);
    setAddMessage(null);

    try {
      const formData = new FormData();

      formData.append("image", imageFile);

      const response = await fetch("/api/analyze-food", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();

        setAddMessage({
          type: "error",
          text: err.error || "Failed to analyze image.",
        });
        setIsAnalyzing(false);

        return;
      }

      const result = await response.json();
      const n = result.nutrition;

      if (n) {
        const parsed: NutritionResult = {
          name: result.food_name || "Unknown Food",
          carbs: n.carbs ?? n.total_carbs ?? null,
          calories: n.calories ?? n.total_calories ?? null,
          protein: n.protein ?? n.total_protein ?? null,
          fat: n.fat ?? n.total_fat ?? null,
          sugar: n.sugar ?? n.total_sugar ?? null,
          fiber: n.fiber ?? n.total_fiber ?? null,
          source: "gemini",
        };

        setNutritionResult(parsed);
        setEditName(parsed.name || "Unknown Food");
        setEditQuantity("");
        setEditUnit("g");
        setEditCategory("other");

        if (result.image_url) {
          setUploadedImageUrl(result.image_url);
        }
      }
    } catch {
      setAddMessage({
        type: "error",
        text: "Failed to analyze image. Please try again.",
      });
    }

    setIsAnalyzing(false);
  }

  async function handleAddToPantry() {
    if (!nutritionResult || !editName.trim()) return;

    setIsSaving(true);
    setAddMessage(null);

    const itemData = {
      name: editName.trim(),
      brand: nutritionResult.brand || null,
      category: editCategory,
      quantity: editQuantity ? parseFloat(editQuantity) : null,
      unit: editUnit || null,
      serving_size: nutritionResult.serving_size ?? null,
      serving_unit: nutritionResult.serving_unit ?? null,
      carbs: nutritionResult.carbs ?? null,
      calories: nutritionResult.calories ?? null,
      protein: nutritionResult.protein ?? null,
      fat: nutritionResult.fat ?? null,
      sugar: nutritionResult.sugar ?? null,
      fiber: nutritionResult.fiber ?? null,
      image_url: uploadedImageUrl || null,
      ai_analyzed: true,
      notes: null,
    };

    const result = await addPantryItem(itemData);

    setIsSaving(false);

    if (result.success) {
      // Reset add form
      setNutritionResult(null);
      setSearchQuery("");
      setEditName("");
      setEditQuantity("");
      setEditUnit("");
      setEditCategory("other");
      setImageFile(null);
      setImagePreview(null);
      setUploadedImageUrl(null);
      setAddMessage(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Switch to pantry tab and refresh
      setActiveTab("pantry");
      loadItems();
    } else {
      setAddMessage({
        type: "error",
        text: result.error || "Failed to add item.",
      });
    }
  }

  async function handleSuggestMeals() {
    setIsSuggesting(true);
    setMealSuggestions(null);

    const result = await getSuggestedMeals();

    if (result.suggestions) {
      setMealSuggestions(result.suggestions);
    } else {
      setMealSuggestions(
        result.error || "Could not generate suggestions. Please try again.",
      );
    }

    setIsSuggesting(false);
  }

  function removePhoto() {
    setImageFile(null);
    setImagePreview(null);
    setUploadedImageUrl(null);
    setNutritionResult(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const categoryOptions = [
    { key: "produce", label: "Produce" },
    { key: "dairy", label: "Dairy" },
    { key: "protein", label: "Protein" },
    { key: "grains", label: "Grains" },
    { key: "snacks", label: "Snacks" },
    { key: "beverages", label: "Beverages" },
    { key: "condiments", label: "Condiments" },
    { key: "other", label: "Other" },
  ];

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="5xl" onClose={onClose}>
      <ModalContent>
        {(_onClose) => (
          <>
            <ModalHeader className="flex items-center gap-2">
              <span className="text-lg font-semibold text-foreground">
                My Pantry
              </span>
            </ModalHeader>

            <ModalBody className="px-6 pb-8">
              <Tabs
                classNames={{
                  tabList: "bg-default-100 rounded-xl p-1",
                  cursor: "bg-background shadow-sm",
                  tab: "h-9 px-4",
                  tabContent: "text-sm font-medium",
                }}
                selectedKey={activeTab}
                variant="light"
                onSelectionChange={(key) => setActiveTab(key as string)}
              >
                {/* ===== TAB 1: MY PANTRY ===== */}
                <Tab key="pantry" title="My Pantry">
                  <div className="space-y-4 pt-3">
                    {loading ? (
                      <motion.div
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-center py-16"
                        initial={{ opacity: 0 }}
                      >
                        <Spinner label="Loading your pantry..." size="lg" />
                      </motion.div>
                    ) : items.length === 0 ? (
                      <motion.div
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-default-200 bg-default-50/50 py-14"
                        initial={{ opacity: 0, scale: 0.95 }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          damping: 20,
                        }}
                      >
                        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                          <HugeiconsIcon
                            className="text-primary"
                            color="currentColor"
                            icon={Restaurant01Icon}
                            size={28}
                            strokeWidth={1.5}
                          />
                        </div>

                        <h3 className="mb-2 text-lg font-semibold text-foreground">
                          Your pantry is empty
                        </h3>
                        <p className="mb-5 max-w-sm text-center text-sm text-default-500">
                          Add some foods to get started! You can search by name
                          or snap a photo.
                        </p>

                        <Button
                          color="primary"
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
                          onPress={() => setActiveTab("add")}
                        >
                          Add Your First Food
                        </Button>
                      </motion.div>
                    ) : (
                      <AnimatePresence mode="popLayout">
                        <motion.div
                          animate="show"
                          className="flex flex-col gap-3"
                          initial="hidden"
                          variants={containerVariants}
                        >
                          {items.map((item) => (
                            <motion.div
                              key={item.id}
                              layout
                              exit={{
                                opacity: 0,
                                x: -40,
                                transition: { duration: 0.2 },
                              }}
                              variants={itemVariants}
                            >
                              <PantryItemCard
                                item={item}
                                onDelete={handleDelete}
                                onUpdate={(updated) => {
                                  setItems((prev) =>
                                    prev.map((i) =>
                                      i.id === updated.id ? updated : i,
                                    ),
                                  );
                                }}
                              />
                            </motion.div>
                          ))}
                        </motion.div>
                      </AnimatePresence>
                    )}

                    {/* Suggest Meals Section */}
                    {items.length > 0 && (
                      <motion.div
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3 pt-2"
                        initial={{ opacity: 0, y: 10 }}
                        transition={{ delay: 0.3 }}
                      >
                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <Button
                            className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 font-semibold text-white shadow-lg shadow-violet-500/25 transition-shadow hover:shadow-violet-500/40"
                            isLoading={isSuggesting}
                            size="lg"
                            startContent={
                              !isSuggesting ? (
                                <HugeiconsIcon
                                  color="currentColor"
                                  icon={SparklesIcon}
                                  size={18}
                                  strokeWidth={1.5}
                                />
                              ) : undefined
                            }
                            onPress={handleSuggestMeals}
                          >
                            {isSuggesting
                              ? "Generating suggestions..."
                              : "Suggest Meals"}
                          </Button>
                        </motion.div>

                        <AnimatePresence>
                          {isSuggesting && !mealSuggestions && (
                            <motion.div
                              animate={{ opacity: 1 }}
                              className="flex items-center justify-center rounded-xl border border-default-200 bg-default-50 py-8"
                              exit={{ opacity: 0 }}
                              initial={{ opacity: 0 }}
                            >
                              <Spinner
                                label="Generating suggestions..."
                                size="md"
                              />
                            </motion.div>
                          )}

                          {mealSuggestions && (
                            <motion.div
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              initial={{ opacity: 0, y: 10 }}
                              transition={{
                                type: "spring",
                                stiffness: 200,
                                damping: 20,
                              }}
                            >
                              <Card className="border border-violet-500/20 bg-violet-500/5">
                                <CardBody className="p-4">
                                  <div className="mb-2 flex items-center gap-2">
                                    <HugeiconsIcon
                                      color="hsl(var(--heroui-secondary))"
                                      icon={SparklesIcon}
                                      size={16}
                                      strokeWidth={1.5}
                                    />
                                    <span className="text-sm font-semibold text-foreground">
                                      AI Meal Suggestions
                                    </span>
                                  </div>
                                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-default-600">
                                    {mealSuggestions}
                                  </p>
                                </CardBody>
                              </Card>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </div>
                </Tab>

                {/* ===== TAB 2: ADD FOOD ===== */}
                <Tab key="add" title="Add Food">
                  <div className="space-y-4 pt-3">
                    {/* Method selection */}
                    <div className="flex gap-2">
                      <motion.button
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${
                          addMethod === "search"
                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                            : "border-default-200 text-default-500 hover:border-default-400"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setAddMethod("search");
                          setNutritionResult(null);
                          setAddMessage(null);
                        }}
                      >
                        <HugeiconsIcon
                          color="currentColor"
                          icon={Search01Icon}
                          size={18}
                          strokeWidth={1.5}
                        />
                        Search by Name
                      </motion.button>

                      <motion.button
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${
                          addMethod === "photo"
                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                            : "border-default-200 text-default-500 hover:border-default-400"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setAddMethod("photo");
                          setNutritionResult(null);
                          setAddMessage(null);
                        }}
                      >
                        <HugeiconsIcon
                          color="currentColor"
                          icon={Camera01Icon}
                          size={18}
                          strokeWidth={1.5}
                        />
                        Scan / Photo
                      </motion.button>
                    </div>

                    <AnimatePresence mode="wait">
                      {/* Search Method */}
                      {addMethod === "search" && (
                        <motion.div
                          key="search"
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4"
                          exit={{ opacity: 0, y: -10 }}
                          initial={{ opacity: 0, y: 10 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                          }}
                        >
                          <div className="flex gap-2">
                            <Input
                              className="flex-1"
                              placeholder="e.g. Apple, Chicken breast, Rice..."
                              size="md"
                              value={searchQuery}
                              variant="bordered"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSearch();
                                }
                              }}
                              onValueChange={setSearchQuery}
                            />
                            <Button
                              color="primary"
                              isLoading={isSearching}
                              size="md"
                              startContent={
                                !isSearching ? (
                                  <HugeiconsIcon
                                    color="currentColor"
                                    icon={Search01Icon}
                                    size={16}
                                    strokeWidth={2}
                                  />
                                ) : undefined
                              }
                              onPress={handleSearch}
                            >
                              Search
                            </Button>
                          </div>
                        </motion.div>
                      )}

                      {/* Photo Method */}
                      {addMethod === "photo" && (
                        <motion.div
                          key="photo"
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4"
                          exit={{ opacity: 0, y: -10 }}
                          initial={{ opacity: 0, y: 10 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                          }}
                        >
                          <AnimatePresence mode="wait">
                            {imagePreview ? (
                              <motion.div
                                key="preview"
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-3"
                                exit={{ opacity: 0, scale: 0.9 }}
                                initial={{ opacity: 0, scale: 0.9 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 300,
                                  damping: 25,
                                }}
                              >
                                <div className="relative overflow-hidden rounded-xl border border-default-200">
                                  <Image
                                    alt="Food preview"
                                    className="h-40 w-full object-cover"
                                    src={imagePreview}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    className="flex-1"
                                    color="secondary"
                                    isLoading={isAnalyzing}
                                    size="sm"
                                    variant="flat"
                                    onPress={handleAnalyzePhoto}
                                  >
                                    {isAnalyzing
                                      ? "Analyzing..."
                                      : "Analyze with AI"}
                                  </Button>
                                  <Button
                                    color="danger"
                                    size="sm"
                                    variant="light"
                                    onPress={removePhoto}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </motion.div>
                            ) : (
                              <motion.div
                                key="upload"
                                animate={{ opacity: 1 }}
                                className="group relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-default-300 p-8 transition-colors hover:border-primary hover:bg-default-50/50"
                                initial={{ opacity: 0 }}
                                role="button"
                                tabIndex={0}
                                whileHover={{ scale: 1.01 }}
                                onClick={() => fileInputRef.current?.click()}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    fileInputRef.current?.click();
                                  }
                                }}
                              >
                                <div className="flex flex-col items-center justify-center text-center">
                                  <motion.span
                                    animate={{ scale: [1, 1.05, 1] }}
                                    className="mb-3 text-default-400 group-hover:text-primary"
                                    transition={{
                                      duration: 2,
                                      repeat: Infinity,
                                      ease: "easeInOut",
                                    }}
                                  >
                                    <HugeiconsIcon
                                      color="currentColor"
                                      icon={Camera01Icon}
                                      size={36}
                                      strokeWidth={1.5}
                                    />
                                  </motion.span>
                                  <p className="text-sm font-semibold text-default-600">
                                    Take a photo of your food
                                  </p>
                                  <p className="mt-1 text-xs text-default-400">
                                    JPEG, PNG, WebP, or HEIC
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <input
                            ref={fileInputRef}
                            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                            className="hidden"
                            type="file"
                            onChange={handleImageChange}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Nutrition Result Preview */}
                    <AnimatePresence>
                      {nutritionResult && (
                        <motion.div
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4"
                          exit={{ opacity: 0, y: -10 }}
                          initial={{ opacity: 0, y: 10 }}
                          transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 20,
                          }}
                        >
                          {/* Nutrition preview card */}
                          <Card className="overflow-hidden border border-default-200">
                            <CardBody className="space-y-3 p-4">
                              {/* Header with name, brand, source */}
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-success">
                                      <HugeiconsIcon
                                        color="currentColor"
                                        icon={SparklesIcon}
                                        size={18}
                                        strokeWidth={1.5}
                                      />
                                    </span>
                                    <h4 className="text-sm font-semibold text-foreground">
                                      {nutritionResult.name ||
                                        "Nutrition Preview"}
                                    </h4>
                                  </div>
                                  {nutritionResult.brand && (
                                    <p className="mt-0.5 pl-7 text-xs text-default-400">
                                      {nutritionResult.brand}
                                    </p>
                                  )}
                                </div>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                    nutritionResult.source === "open_food_facts"
                                      ? "bg-success/10 text-success"
                                      : "bg-secondary/10 text-secondary"
                                  }`}
                                >
                                  {nutritionResult.source === "open_food_facts"
                                    ? "Open Food Facts"
                                    : "AI Estimated"}
                                </span>
                              </div>

                              {/* Unit selector tabs */}
                              {(() => {
                                // All values from API are per 100g. Convert based on selected unit.
                                const unitOptions = [
                                  { key: "100g", label: "100g", grams: 100 },
                                  { key: "1oz", label: "1 oz", grams: 28.35 },
                                  { key: "1cup", label: "1 cup", grams: 240 },
                                  { key: "1tbsp", label: "1 tbsp", grams: 15 },
                                  { key: "1tsp", label: "1 tsp", grams: 5 },
                                  {
                                    key: "serving",
                                    label: "Serving",
                                    grams: nutritionResult.serving_size || 100,
                                  },
                                ];

                                const selected =
                                  unitOptions.find((u) => u.key === viewUnit) ||
                                  unitOptions[0];
                                const multiplier = selected.grams / 100;

                                function scale(
                                  val: number | null | undefined,
                                ): string {
                                  if (val == null) return "--";

                                  return (
                                    Math.round(val * multiplier * 10) / 10
                                  ).toString();
                                }

                                return (
                                  <>
                                    <div className="flex flex-wrap gap-1">
                                      {unitOptions.map((u) => (
                                        <button
                                          key={u.key}
                                          className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
                                            viewUnit === u.key
                                              ? "bg-primary text-primary-foreground shadow-sm"
                                              : "bg-default-100 text-default-500 hover:bg-default-200"
                                          }`}
                                          type="button"
                                          onClick={() => setViewUnit(u.key)}
                                        >
                                          {u.label}
                                          {u.key === "serving" &&
                                          nutritionResult.serving_size
                                            ? ` (${nutritionResult.serving_size}${nutritionResult.serving_unit || "g"})`
                                            : ""}
                                        </button>
                                      ))}
                                    </div>

                                    <p className="text-[11px] text-default-400">
                                      Showing nutrition per{" "}
                                      {selected.label.toLowerCase()}
                                      {selected.key !== "100g" &&
                                        ` (${selected.grams}g)`}
                                    </p>

                                    {/* Main macros */}
                                    <div className="grid grid-cols-3 gap-3">
                                      <div className="rounded-lg bg-amber-500/10 p-2.5 text-center">
                                        <p className="text-lg font-bold text-amber-500">
                                          {scale(nutritionResult.carbs)}g
                                        </p>
                                        <p className="text-xs text-default-500">
                                          Carbs
                                        </p>
                                      </div>
                                      <div className="rounded-lg bg-purple-500/10 p-2.5 text-center">
                                        <p className="text-lg font-bold text-purple-500">
                                          {scale(nutritionResult.calories)}
                                        </p>
                                        <p className="text-xs text-default-500">
                                          Calories
                                        </p>
                                      </div>
                                      <div className="rounded-lg bg-blue-500/10 p-2.5 text-center">
                                        <p className="text-lg font-bold text-blue-500">
                                          {scale(nutritionResult.protein)}g
                                        </p>
                                        <p className="text-xs text-default-500">
                                          Protein
                                        </p>
                                      </div>
                                    </div>

                                    {/* Secondary macros */}
                                    <div className="grid grid-cols-3 gap-3">
                                      <div className="rounded-lg bg-red-500/10 p-2 text-center">
                                        <p className="text-sm font-semibold text-red-500">
                                          {scale(nutritionResult.fat)}g
                                        </p>
                                        <p className="text-xs text-default-500">
                                          Fat
                                        </p>
                                      </div>
                                      <div className="rounded-lg bg-pink-500/10 p-2 text-center">
                                        <p className="text-sm font-semibold text-pink-500">
                                          {scale(nutritionResult.sugar)}g
                                        </p>
                                        <p className="text-xs text-default-500">
                                          Sugar
                                        </p>
                                      </div>
                                      <div className="rounded-lg bg-emerald-500/10 p-2 text-center">
                                        <p className="text-sm font-semibold text-emerald-500">
                                          {scale(nutritionResult.fiber)}g
                                        </p>
                                        <p className="text-xs text-default-500">
                                          Fiber
                                        </p>
                                      </div>
                                    </div>
                                  </>
                                );
                              })()}
                            </CardBody>
                          </Card>

                          {/* Editable fields */}
                          <div className="space-y-3">
                            <Input
                              label="Food Name"
                              labelPlacement="outside"
                              placeholder="Food name"
                              size="sm"
                              value={editName}
                              variant="bordered"
                              onValueChange={setEditName}
                            />

                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                label="Quantity"
                                labelPlacement="outside"
                                min="0"
                                placeholder="e.g. 500"
                                size="sm"
                                step="any"
                                type="number"
                                value={editQuantity}
                                variant="bordered"
                                onValueChange={setEditQuantity}
                              />
                              <Input
                                label="Unit"
                                labelPlacement="outside"
                                placeholder="e.g. g, pieces, ml"
                                size="sm"
                                value={editUnit}
                                variant="bordered"
                                onValueChange={setEditUnit}
                              />
                            </div>

                            {/* Category selector */}
                            <div className="space-y-1.5">
                              <p className="text-xs font-medium text-foreground">
                                Category
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {categoryOptions.map((cat) => (
                                  <motion.button
                                    key={cat.key}
                                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                      editCategory === cat.key
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "bg-default-100 text-default-600 hover:bg-default-200"
                                    }`}
                                    type="button"
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setEditCategory(cat.key)}
                                  >
                                    {cat.label}
                                  </motion.button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Add to Pantry button */}
                          <motion.div
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                          >
                            <Button
                              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 font-semibold text-white shadow-lg shadow-emerald-500/25 transition-shadow hover:shadow-emerald-500/40"
                              isLoading={isSaving}
                              size="lg"
                              startContent={
                                !isSaving ? (
                                  <HugeiconsIcon
                                    color="currentColor"
                                    icon={Add01Icon}
                                    size={18}
                                    strokeWidth={2}
                                  />
                                ) : undefined
                              }
                              onPress={handleAddToPantry}
                            >
                              {isSaving ? "Adding..." : "Add to Pantry"}
                            </Button>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Status messages */}
                    <AnimatePresence>
                      {addMessage && (
                        <motion.div
                          animate={{ opacity: 1, y: 0 }}
                          className={`rounded-lg p-3 text-sm ${
                            addMessage.type === "success"
                              ? "border border-success-200 bg-success-50 text-success-700"
                              : "border border-danger-200 bg-danger-50 text-danger-700"
                          }`}
                          exit={{ opacity: 0, y: -10 }}
                          initial={{ opacity: 0, y: 10 }}
                        >
                          {addMessage.text}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Tab>
              </Tabs>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
