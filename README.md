# girlcode-socialwall

A one-page social wall for the Girls' Vibe Coding session.

## Included
- Responsive dreamy Y2K / editorial social wall
- Instagram username → clickable Instagram profile
- Optional LinkedIn link
- Optional profile photo upload in local-only mode (compressed before storage)
- Email magic-link sign-in with Supabase
- Public profiles loaded from Supabase; signed-in users can create one profile per account
- Song title and artist saved with shared profiles
- Search by name, handle, or interests
- Functional close, add, home, refresh, back and forward controls
- Mobile-friendly layout
- Browser-local persistence for guestbook notes, memories, and local-only profiles
- Compact cards (four desktop columns, two mobile columns); click anywhere on a card to open its profile
- Profile dialog with Instagram and optional LinkedIn links
- Per-profile guestbook with required author name and message, saved in this browser only

## Important
Supabase mode uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. For local development, copy `.env.example` to `.env.local` and fill in the values from your Supabase project's API settings. For Vercel, add the same two variables in the project's Environment Variables settings, then redeploy. The publishable key is intended for browser use; never use a Supabase secret or service-role key here. Database access must be protected by the `profiles` table's RLS policies.

The Supabase `profiles` table must be available through the Data API and have RLS policies that allow public reads of active profiles and authenticated owners to create their own profile. The app expects these columns: `id`, `owner_id`, `name`, `instagram`, `linkedin`, `about`, `tone`, `avatar_style`, `skin_tone`, `photo_url`, `song_title`, `song_artist`, `deleted_at`, and `created_at`. Run `supabase/migrations/20261030_add_profile_avatar_style.sql` and `supabase/migrations/20261030_add_profile_skin_tone.sql` in the Supabase SQL Editor to add the avatar and skin tone choice columns to an existing table. A unique index on `owner_id` enforces one profile per account.

Profile editing, soft deletion, shared guestbook messages, and Supabase Storage photo uploads are not connected yet. In Supabase mode, the profile photo control is intentionally disabled until shared storage is configured. Guestbook notes, memories, and reactions remain browser-local. The included seed profiles are display examples; they are not rows owned by Supabase accounts.

## Run locally
```bash
npm install
copy .env.example .env.local
npm run dev
```
Before starting the app, fill in the two Supabase values in `.env.local`. Then open the local URL printed by Vite (usually `http://localhost:5173`).
