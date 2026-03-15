-- SugarCoach Initial Database Schema
-- Enable RLS on all tables
-- All tables have RLS policies: users can only access their own data + family member data

-- User profiles (extends auth.users)
create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  display_name text not null,
  avatar_url text,
  date_of_birth date,
  diabetes_type text check (diabetes_type in ('type1', 'type2', 'gestational', 'prediabetes')),
  insulin_to_carb_ratio numeric, -- e.g., 1:10 stored as 10
  correction_factor numeric, -- how much 1 unit drops BG
  target_bg_min numeric default 70,
  target_bg_max numeric default 180,
  target_a1c numeric,
  current_a1c numeric,
  insulin_method text default 'syringe' check (insulin_method in ('syringe', 'pen')),
  bg_unit text default 'mg/dL' check (bg_unit in ('mg/dL', 'mmol/L')),
  xp_points integer default 0,
  level integer default 1,
  current_streak integer default 0,
  best_streak integer default 0,
  last_activity_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Family member relationships
create table family_members (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references profiles(user_id) on delete cascade not null,
  member_user_id uuid references profiles(user_id) on delete cascade not null,
  relationship text not null, -- parent, child, sibling, spouse, caregiver
  permission text default 'view' check (permission in ('view', 'edit')),
  created_at timestamptz default now(),
  unique(owner_user_id, member_user_id)
);

-- Blood sugar readings
create table blood_sugar_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(user_id) on delete cascade not null,
  value numeric not null,
  unit text default 'mg/dL' check (unit in ('mg/dL', 'mmol/L')),
  reading_time timestamptz not null default now(),
  context text check (context in ('fasting', 'before_meal', 'after_meal', 'bedtime', 'other')),
  source text default 'manual' check (source in ('manual', 'libre', 'dexcom', 'mysugr', 'ai_chat')),
  notes text,
  created_at timestamptz default now()
);

-- Meal logs (must be created BEFORE insulin_logs since insulin_logs references meal_logs(id))
create table meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(user_id) on delete cascade not null,
  meal_type text check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  description text,
  total_carbs numeric,
  total_calories numeric,
  total_protein numeric,
  total_fat numeric,
  total_sugar numeric,
  total_fiber numeric,
  image_url text, -- Supabase Storage URL
  meal_time timestamptz not null default now(),
  ai_analyzed boolean default false,
  recommended_insulin numeric, -- calculated from carb ratio
  notes text,
  created_at timestamptz default now()
);

-- Insulin logs
create table insulin_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(user_id) on delete cascade not null,
  units numeric not null,
  insulin_type text not null check (insulin_type in ('rapid', 'short', 'intermediate', 'long', 'mixed')),
  insulin_brand text, -- NovoRapid, Lantus, Humalog, etc.
  method text default 'syringe' check (method in ('syringe', 'pen')),
  injection_time timestamptz not null default now(),
  meal_log_id uuid references meal_logs(id) on delete set null,
  notes text,
  created_at timestamptz default now()
);

-- Individual food items within a meal
create table meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_log_id uuid references meal_logs(id) on delete cascade not null,
  name text not null,
  quantity numeric,
  unit text, -- grams, pieces, cups, etc.
  carbs numeric,
  calories numeric,
  protein numeric,
  fat numeric,
  sugar numeric,
  fiber numeric
);

-- A1C records
create table a1c_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(user_id) on delete cascade not null,
  value numeric not null,
  source text not null check (source in ('lab', 'estimated')),
  lab_name text,
  test_date date not null,
  confidence text default 'high' check (confidence in ('high', 'medium', 'low')),
  notes text,
  created_at timestamptz default now()
);

-- Diet plans
create table diet_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(user_id) on delete cascade not null,
  name text not null,
  start_date date,
  end_date date,
  target_daily_carbs numeric,
  target_daily_calories numeric,
  excluded_foods text[], -- array of excluded food names/categories
  included_foods text[], -- array of preferred foods
  dietary_restrictions text[], -- vegetarian, vegan, halal, etc.
  ai_generated boolean default true,
  status text default 'active' check (status in ('active', 'completed', 'paused', 'draft')),
  notes text,
  created_at timestamptz default now()
);

-- Individual meals within a diet plan
create table diet_plan_meals (
  id uuid primary key default gen_random_uuid(),
  diet_plan_id uuid references diet_plans(id) on delete cascade not null,
  day_of_week integer not null check (day_of_week between 0 and 6), -- 0=Sunday
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  meal_name text not null,
  description text,
  ingredients text[],
  carbs numeric,
  calories numeric,
  protein numeric,
  fat numeric,
  sugar numeric,
  fiber numeric,
  recommended_insulin numeric,
  portion_notes text -- e.g., "200g chicken breast, 1 cup rice"
);

-- Weekly summaries (auto-generated)
create table weekly_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(user_id) on delete cascade not null,
  week_start date not null,
  week_end date not null,
  avg_blood_sugar numeric,
  time_in_range_pct numeric, -- percentage of readings in target range
  hypo_count integer default 0, -- readings below target_bg_min
  hyper_count integer default 0, -- readings above target_bg_max
  total_insulin_units numeric,
  avg_carbs_per_day numeric,
  estimated_a1c numeric,
  total_logs integer default 0,
  xp_earned integer default 0,
  created_at timestamptz default now(),
  unique(user_id, week_start)
);

-- Chat messages (conversation history)
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(user_id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  message_type text default 'text' check (message_type in ('text', 'voice', 'image')),
  image_url text,
  structured_data jsonb, -- parsed data from AI response
  data_saved boolean default false, -- whether structured data was saved to DB
  created_at timestamptz default now()
);

-- CGM import records
create table cgm_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(user_id) on delete cascade not null,
  source text not null check (source in ('libre', 'dexcom', 'mysugr')),
  file_name text not null,
  file_url text,
  import_date timestamptz default now(),
  records_imported integer default 0,
  date_range_start timestamptz,
  date_range_end timestamptz,
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  created_at timestamptz default now()
);

-- Achievements definitions
create table achievements (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null,
  icon text not null, -- emoji or icon name
  category text not null check (category in ('streak', 'logging', 'target', 'milestone', 'social')),
  criteria jsonb not null, -- e.g., {"type": "streak", "days": 7}
  xp_reward integer default 10,
  created_at timestamptz default now()
);

-- User earned achievements
create table user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(user_id) on delete cascade not null,
  achievement_id uuid references achievements(id) on delete cascade not null,
  earned_at timestamptz default now(),
  unique(user_id, achievement_id)
);

-- Indexes for performance
create index idx_bs_readings_user_time on blood_sugar_readings(user_id, reading_time desc);
create index idx_insulin_logs_user_time on insulin_logs(user_id, injection_time desc);
create index idx_meal_logs_user_time on meal_logs(user_id, meal_time desc);
create index idx_chat_messages_user_time on chat_messages(user_id, created_at desc);
create index idx_weekly_summaries_user_week on weekly_summaries(user_id, week_start desc);

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

-- Enable RLS on ALL tables
alter table profiles enable row level security;
alter table family_members enable row level security;
alter table blood_sugar_readings enable row level security;
alter table meal_logs enable row level security;
alter table insulin_logs enable row level security;
alter table meal_items enable row level security;
alter table a1c_records enable row level security;
alter table diet_plans enable row level security;
alter table diet_plan_meals enable row level security;
alter table weekly_summaries enable row level security;
alter table chat_messages enable row level security;
alter table cgm_imports enable row level security;
alter table achievements enable row level security;
alter table user_achievements enable row level security;

-- =============================================
-- Profiles policies
-- =============================================
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = user_id);

create policy "Users can delete own profile"
  on profiles for delete
  using (auth.uid() = user_id);

-- Allow users to view profiles of their family members
create policy "Users can view family member profiles"
  on profiles for select
  using (
    user_id in (
      select member_user_id from family_members where owner_user_id = auth.uid()
      union
      select owner_user_id from family_members where member_user_id = auth.uid()
    )
  );

-- =============================================
-- Family members policies
-- =============================================
create policy "Users can view own family members"
  on family_members for select
  using (auth.uid() = owner_user_id or auth.uid() = member_user_id);

create policy "Users can insert family members they own"
  on family_members for insert
  with check (auth.uid() = owner_user_id);

create policy "Users can update family members they own"
  on family_members for update
  using (auth.uid() = owner_user_id);

create policy "Users can delete family members they own"
  on family_members for delete
  using (auth.uid() = owner_user_id);

-- =============================================
-- Blood sugar readings policies
-- =============================================
create policy "Users can view own blood sugar readings"
  on blood_sugar_readings for select
  using (auth.uid() = user_id);

create policy "Users can insert own blood sugar readings"
  on blood_sugar_readings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own blood sugar readings"
  on blood_sugar_readings for update
  using (auth.uid() = user_id);

create policy "Users can delete own blood sugar readings"
  on blood_sugar_readings for delete
  using (auth.uid() = user_id);

-- Family members can view blood sugar readings
create policy "Family members can view blood sugar readings"
  on blood_sugar_readings for select
  using (
    user_id in (
      select member_user_id from family_members where owner_user_id = auth.uid()
      union
      select owner_user_id from family_members where member_user_id = auth.uid()
    )
  );

-- Family members with edit permission can insert blood sugar readings
create policy "Family members with edit can insert blood sugar readings"
  on blood_sugar_readings for insert
  with check (
    user_id in (
      select member_user_id from family_members
      where owner_user_id = auth.uid() and permission = 'edit'
    )
  );

-- =============================================
-- Meal logs policies
-- =============================================
create policy "Users can view own meal logs"
  on meal_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own meal logs"
  on meal_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own meal logs"
  on meal_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete own meal logs"
  on meal_logs for delete
  using (auth.uid() = user_id);

-- Family members can view meal logs
create policy "Family members can view meal logs"
  on meal_logs for select
  using (
    user_id in (
      select member_user_id from family_members where owner_user_id = auth.uid()
      union
      select owner_user_id from family_members where member_user_id = auth.uid()
    )
  );

-- =============================================
-- Insulin logs policies
-- =============================================
create policy "Users can view own insulin logs"
  on insulin_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own insulin logs"
  on insulin_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own insulin logs"
  on insulin_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete own insulin logs"
  on insulin_logs for delete
  using (auth.uid() = user_id);

-- Family members can view insulin logs
create policy "Family members can view insulin logs"
  on insulin_logs for select
  using (
    user_id in (
      select member_user_id from family_members where owner_user_id = auth.uid()
      union
      select owner_user_id from family_members where member_user_id = auth.uid()
    )
  );

-- =============================================
-- Meal items policies
-- =============================================
create policy "Users can view own meal items"
  on meal_items for select
  using (
    meal_log_id in (
      select id from meal_logs where user_id = auth.uid()
    )
  );

create policy "Users can insert own meal items"
  on meal_items for insert
  with check (
    meal_log_id in (
      select id from meal_logs where user_id = auth.uid()
    )
  );

create policy "Users can update own meal items"
  on meal_items for update
  using (
    meal_log_id in (
      select id from meal_logs where user_id = auth.uid()
    )
  );

create policy "Users can delete own meal items"
  on meal_items for delete
  using (
    meal_log_id in (
      select id from meal_logs where user_id = auth.uid()
    )
  );

-- =============================================
-- A1C records policies
-- =============================================
create policy "Users can view own a1c records"
  on a1c_records for select
  using (auth.uid() = user_id);

create policy "Users can insert own a1c records"
  on a1c_records for insert
  with check (auth.uid() = user_id);

create policy "Users can update own a1c records"
  on a1c_records for update
  using (auth.uid() = user_id);

create policy "Users can delete own a1c records"
  on a1c_records for delete
  using (auth.uid() = user_id);

-- Family members can view a1c records
create policy "Family members can view a1c records"
  on a1c_records for select
  using (
    user_id in (
      select member_user_id from family_members where owner_user_id = auth.uid()
      union
      select owner_user_id from family_members where member_user_id = auth.uid()
    )
  );

-- =============================================
-- Diet plans policies
-- =============================================
create policy "Users can view own diet plans"
  on diet_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert own diet plans"
  on diet_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update own diet plans"
  on diet_plans for update
  using (auth.uid() = user_id);

create policy "Users can delete own diet plans"
  on diet_plans for delete
  using (auth.uid() = user_id);

-- =============================================
-- Diet plan meals policies
-- =============================================
create policy "Users can view own diet plan meals"
  on diet_plan_meals for select
  using (
    diet_plan_id in (
      select id from diet_plans where user_id = auth.uid()
    )
  );

create policy "Users can insert own diet plan meals"
  on diet_plan_meals for insert
  with check (
    diet_plan_id in (
      select id from diet_plans where user_id = auth.uid()
    )
  );

create policy "Users can update own diet plan meals"
  on diet_plan_meals for update
  using (
    diet_plan_id in (
      select id from diet_plans where user_id = auth.uid()
    )
  );

create policy "Users can delete own diet plan meals"
  on diet_plan_meals for delete
  using (
    diet_plan_id in (
      select id from diet_plans where user_id = auth.uid()
    )
  );

-- =============================================
-- Weekly summaries policies
-- =============================================
create policy "Users can view own weekly summaries"
  on weekly_summaries for select
  using (auth.uid() = user_id);

create policy "Users can insert own weekly summaries"
  on weekly_summaries for insert
  with check (auth.uid() = user_id);

create policy "Users can update own weekly summaries"
  on weekly_summaries for update
  using (auth.uid() = user_id);

create policy "Users can delete own weekly summaries"
  on weekly_summaries for delete
  using (auth.uid() = user_id);

-- Family members can view weekly summaries
create policy "Family members can view weekly summaries"
  on weekly_summaries for select
  using (
    user_id in (
      select member_user_id from family_members where owner_user_id = auth.uid()
      union
      select owner_user_id from family_members where member_user_id = auth.uid()
    )
  );

-- =============================================
-- Chat messages policies
-- =============================================
create policy "Users can view own chat messages"
  on chat_messages for select
  using (auth.uid() = user_id);

create policy "Users can insert own chat messages"
  on chat_messages for insert
  with check (auth.uid() = user_id);

create policy "Users can update own chat messages"
  on chat_messages for update
  using (auth.uid() = user_id);

create policy "Users can delete own chat messages"
  on chat_messages for delete
  using (auth.uid() = user_id);

-- =============================================
-- CGM imports policies
-- =============================================
create policy "Users can view own cgm imports"
  on cgm_imports for select
  using (auth.uid() = user_id);

create policy "Users can insert own cgm imports"
  on cgm_imports for insert
  with check (auth.uid() = user_id);

create policy "Users can update own cgm imports"
  on cgm_imports for update
  using (auth.uid() = user_id);

create policy "Users can delete own cgm imports"
  on cgm_imports for delete
  using (auth.uid() = user_id);

-- =============================================
-- Achievements policies (readable by all authenticated users)
-- =============================================
create policy "Authenticated users can view achievements"
  on achievements for select
  using (auth.uid() is not null);

-- =============================================
-- User achievements policies
-- =============================================
create policy "Users can view own achievements"
  on user_achievements for select
  using (auth.uid() = user_id);

create policy "Users can insert own achievements"
  on user_achievements for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own achievements"
  on user_achievements for delete
  using (auth.uid() = user_id);

-- Family members can view user achievements
create policy "Family members can view user achievements"
  on user_achievements for select
  using (
    user_id in (
      select member_user_id from family_members where owner_user_id = auth.uid()
      union
      select owner_user_id from family_members where member_user_id = auth.uid()
    )
  );
