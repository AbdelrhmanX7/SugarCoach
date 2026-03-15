-- Pantry items: user's food inventory with nutrition data
create table if not exists pantry_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  brand text,
  category text default 'other',
  quantity numeric,
  unit text,
  serving_size numeric,
  serving_unit text,
  carbs numeric,
  calories numeric,
  protein numeric,
  fat numeric,
  sugar numeric,
  fiber numeric,
  image_url text,
  ai_analyzed boolean default false,
  notes text,
  created_at timestamptz default now()
);

-- Index for fast user queries
create index idx_pantry_items_user on pantry_items(user_id, created_at desc);

-- RLS policies
alter table pantry_items enable row level security;

create policy "Users can view own pantry items"
  on pantry_items for select
  using (auth.uid() = user_id);

create policy "Users can insert own pantry items"
  on pantry_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update own pantry items"
  on pantry_items for update
  using (auth.uid() = user_id);

create policy "Users can delete own pantry items"
  on pantry_items for delete
  using (auth.uid() = user_id);
