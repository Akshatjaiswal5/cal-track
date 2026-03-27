-- Run this in Supabase SQL Editor to set up your tables

create table if not exists food_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  min_calories int not null,
  max_calories int not null,
  min_protein int not null default 0,
  max_protein int not null default 0,
  subtypes jsonb default '[]',
  created_at timestamptz default now()
);

create table if not exists food_logs (
  id uuid primary key default gen_random_uuid(),
  food_item_id uuid references food_items(id) on delete set null,
  food_name text not null,
  quantity numeric not null default 1,
  calories int not null,
  protein int not null default 0,
  subtype text,
  meal_type text check (meal_type in ('morning', 'afternoon', 'dinner')),
  logged_at timestamptz default now()
);

-- ── If tables already exist, run these migrations instead ──
-- alter table food_items add column if not exists min_protein int not null default 0;
-- alter table food_items add column if not exists max_protein int not null default 0;
-- alter table food_logs add column if not exists protein int not null default 0;

-- Enable Row Level Security (optional - for personal use, you can disable or keep open)
alter table food_items enable row level security;
alter table food_logs enable row level security;

-- Allow all operations for anonymous users (adjust if you add auth later)
create policy "Allow all on food_items" on food_items for all using (true) with check (true);
create policy "Allow all on food_logs" on food_logs for all using (true) with check (true);

-- Seed some starter foods
insert into food_items (name, min_calories, max_calories, subtypes) values
  ('Roti', 60, 100, '[{"threshold": 0.33, "label": "Small Roti"}, {"threshold": 0.66, "label": "Roti"}, {"threshold": 1.0, "label": "Oily Roti"}]'),
  ('Rice (bowl)', 150, 300, '[{"threshold": 0.33, "label": "Small Rice"}, {"threshold": 0.66, "label": "Rice"}, {"threshold": 1.0, "label": "Large Rice"}]'),
  ('Dal', 100, 180, '[{"threshold": 0.33, "label": "Light Dal"}, {"threshold": 0.66, "label": "Dal"}, {"threshold": 1.0, "label": "Rich Dal"}]'),
  ('Sabzi', 80, 200, '[{"threshold": 0.33, "label": "Light Sabzi"}, {"threshold": 0.66, "label": "Sabzi"}, {"threshold": 1.0, "label": "Oily Sabzi"}]'),
  ('Egg', 70, 120, '[{"threshold": 0.33, "label": "Boiled Egg"}, {"threshold": 0.66, "label": "Scrambled Egg"}, {"threshold": 1.0, "label": "Fried Egg"}]'),
  ('Bread slice', 70, 100, '[{"threshold": 0.33, "label": "Plain Bread"}, {"threshold": 0.66, "label": "Bread"}, {"threshold": 1.0, "label": "Buttered Bread"}]'),
  ('Tea / Chai', 20, 80, '[{"threshold": 0.33, "label": "Black Tea"}, {"threshold": 0.66, "label": "Chai"}, {"threshold": 1.0, "label": "Creamy Chai"}]'),
  ('Banana', 80, 120, '[{"threshold": 0.5, "label": "Small Banana"}, {"threshold": 1.0, "label": "Large Banana"}]')
on conflict do nothing;
