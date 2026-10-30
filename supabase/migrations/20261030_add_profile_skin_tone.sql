alter table public.profiles
  add column if not exists skin_tone text not null default 'fair';
