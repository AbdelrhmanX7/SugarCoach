"use client";

import type { Profile } from "@/types/database";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Input, Textarea } from "@heroui/input";
import { Divider } from "@heroui/divider";
import { Image } from "@heroui/image";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { HugeiconsIcon } from "@hugeicons/react";
import { Camera01Icon } from "@hugeicons/core-free-icons";

import NutritionCard, {
  type NutritionData,
} from "@/components/log/nutrition-card";
import { saveMeal } from "@/lib/actions/log";
import { createClient } from "@/lib/supabase/client";
import { getDefaultDateTime } from "@/lib/utils/date";

const mealTypes = [
  {
    key: "breakfast",
    label: "Breakfast",
    emoji: "sunrise",
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  {
    key: "lunch",
    label: "Lunch",
    emoji: "salad",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  {
    key: "dinner",
    label: "Dinner",
    emoji: "moon",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  {
    key: "snack",
    label: "Snack",
    emoji: "cookie",
    color: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  },
];

const mealEmojis: Record<string, string> = {
  sunrise: "\u{1F305}",
  salad: "\u{1F957}",
  moon: "\u{1F319}",
  cookie: "\u{1F36A}",
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
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

type MealFormProps = {
  compact?: boolean;
};

export default function MealForm({ compact = false }: MealFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Form state
  const [mealType, setMealType] = useState("");
  const [description, setDescription] = useState("");
  const [dateTime, setDateTime] = useState(getDefaultDateTime());
  const [notes, setNotes] = useState("");

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Nutrition state
  const [, setNutrition] = useState<NutritionData>({
    carbs: null,
    calories: null,
    protein: null,
    fat: null,
    sugar: null,
    fiber: null,
  });
  const [aiAnalyzed, setAiAnalyzed] = useState(false);

  // Manual override fields
  const [totalCarbs, setTotalCarbs] = useState("");
  const [totalCalories, setTotalCalories] = useState("");
  const [totalProtein, setTotalProtein] = useState("");
  const [totalFat, setTotalFat] = useState("");
  const [totalSugar, setTotalSugar] = useState("");
  const [totalFiber, setTotalFiber] = useState("");

  // Profile & insulin recommendation
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recommendedInsulin, setRecommendedInsulin] = useState<number | null>(
    null,
  );

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showXp, setShowXp] = useState(false);
  const [xpAmount, setXpAmount] = useState(10);

  useEffect(() => {
    if (showXp) {
      const timer = setTimeout(() => setShowXp(false), 2000);

      return () => clearTimeout(timer);
    }
  }, [showXp]);

  // Fetch user profile for carb ratio
  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setProfile(data as Profile);
      }
    }

    fetchProfile();
  }, []);

  // Calculate recommended insulin when carbs change
  useEffect(() => {
    const carbs = parseFloat(totalCarbs);

    if (carbs > 0 && profile?.insulin_to_carb_ratio) {
      const dose = carbs / profile.insulin_to_carb_ratio;

      setRecommendedInsulin(Math.round(dose * 10) / 10);
    } else {
      setRecommendedInsulin(null);
    }
  }, [totalCarbs, profile]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    setImageFile(file);

    // Create preview
    const reader = new FileReader();

    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function analyzeImage() {
    if (!imageFile) return;

    setIsAnalyzing(true);
    setMessage(null);

    try {
      const formData = new FormData();

      formData.append("image", imageFile);

      const response = await fetch("/api/analyze-food", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();

        setMessage({
          type: "error",
          text: err.error || "Failed to analyze image.",
        });
        setIsAnalyzing(false);

        return;
      }

      const result = await response.json();
      const n = result.nutrition;

      if (n) {
        const parsed: NutritionData = {
          carbs: n.carbs ?? n.total_carbs ?? null,
          calories: n.calories ?? n.total_calories ?? null,
          protein: n.protein ?? n.total_protein ?? null,
          fat: n.fat ?? n.total_fat ?? null,
          sugar: n.sugar ?? n.total_sugar ?? null,
          fiber: n.fiber ?? n.total_fiber ?? null,
        };

        setNutrition(parsed);
        setAiAnalyzed(true);

        // Pre-fill manual override fields
        if (parsed.carbs !== null) setTotalCarbs(String(parsed.carbs));
        if (parsed.calories !== null) setTotalCalories(String(parsed.calories));
        if (parsed.protein !== null) setTotalProtein(String(parsed.protein));
        if (parsed.fat !== null) setTotalFat(String(parsed.fat));
        if (parsed.sugar !== null) setTotalSugar(String(parsed.sugar));
        if (parsed.fiber !== null) setTotalFiber(String(parsed.fiber));
      }
    } catch {
      setMessage({
        type: "error",
        text: "Failed to analyze image. You can still enter nutrition manually.",
      });
    }

    setIsAnalyzing(false);
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    setAiAnalyzed(false);
    setNutrition({
      carbs: null,
      calories: null,
      protein: null,
      fat: null,
      sugar: null,
      fiber: null,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!mealType) {
      setMessage({ type: "error", text: "Please select a meal type." });

      return;
    }

    setIsLoading(true);
    setMessage(null);

    const formData = new FormData();

    formData.set("meal_type", mealType);
    formData.set("description", description);
    formData.set(
      "meal_time",
      dateTime ? new Date(dateTime).toISOString() : new Date().toISOString(),
    );
    formData.set("notes", notes);
    formData.set("ai_analyzed", String(aiAnalyzed));

    if (totalCarbs) formData.set("total_carbs", totalCarbs);
    if (totalCalories) formData.set("total_calories", totalCalories);
    if (totalProtein) formData.set("total_protein", totalProtein);
    if (totalFat) formData.set("total_fat", totalFat);
    if (totalSugar) formData.set("total_sugar", totalSugar);
    if (totalFiber) formData.set("total_fiber", totalFiber);
    if (recommendedInsulin !== null) {
      formData.set("recommended_insulin", String(recommendedInsulin));
    }

    const result = await saveMeal(formData);

    setIsLoading(false);

    if (result.success) {
      const xp = imageFile ? 15 : 10;

      setXpAmount(xp);
      setMessage({
        type: "success",
        text: "Meal logged successfully! Keep up the great tracking!",
      });
      setShowXp(true);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#10b981", "#14b8a6", "#06b6d4"],
      });
      setMealType("");
      setDescription("");
      setNotes("");
      setDateTime(getDefaultDateTime());
      removeImage();
      setTotalCarbs("");
      setTotalCalories("");
      setTotalProtein("");
      setTotalFat("");
      setTotalSugar("");
      setTotalFiber("");
      setRecommendedInsulin(null);
    } else {
      setMessage({
        type: "error",
        text: result.error || "Something went wrong.",
      });
    }
  }

  // Build nutrition display data from manual overrides
  const displayNutrition: NutritionData = {
    carbs: totalCarbs ? parseFloat(totalCarbs) : null,
    calories: totalCalories ? parseFloat(totalCalories) : null,
    protein: totalProtein ? parseFloat(totalProtein) : null,
    fat: totalFat ? parseFloat(totalFat) : null,
    sugar: totalSugar ? parseFloat(totalSugar) : null,
    fiber: totalFiber ? parseFloat(totalFiber) : null,
  };

  const hasNutritionData = Object.values(displayNutrition).some(
    (v) => v !== null,
  );

  const formContent = (
    <motion.form
      animate="show"
      className="space-y-5"
      initial="hidden"
      variants={containerVariants}
      onSubmit={handleSubmit}
    >
      {/* Meal Type - Visual Selector */}
      <motion.div variants={itemVariants}>
        <span className="mb-2 block text-sm font-medium text-foreground">
          Meal Type <span className="text-danger">*</span>
        </span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {mealTypes.map((type) => (
            <motion.button
              key={type.key}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 text-sm font-medium transition-all duration-200 ${
                mealType === type.key
                  ? `${type.color} border-current shadow-sm`
                  : "border-default-200 text-default-500 hover:border-default-400"
              }`}
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setMealType(type.key === mealType ? "" : type.key)}
            >
              <span className="text-2xl">{mealEmojis[type.emoji]}</span>
              <span>{type.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Description */}
      <motion.div variants={itemVariants}>
        <Textarea
          label="What did you eat?"
          labelPlacement="outside"
          maxRows={4}
          minRows={2}
          placeholder="e.g. Grilled chicken sandwich with salad and a juice box"
          value={description}
          variant="bordered"
          onValueChange={setDescription}
        />
      </motion.div>

      {/* Image Upload - Larger and more prominent */}
      <motion.div className="space-y-3" variants={itemVariants}>
        <p className="text-sm font-medium text-foreground">
          Food Photo (optional)
        </p>
        <p className="text-xs text-default-400">
          Upload a photo and our AI will estimate the nutrition for you!
        </p>

        <AnimatePresence mode="wait">
          {imagePreview ? (
            <motion.div
              key="preview"
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-3"
              exit={{ opacity: 0, scale: 0.9 }}
              initial={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="relative overflow-hidden rounded-xl border border-default-200">
                <Image
                  alt="Food preview"
                  className="h-48 w-full object-cover"
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
                  onPress={analyzeImage}
                >
                  {isAnalyzing
                    ? "Analyzing..."
                    : aiAnalyzed
                      ? "Re-analyze"
                      : "Analyze with AI"}
                </Button>
                <Button
                  color="danger"
                  size="sm"
                  variant="light"
                  onPress={removeImage}
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
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.02) 10px, rgba(255,255,255,0.02) 20px)",
              }}
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
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
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
                    size={40}
                    strokeWidth={1.5}
                  />
                </motion.span>
                <p className="text-sm font-semibold text-default-600">
                  Snap a photo of your food!
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

      <Divider />

      {/* Manual Nutrition Override Fields */}
      <motion.div className="space-y-4" variants={itemVariants}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">
            Nutrition Details
          </p>
          {aiAnalyzed && (
            <span className="rounded-full bg-secondary-100 px-2.5 py-0.5 text-xs font-medium text-secondary-700">
              AI-filled
            </span>
          )}
        </div>
        <p className="-mt-2 text-xs text-default-400">
          {aiAnalyzed
            ? "These values were estimated by AI. Feel free to adjust them!"
            : "Enter nutrition details manually, or upload a photo for AI analysis."}
        </p>

        {/* Carbs - highlighted as most important */}
        <Input
          classNames={{
            inputWrapper: totalCarbs ? "border-warning" : "",
          }}
          description="Most important for insulin dosing"
          label="Total Carbs (g)"
          labelPlacement="outside"
          min="0"
          placeholder="0"
          step="any"
          type="number"
          value={totalCarbs}
          variant="bordered"
          onValueChange={setTotalCarbs}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Calories (kcal)"
            labelPlacement="outside"
            min="0"
            placeholder="0"
            step="any"
            type="number"
            value={totalCalories}
            variant="bordered"
            onValueChange={setTotalCalories}
          />
          <Input
            label="Protein (g)"
            labelPlacement="outside"
            min="0"
            placeholder="0"
            step="any"
            type="number"
            value={totalProtein}
            variant="bordered"
            onValueChange={setTotalProtein}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Fat (g)"
            labelPlacement="outside"
            min="0"
            placeholder="0"
            step="any"
            type="number"
            value={totalFat}
            variant="bordered"
            onValueChange={setTotalFat}
          />
          <Input
            label="Sugar (g)"
            labelPlacement="outside"
            min="0"
            placeholder="0"
            step="any"
            type="number"
            value={totalSugar}
            variant="bordered"
            onValueChange={setTotalSugar}
          />
          <Input
            label="Fiber (g)"
            labelPlacement="outside"
            min="0"
            placeholder="0"
            step="any"
            type="number"
            value={totalFiber}
            variant="bordered"
            onValueChange={setTotalFiber}
          />
        </div>
      </motion.div>

      {/* Date/Time */}
      <motion.div variants={itemVariants}>
        <Input
          label="Date & Time"
          labelPlacement="outside"
          type="datetime-local"
          value={dateTime}
          variant="bordered"
          onValueChange={setDateTime}
        />
      </motion.div>

      {/* Notes */}
      <motion.div variants={itemVariants}>
        <Textarea
          label="Notes"
          labelPlacement="outside"
          maxRows={4}
          minRows={2}
          placeholder="How did you feel after eating? Any reactions?"
          value={notes}
          variant="bordered"
          onValueChange={setNotes}
        />
      </motion.div>

      {/* Status message */}
      <AnimatePresence>
        {message && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-lg p-3 text-sm ${
              message.type === "success"
                ? "bg-success-50 text-success-700 border border-success-200"
                : "bg-danger-50 text-danger-700 border border-danger-200"
            }`}
            exit={{ opacity: 0, y: -10 }}
            initial={{ opacity: 0, y: 10 }}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buttons */}
      <motion.div className="flex gap-3 pt-2" variants={itemVariants}>
        <motion.div
          className="flex-1"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 font-semibold text-white shadow-lg shadow-emerald-500/25 transition-shadow hover:shadow-emerald-500/40"
            isLoading={isLoading}
            size="lg"
            type="submit"
          >
            {isLoading ? "Saving..." : "Save Meal"}
          </Button>
        </motion.div>
        {!compact && (
          <Button size="lg" variant="flat" onPress={() => router.push("/")}>
            Cancel
          </Button>
        )}
      </motion.div>
    </motion.form>
  );

  return (
    <div className="relative space-y-6">
      {/* XP float-up animation */}
      <AnimatePresence>
        {showXp && (
          <motion.div
            animate={{ opacity: 0, y: -60 }}
            className="pointer-events-none absolute inset-x-0 top-0 z-50 flex justify-center"
            exit={{ opacity: 0 }}
            initial={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            <span className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-lg font-bold text-white shadow-lg">
              Saved! +{xpAmount} XP
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {compact ? (
        formContent
      ) : (
        <Card className="mx-auto max-w-lg border border-default-200">
          <CardBody className="p-6">{formContent}</CardBody>
        </Card>
      )}

      {/* Nutrition Card - shown beside or below the form */}
      <AnimatePresence>
        {(hasNutritionData || isAnalyzing) && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-lg"
            exit={{ opacity: 0, y: 20 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <NutritionCard
              data={displayNutrition}
              isLoading={isAnalyzing}
              recommendedInsulin={recommendedInsulin}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
