// Achievement definitions for the SugarCoach gamification system

export type AchievementDefinition = {
  name: string;
  description: string;
  icon: string;
  category: "streak" | "logging" | "target" | "milestone";
  criteria: Record<string, unknown>;
  xp_reward: number;
};

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    name: "First Steps",
    description: "Log your first entry",
    icon: "\u{1F31F}",
    category: "logging",
    criteria: { type: "total_logs", count: 1 },
    xp_reward: 10,
  },
  {
    name: "Getting Started",
    description: "Log 10 entries",
    icon: "\u{1F680}",
    category: "logging",
    criteria: { type: "total_logs", count: 10 },
    xp_reward: 25,
  },
  {
    name: "Data Champion",
    description: "Log 100 entries",
    icon: "\u{1F3C6}",
    category: "milestone",
    criteria: { type: "total_logs", count: 100 },
    xp_reward: 100,
  },
  {
    name: "Week Warrior",
    description: "Maintain a 7-day logging streak",
    icon: "\u{1F525}",
    category: "streak",
    criteria: { type: "streak", days: 7 },
    xp_reward: 50,
  },
  {
    name: "Month Master",
    description: "Maintain a 30-day logging streak",
    icon: "\u{1F4AA}",
    category: "streak",
    criteria: { type: "streak", days: 30 },
    xp_reward: 200,
  },
  {
    name: "Century Streak",
    description: "100 days in a row!",
    icon: "\u{1F4AF}",
    category: "streak",
    criteria: { type: "streak", days: 100 },
    xp_reward: 500,
  },
  {
    name: "In The Zone",
    description: "All readings in range for a full day",
    icon: "\u{1F3AF}",
    category: "target",
    criteria: { type: "full_day_in_range" },
    xp_reward: 75,
  },
  {
    name: "Photo Logger",
    description: "Analyze 10 food photos",
    icon: "\u{1F4F8}",
    category: "logging",
    criteria: { type: "food_photos", count: 10 },
    xp_reward: 50,
  },
  {
    name: "Import Pro",
    description: "Import data from a CGM device",
    icon: "\u{1F4CA}",
    category: "milestone",
    criteria: { type: "cgm_import", count: 1 },
    xp_reward: 30,
  },
  {
    name: "A1C Improver",
    description: "Your A1C improved!",
    icon: "\u{1F4C8}",
    category: "target",
    criteria: { type: "a1c_improved" },
    xp_reward: 100,
  },
  {
    name: "Diet Planner",
    description: "Create your first diet plan",
    icon: "\u{1F957}",
    category: "milestone",
    criteria: { type: "diet_plan", count: 1 },
    xp_reward: 40,
  },
  {
    name: "Consistent Logger",
    description: "Log 3 meals in one day",
    icon: "\u{1F37D}\uFE0F",
    category: "logging",
    criteria: { type: "daily_meals", count: 3 },
    xp_reward: 30,
  },
];

/**
 * Generate INSERT SQL for seeding achievements into the database.
 */
export function getAchievementsSeedSQL(): string {
  const values = ACHIEVEMENTS.map((a) => {
    const name = a.name.replace(/'/g, "''");
    const description = a.description.replace(/'/g, "''");
    const icon = a.icon.replace(/'/g, "''");
    const criteria = JSON.stringify(a.criteria).replace(/'/g, "''");

    return `  ('${name}', '${description}', '${icon}', '${a.category}', '${criteria}'::jsonb, ${a.xp_reward})`;
  });

  return `INSERT INTO achievements (name, description, icon, category, criteria, xp_reward) VALUES\n${values.join(",\n")}\nON CONFLICT (name) DO NOTHING;`;
}
