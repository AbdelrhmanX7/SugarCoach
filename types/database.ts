// TypeScript types matching the Supabase database schema
// All types correspond directly to database tables

export type Profile = {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  date_of_birth: string | null;
  diabetes_type: "type1" | "type2" | "gestational" | "prediabetes" | null;
  insulin_to_carb_ratio: number | null;
  correction_factor: number | null;
  target_bg_min: number;
  target_bg_max: number;
  target_a1c: number | null;
  current_a1c: number | null;
  insulin_method: "syringe" | "pen";
  bg_unit: "mg/dL" | "mmol/L";
  xp_points: number;
  level: number;
  current_streak: number;
  best_streak: number;
  last_activity_date: string | null;
  created_at: string;
  updated_at: string;
};

export type FamilyMember = {
  id: string;
  owner_user_id: string;
  member_user_id: string;
  relationship: string;
  permission: "view" | "edit";
  created_at: string;
};

export type BloodSugarReading = {
  id: string;
  user_id: string;
  value: number;
  unit: "mg/dL" | "mmol/L";
  reading_time: string;
  context:
    | "fasting"
    | "before_meal"
    | "after_meal"
    | "bedtime"
    | "other"
    | null;
  source: "manual" | "libre" | "dexcom" | "mysugr" | "ai_chat" | "accu_chek";
  notes: string | null;
  created_at: string;
};

export type MealLog = {
  id: string;
  user_id: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack" | null;
  description: string | null;
  total_carbs: number | null;
  total_calories: number | null;
  total_protein: number | null;
  total_fat: number | null;
  total_sugar: number | null;
  total_fiber: number | null;
  image_url: string | null;
  meal_time: string;
  ai_analyzed: boolean;
  recommended_insulin: number | null;
  notes: string | null;
  created_at: string;
};

export type InsulinLog = {
  id: string;
  user_id: string;
  units: number;
  insulin_type: "rapid" | "short" | "intermediate" | "long" | "mixed";
  insulin_brand: string | null;
  method: "syringe" | "pen";
  injection_time: string;
  meal_log_id: string | null;
  notes: string | null;
  created_at: string;
};

export type MealItem = {
  id: string;
  meal_log_id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  carbs: number | null;
  calories: number | null;
  protein: number | null;
  fat: number | null;
  sugar: number | null;
  fiber: number | null;
};

export type A1CRecord = {
  id: string;
  user_id: string;
  value: number;
  source: "lab" | "estimated";
  lab_name: string | null;
  test_date: string;
  confidence: "high" | "medium" | "low";
  notes: string | null;
  created_at: string;
};

export type DietPlan = {
  id: string;
  user_id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  target_daily_carbs: number | null;
  target_daily_calories: number | null;
  excluded_foods: string[] | null;
  included_foods: string[] | null;
  dietary_restrictions: string[] | null;
  ai_generated: boolean;
  status: "active" | "completed" | "paused" | "draft";
  notes: string | null;
  created_at: string;
};

export type DietPlanMeal = {
  id: string;
  diet_plan_id: string;
  day_of_week: number;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  meal_name: string;
  description: string | null;
  ingredients: string[] | null;
  carbs: number | null;
  calories: number | null;
  protein: number | null;
  fat: number | null;
  sugar: number | null;
  fiber: number | null;
  recommended_insulin: number | null;
  portion_notes: string | null;
};

export type WeeklySummary = {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  avg_blood_sugar: number | null;
  time_in_range_pct: number | null;
  hypo_count: number;
  hyper_count: number;
  total_insulin_units: number | null;
  avg_carbs_per_day: number | null;
  estimated_a1c: number | null;
  total_logs: number;
  xp_earned: number;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  user_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  message_type: "text" | "voice" | "image";
  image_url: string | null;
  structured_data: Record<string, unknown> | null;
  data_saved: boolean;
  created_at: string;
};

export type CGMImport = {
  id: string;
  user_id: string;
  source: "libre" | "dexcom" | "mysugr";
  file_name: string;
  file_url: string | null;
  import_date: string;
  records_imported: number;
  date_range_start: string | null;
  date_range_end: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  error_message: string | null;
  created_at: string;
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "streak" | "logging" | "target" | "milestone" | "social";
  criteria: Record<string, unknown>;
  xp_reward: number;
  created_at: string;
};

export type UserAchievement = {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
};

export type PantryItem = {
  id: string;
  user_id: string;
  name: string;
  brand: string | null;
  category: string;
  quantity: number | null;
  unit: string | null;
  serving_size: number | null;
  serving_unit: string | null;
  carbs: number | null;
  calories: number | null;
  protein: number | null;
  fat: number | null;
  sugar: number | null;
  fiber: number | null;
  image_url: string | null;
  ai_analyzed: boolean;
  notes: string | null;
  created_at: string;
};
