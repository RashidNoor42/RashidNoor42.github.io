# Rashid Noor — Dynamic CV (Angular)

Angular version of https://rashidnoor42.github.io with a login-protected dashboard at `/admin`.
No Bootstrap or template: a custom design system (IBM Plex type, Python blue + yellow, light/dark theme)
and a live skill graph in the hero drawn from your skills data.
All content lives in **`public/data/cv.json`** — that file is the database.

## Run on your Mac

```bash
brew install node        # Node 22 or newer (check: node -v)
npm install
npm start
```

- Site: http://localhost:4200
- Dashboard: http://localhost:4200/admin
- The first `npm start` creates `.env.local` and prints your dashboard password. Edit that file to change it.

In local mode, **Save** writes `public/data/cv.json` (and uploaded images to `public/assets/img/uploads/`).
Backups of the last 30 versions go to `data-backups/` (git-ignored). Publish with:

```bash
git add . && git commit -m "Update CV" && git push
```

## Live site (GitHub Pages)

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds and deploys the site.

Dashboard on the live site: https://rashidnoor42.github.io/admin — log in with a GitHub **fine-grained token**:
GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens →
*Only select repositories*: `RashidNoor42.github.io` → *Permissions → Contents: Read and write*.

Saving commits `cv.json` to the repo; the site updates in about 1–2 minutes.
Without a valid token nobody can save anything — GitHub enforces it.

## Project map

| Path | What it is |
|---|---|
| `public/data/cv.json` | All CV content (the "database") |
| `src/app/core/cv.model.ts` | Data shape (schema) |
| `src/app/core/storage.ts` | Where data is saved: Local adapter / GitHub adapter |
| `src/app/core/cv-store.ts` | Loads data, holds the dashboard draft, saves |
| `src/app/public/` | Public page sections (hero, about, skills, resume, portfolio, contact) |
| `src/app/public/skill-graph.ts` | Hero canvas: skills as a service graph (no libraries) |
| `src/app/public/theme.ts` | Light/dark theme toggle (follows the system by default) |
| `src/app/admin/schema.ts` | Dashboard forms are generated from this list |
| `src/app/admin/` | Login, dashboard shell, generic editor, backup page |
| `server/dev-server.mjs` | Local-only API for the dashboard (never deployed) |
| `src/styles.css` | Public site design system: colours, type scale, layout |
| `src/styles/admin.css` | Dashboard styles |
| `src/environments/` | `environment.ts` = live (GitHub), `environment.development.ts` = local |

## Adding a new field (example: "Nationality")

1. Add `nationality: string` to `Profile` in `cv.model.ts` and a value in `cv.json`.
2. Add `{ key: 'nationality', label: 'Nationality', type: 'text' }` to the profile fields in `admin/schema.ts`.
3. Show it on the page (e.g. add it to the `facts` list in `public/about.ts`).

## Moving to a real database later

Write a new adapter in `src/app/core/storage.ts` (e.g. Supabase or your Django API) with the same
`login / save / uploadImage` methods, and pick it in `StorageService`. Nothing else has to change.

## Contact form

GitHub Pages can't run PHP. Create a free form at https://formspree.io and paste its URL in
Dashboard → Site settings → Formspree endpoint. Leave it empty to show contact details only.
