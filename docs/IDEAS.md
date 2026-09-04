# Ideas backlog (2026-09-04)

Parked on purpose, not forgotten. Each entry has a cost and the source it came from. Build
order is Nilay's call; nothing here is started.

## From the visual tour of 2026-09-04 (headless frames in `Projects/portfolio-research-raw/tour/`)

1. **Corridor tunnel** (wodniack.dev). Replace the concentric arches in the tunnel with two
   ruled walls converging in perspective that stream with scroll, so the planned-extension
   section reads as moving down a hall. Transforms only. Half a day.
2. **Blur-to-sharp opener** (logartis.info). "Welcome aboard." resolves letter by letter on
   load: each glyph starts blurred and offset, snaps sharp with a stagger. GSAP SplitText
   (free since 2025). Keep it under 12 characters, blur filters cost. Half a day.
3. **Exploded train on station pages** (animejs.com). A line-drawn train in SVG (40 to 60
   paths) that assembles as you scroll down the carriage page, with callout leaders to the
   five sections: Why, How, What came out, What broke, Mind the gap. Two days; needs the
   drawing first. Biggest payoff of the five.
4. **Lens transition** (logartis.info). Leaving the map into the tunnel, a circular lens
   keeps the map visible through it while the tunnel arrives around it (mask on a fixed
   copy, scrubbed). One day.
5. **Echoed word** (wodniack.dev). Four fading copies of "aboard." trailing off to the right
   like a train leaving. Two hours.
6. **Tick-strip scrubber** (animejs.com). Replace the Plain-to-Engineer range input with a
   drag strip of ticks and a red marker. Two hours.
7. **Data tape** (wodniack.dev). The dashed rail between bulletins printed with station
   codes and dates instead of dashes. One hour.

## Parked earlier

- **Drive the train** mini-game: arrow keys move the train along the map, every station
  reached gets stamped on the ticket (localStorage). Doubles as Bruno Simon's achievements.
  One day. Nilay: "later".
- **Train snake** (Nilay, 2026-09-04): the snake game, but the snake is a train picking up
  carriages on the map grid. Lives on its own page; a button in the hero (where "Enter the
  network" used to be) takes you there. Replaces the drive-the-train idea above or merges
  with it: same page, arrow keys, stamped ticket for stations reached. One day. Pinned for
  after deploy.
- **Paper scrunch** (LottieFiles): a crumpling-paper animation. Lottie's player is 45 to 75 KB
  gzipped and the asset needs a licence check before use.
- **Pinned scenes**: content animating in and out of a fixed viewport instead of scrolling.
  Research says scroll-jacking is the fastest way to lose the 40-second reader; try it on
  exactly one section (the tunnel) if at all.
- **Stamped ticket** as the achievements surface, tied to the mini-game.
- **Door chime** on entering a station, behind the existing sound toggle (empty slot today).
- **Per-station OG images** at build time (satori), and a real `/og-default.png`.
- **Dark and light** is fixed by art direction (light map, dark carriage); no theme toggle.

## What was observed, for the record

- logartis: one fixed 1280x800 stage, no document scroll, wheel drives a GSAP timeline on one
  canvas plus 32 SVGs. Diagonal white wipe carrying a circular lens between scenes; text
  assembles glyph by glyph from blur; Lato and Josefin Sans, monochrome. Scroll-jacked: do
  not copy the navigation, copy the lens and the type.
- wodniack: GSAP plus Lenis, 19,753 px tall, Editorial New, Fraktion Mono, Bigger Display
  (paid). Scarlet on black inside a hard frame; warped line-field hero on canvas; binary
  data-tape strips between sections; about copy inside a perspective grid corridor; "WORK"
  vertical with six echoed copies; awards as hatched tiles.
- animejs: own engine plus three.js, six canvases, 110 SVGs. Circular gauge hero with a live
  easing curve; exploded line-drawn machine assembling on scroll with callout leaders; a
  tick-strip scrubber; DIN plus a mono.
- Also read earlier: Lynn Fisher 2019 (nesting reveal), 2020 (folded header), 2021 (travel
  through layered scenes), 2024 (stretched glyph); narrowdesign (a familiar object as the
  interface); bruno-simon (behind-the-scene page, achievements, whispers); rleonardi
  (journey framing, and the plain PDF link that saved it); getcoleman (the tone slider,
  built).
