# Run-On v2 — Project Brief

> Last updated: 2026-05-27

---

## What the App Does

**Run-On** is an AFL (Australian Football League) team-selection and lineup-management app built for coaches. The name is a play on the classic AFL "run-on side" — the starting 18 who take the field at the opening bounce.

Core functionality:

- **Build and manage a squad roster** — add players with jersey numbers, display names (surname or nickname), availability status (available / injured / suspended), and group tags (e.g. "Seniors", "U16s")
- **Create match lineups** — assign players to all 25 AFL positions: 18 on-field spots, 4 interchange, and 3 emergencies
- **Customise team branding** — upload a club logo, choose a primary colour from 36 AFL swatches or custom hex, and add a background photo
- **Share lineups as polished graphics** — export a 1080 × 1350 px PNG in two formats:
  - **Field View** — players placed on an AFL oval diagram
  - **Team List** — traditional vertical team sheet
- **Work completely offline** — full PWA with service worker and localStorage persistence; no account or internet connection required

The target user is a grassroots or amateur AFL coach who wants to build and share their team sheet from a phone before match day.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | **Next.js** (App Router, static export, `output: 'export'`) |
| UI Library | **React 19** |
| Language | **TypeScript 5** (strict mode) |
| Styling | **Tailwind CSS v4** + PostCSS |
| Icons | Lucide React |
| Fonts | Google Fonts — **Oswald** (headings), **Inter** (body) |
| State | **Zustand 5** with `persist` middleware → `localStorage` |
| Graphics | **HTML5 Canvas API** (PNG export, no third-party canvas lib) |
| PWA | Service Worker + Web App Manifest |
| Deployment | **Netlify** (static HTML/CSS/JS from `/out` build directory) |
| Package Manager | pnpm |

There is **no backend, no database, and no external API** — every piece of data lives in the browser's localStorage.

---

## Pages & Routes

The app uses the Next.js App Router. All routes are statically exported.

```
/                       Home — list of all saved lineups
/squad                  Squad — full player roster management (add / edit / delete)
/lineup/new             New Lineup — form to configure match details and branding
/lineup/[id]            Lineup Editor — assign players to positions, undo/reset, share
```

### Page-by-page detail

#### `/` — Home
- Displays lineup cards sorted by recency
- Each card shows: team name, age group, opponent, date/time/venue, and position fill count (e.g. "17/25")
- Actions per card: open/edit, duplicate, delete
- Empty state with a call-to-action to create the first lineup

#### `/squad` — Squad
- Lists all players sorted by jersey number
- Status badge per player (green available / red injured / orange suspended)
- Add player button opens a modal form
- Edit and delete actions per player

#### `/lineup/new` — New Lineup
- Sectioned form:
  - **Team** — club name, team name, age group
  - **Club Branding** — logo upload (auto-resized to max 400 × 400 px), primary colour picker, background photo upload (auto-resized to max 1080 px, JPEG 75% quality)
  - **Match Details** — opponent, venue, date, time
  - **Player Display** — toggle surnames vs. nicknames
- Submitting creates a new lineup in the store and navigates to the editor

#### `/lineup/[id]` — Lineup Editor
- **Top bar**: team branding, display mode toggle, settings cog, share button
- **AFL oval diagram**: 18 on-field positions rendered as an SVG with mowing stripes, markings, and goal posts; positions placed at percentage-based coordinates
- **Interchange / Emergency row**: 4 INT + 3 EMG slots below the field
- **Bottom toolbar**: filled-position count, squad drawer toggle, undo (20-step history), reset-all
- **Squad drawer** (bottom sheet): searchable/filterable player list; tap to assign or remove
- **Share sheet**: preview and download PNG in Field or List format
- **Settings modal**: edit match details and branding post-creation
- **Player modal**: add/edit a player inline without leaving the editor

### API Routes
None — the app is fully static and client-side.

### Netlify Redirect
`/lineup/*` redirects to `/lineup/local/index.html` (status 200) to support client-side routing in the static export. The dynamic segment `[id]` only pre-renders `local` at build time.

---

## Key Data Models

### `Player`
```ts
interface Player {
  id: string                            // UUID
  firstName: string
  lastName: string
  nickname: string
  number: number                        // Jersey number 1–99
  status: 'available' | 'injured' | 'suspended'
  group: string                         // e.g. "Seniors", "U14s"
}
```

### `Lineup`
```ts
interface Lineup {
  id: string                            // UUID
  createdAt: number                     // Unix timestamp
  clubName: string
  teamName: string
  ageGroup: string
  logoDataUrl: string                   // Base64 PNG
  primaryColour: string                 // Hex e.g. "#003087"
  backgroundPhotoDataUrl: string        // Base64 JPEG
  opponent: string
  venue: string
  date: string                          // YYYY-MM-DD
  time: string                          // HH:MM
  displayMode: 'surname' | 'nickname'
  positions: Record<string, string>     // positionKey → playerId
}
```

### Position Keys
- **18 on-field**: `FPL`, `FF`, `FPR`, `HFL`, `CHF`, `HFR`, `WL`, `RR`, `RK`, `C`, `WR`, `ROV`, `HBL`, `CHB`, `HBR`, `BPL`, `FB`, `BPR`
- **4 interchange**: `INT1` – `INT4`
- **3 emergency**: `EMG1` – `EMG3`

---

## How Far Along the Build Is

### ✅ Fully Implemented

- Squad CRUD (add / edit / delete players with all metadata)
- Lineup creation, editing, duplication, and deletion
- Player-to-position assignment with tap/click UX and duplicate-assignment prevention
- 20-step undo history per lineup
- Share graphics — canvas rendering in both Field View and Team List formats
- Logo and background photo upload with client-side image resizing
- AFL club colour swatches (36 clubs) + custom hex input
- Responsive mobile-first UI with bottom sheets, modals, and drawer
- PWA installation (manifest + service worker)
- Offline persistence via localStorage
- Player filtering by status and group in the squad drawer
- Display mode toggle (surnames ↔ nicknames)
- Netlify static deployment config

### 🟡 Partial / Constrained by Architecture

- **localStorage only** — data does not sync across devices or browsers; clearing storage wipes everything
- **Single "local" lineup ID** — the static export workaround means all lineups share one route; lineup IDs are UUIDs but navigation is handled client-side
- **Storage quota** — base64 images in localStorage can hit browser limits (~5–10 MB); warnings are logged but not surfaced to the user

### ❌ Not Yet Built

- User accounts / authentication
- Cloud sync or cross-device access
- Team sharing or collaboration (e.g. share a lineup with an assistant coach)
- PDF export
- Match history, statistics, or player analytics
- Push notifications or reminders
- Native app (iOS/Android) — PWA only for now

---

## Overall Assessment

Run-On v2 is a **polished, production-ready MVP**. The core loop — build a squad, create a lineup, assign players, export the graphic — works end-to-end with professional visual quality and a well-considered mobile UX. The codebase is clean TypeScript throughout, the component architecture is sensible, and the Netlify deployment config is in place.

The main limitation is the **fully client-side, no-backend architecture**: data lives only in the current browser, there's no account system, and localStorage can fill up quickly if many photos are uploaded. These are deliberate MVP trade-offs rather than bugs.

The natural next step for v3 would be introducing a lightweight backend (Supabase or similar) for user accounts and cloud sync, which would unlock multi-device access, sharing, and a history of past lineups.
