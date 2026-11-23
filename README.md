# GirlCode Official Website

> Made for girls who build. The official website of the GirlCode community in Kuala Lumpur.

![GirlCode Official Website hero](public/hero-bg.jpg)

## Features

- **Social wall**: every member gets an ID-style card with their name, Instagram and optional LinkedIn. Click a card to open the full profile.
- **Profile pic your way**: upload your own photo, or build a GirlCode avatar (hair style and skin tone).
- **Card stickers**: pick up to 2 stickers for your card and drag them where you like.
- **Guestbook**: leave a little note on anyone's profile (saved in this browser).
- **On repeat**: members share a favourite song, shown as a spinning vinyl with a Spotify search link.
- **Event gallery**: polaroid-style event photos with a lightbox, memories and reactions.
- **Sign in**: Supabase email magic link, one profile per account.
- **Search**: find someone by name, handle or vibe.
- **Dreamy details**: draggable hero stickers, letter-by-letter title animation, water-fill social icons, smooth tab transitions.
- **Responsive**: works on desktop and mobile.

## Tech stack

| Area | Tools |
| --- | --- |
| UI | React 19, plain CSS (`styles.css`) |
| Build | Vite |
| Animation | GSAP, CSS animations, View Transitions API |
| Backend | Supabase (Auth, Postgres with RLS, Edge Function) |
| Hosting | Vercel |

## Project structure

```
.
├── index.html              # entry HTML and font links
├── styles.css              # all site styles
├── src/
│   ├── main.jsx            # React entry
│   ├── App.jsx             # wall, profiles, soundtrack, footer, auth
│   ├── Avatar.jsx          # GirlCode avatar / photo
│   ├── EventGallery.jsx    # event photos, lightbox, memories
│   ├── AddMemoryModal.jsx  # add a photo memory
│   ├── Lightbox.jsx        # image viewer
│   ├── AnimatedDialog.jsx  # shared dialog animation
│   └── TextLoop.jsx / .css # scrolling ribbon text
├── public/                 # logos, hero and footer art, stickers, founders, event photos
└── supabase/
    ├── functions/profiles/ # Edge Function for profiles
    └── migrations/         # SQL for profile columns (avatar, skin tone, org, stickers)
```

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in the two Supabase values
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

`.env.local` needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from your Supabase project's API settings. Use only the publishable key in the browser, never a secret or service-role key. On Vercel, add the same two variables and redeploy.

### Database setup

The `profiles` table needs RLS policies that allow public reads and let signed-in owners create and update their own profile. Run the files in `supabase/migrations/` in the Supabase SQL Editor to add the avatar, skin tone, org and stickers columns.

### Not connected yet

Shared photo uploads, profile editing and deletion, and shared guestbook messages. Guestbook notes, memories and reactions are saved in the browser only.
