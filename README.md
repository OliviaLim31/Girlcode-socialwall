# girlcode-socialwall

A one-page social wall for the Girls' Vibe Coding session.

## Included
- Responsive dreamy Y2K / editorial social wall
- Instagram username → clickable Instagram profile
- Optional LinkedIn link
- Optional profile photo upload (compressed before local storage)
- Add-me modal
- Search by name, handle, or interests
- Functional close, add, copy-link, home, refresh, back and forward controls
- Mobile-friendly layout
- Browser-local persistence via `localStorage`
- Compact cards (four desktop columns, two mobile columns); click anywhere on a card to open its profile
- Profile dialog with Instagram and optional LinkedIn links
- Per-profile guestbook with required author name and message, saved in this browser only

## Important
This version is intentionally backend-free so it works instantly. Profiles added on one device are stored only in that browser.

Guestbook notes also stay in this browser: they are not delivered to the profile owner or shared across devices. Names on notes are self-reported, not verified identities. The included seed profiles have no LinkedIn URLs; their details show “not provided” until real URLs are supplied. Profile editing and ownership verification are not implemented yet.

For a shared live wall across everyone's phones, connect Supabase (profiles table + avatar storage) and deploy to Vercel/Netlify.

## Run locally
```bash
python3 -m http.server 8080
```
Then open `http://localhost:8080`.
