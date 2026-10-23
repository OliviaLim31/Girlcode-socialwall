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
Supabase mode is enabled by creating a local `config.js` from `config.example.js` and filling in the project URL and publishable key. Never put a Supabase secret or service-role key in browser code.

The Supabase `profiles` table must be available through the Data API and have RLS policies that allow public reads of active profiles and authenticated owners to create their own profile. The app expects these columns: `id`, `owner_id`, `name`, `instagram`, `linkedin`, `about`, `tone`, `photo_url`, `song_title`, `song_artist`, `deleted_at`, and `created_at`. A unique index on `owner_id` enforces one profile per account.

Profile editing, soft deletion, shared guestbook messages, and Supabase Storage photo uploads are not connected yet. In Supabase mode, the profile photo control is intentionally disabled until shared storage is configured. Guestbook notes, memories, and reactions remain browser-local. The included seed profiles are display examples; they are not rows owned by Supabase accounts.

## Run locally
```bash
npm install
npm run dev
```
Then open the local URL printed by Vite (usually `http://localhost:5173`).
