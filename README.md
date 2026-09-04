# nilaytoshniwal.com

A personal site drawn as a metro map. Five lines (Systems, Hardware, ML, Markets, Community),
projects and roles as stations, two-track work as interchanges, a planned extension for what
comes next, and a noticeboard at the depot. Light map on a dark page; every station opens
through a pair of doors.

## Run

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static output in dist/
npm run preview
node scripts/test-metro.mjs   # layout checks on the real content
```

Astro 5, static output, no framework on the client. GSAP 3 (ScrollTrigger) drives the map
entrance and the scroll choreography on the home page; native View Transitions drive the
doors. Fonts are self-hosted (Overpass variable, via Fontsource).

## Where content lives

Everything is in `src/data/content.js`. Nothing else needs editing to change the site's
words or add a project.

- `person`: name, monogram, the line under the name, tagline, email, links, CV path.
- `about`: the three paragraphs on `/about/`.
- `lines`: the five lines in row order. Two lines can share a station only if their rows
  are adjacent; the build fails with a clear message otherwise.
- `stations`: every project, internship and role.
- `notices`: the bulletin wall. `station` links a notice to a station; `null` is the depot. `pinned: true` puts it on the home board (3 max); the rest live at `/notices/`.
- `future`: the planned extension, three stops shown in the tunnel.

## Adding a project

Add one entry to `stations`:

```js
{
  slug: 'my-project',            // URL: /station/my-project/
  title: 'Plain title', short: 'Map label',   // short: 14 chars max, shown on the map
  lines: ['ml'],                 // one line, or two adjacent lines for an interchange
  kind: 'project',               // project | work | role
  date: '2026-10',               // YYYY-MM, decides its column on the map
  state: 'open',                 // or 'construction' with opens: 'YYYY-MM-DD'
  why: '...', how: '...', howTech: '...' | null,   // plain English; jargon only in howTech
  result: { value: '0.91', label: 'what the number means' } | null,
  outcome: '...',                // optional sentence for What came out; defaults to the result
  broke: '...',                  // the honest paragraph
  gap: '...',                    // Mind the gap: only when the repo is missing or unfinished, and why
  media: { poster: '/media/x.jpg', video: '/media/x.mp4' },   // optional
  links: [{ label: 'Repo', href: '...' }],
}
```

The map position is computed (`src/lib/metro.js`): stations take columns in date order,
interchanges share a column on both lines, and lines bend at 45 degrees where the row
changes. Run `node scripts/test-metro.mjs` after adding a station; the build runs the same
validation.

## Layout of the code

- `src/pages/index.astro`: home. `src/pages/station/[slug].astro`: one station.
  `src/pages/notices/`: the wall and single notices. `about.astro`, `404.astro`.
- `src/layouts/Base.astro`: head, top bar, footer with line status, motion and sound toggles.
- `src/components/`: `MetroMap` (both orientations from data), `DoorStrip`, `StationCard`,
  `StationStrip`, `Board`, `Lamp`.
- `src/scripts/`: `app.js` (page wiring on `astro:page-load`), `home.js` (choreography),
  `station.js` (doors, keyboard), `prefs.js` (motion and sound preferences).
- `src/styles/tokens.css` and `global.css`: the design system. See `DESIGN.md`.
- `docs/`: the brief, research, phase reports and the build plan. `spikes/` and `concepts/`:
  the measured prototypes that preceded this build.

## Verification

`spikes/measure.mjs` measures frame time and load on a phone profile (360 px, 4x CPU
throttle) and desktop; `spikes/site-shots.mjs` captures stills and console errors at 360,
768, 1440 and 2560; `spikes/nav-test.mjs` drives a station click, the doors, arrow keys and
Escape; `spikes/rm-home.mjs` and `rm-check.mjs` check `prefers-reduced-motion`. Numbers
from the last run are in `DESIGN.md`. Do not measure frame time in an embedded browser
pane; use headless Chrome.
