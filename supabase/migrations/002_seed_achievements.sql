-- Seed achievements data for the gamification system
INSERT INTO achievements (name, description, icon, category, criteria, xp_reward) VALUES
  ('First Steps', 'Log your first entry', E'\U0001F31F', 'logging', '{"type": "total_logs", "count": 1}'::jsonb, 10),
  ('Getting Started', 'Log 10 entries', E'\U0001F680', 'logging', '{"type": "total_logs", "count": 10}'::jsonb, 25),
  ('Data Champion', 'Log 100 entries', E'\U0001F3C6', 'milestone', '{"type": "total_logs", "count": 100}'::jsonb, 100),
  ('Week Warrior', 'Maintain a 7-day logging streak', E'\U0001F525', 'streak', '{"type": "streak", "days": 7}'::jsonb, 50),
  ('Month Master', 'Maintain a 30-day logging streak', E'\U0001F4AA', 'streak', '{"type": "streak", "days": 30}'::jsonb, 200),
  ('Century Streak', '100 days in a row!', E'\U0001F4AF', 'streak', '{"type": "streak", "days": 100}'::jsonb, 500),
  ('In The Zone', 'All readings in range for a full day', E'\U0001F3AF', 'target', '{"type": "full_day_in_range"}'::jsonb, 75),
  ('Photo Logger', 'Analyze 10 food photos', E'\U0001F4F8', 'logging', '{"type": "food_photos", "count": 10}'::jsonb, 50),
  ('Import Pro', 'Import data from a CGM device', E'\U0001F4CA', 'milestone', '{"type": "cgm_import", "count": 1}'::jsonb, 30),
  ('A1C Improver', 'Your A1C improved!', E'\U0001F4C8', 'target', '{"type": "a1c_improved"}'::jsonb, 100),
  ('Diet Planner', 'Create your first diet plan', E'\U0001F957', 'milestone', '{"type": "diet_plan", "count": 1}'::jsonb, 40),
  ('Consistent Logger', 'Log 3 meals in one day', E'\U0001F37D', 'logging', '{"type": "daily_meals", "count": 3}'::jsonb, 30)
ON CONFLICT (name) DO NOTHING;
