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

## Important
This version is intentionally backend-free so it works instantly. Profiles added on one device are stored only in that browser.

For a shared live wall across everyone's phones, connect Supabase (profiles table + avatar storage) and deploy to Vercel/Netlify.

## Run locally
```bash
python3 -m http.server 8080
```
Then open `http://localhost:8080`.
