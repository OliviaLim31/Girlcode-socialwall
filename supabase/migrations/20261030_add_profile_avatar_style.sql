alter table public.profiles
  add column if not exists avatar_style text not null default 'star-bob';
