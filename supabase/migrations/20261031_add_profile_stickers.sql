alter table public.profiles
  add column if not exists stickers jsonb not null default '[]'::jsonb;
