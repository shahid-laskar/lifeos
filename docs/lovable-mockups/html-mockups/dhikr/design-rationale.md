# Muslim Life OS — Dhikr Experience: Design Rationale

18 high-fidelity frames covering the complete Dhikr experience — category browser, dhikr cards, session mode, counter, guided mode, completion summary, statistics and history — on mobile, tablet and desktop, in light and dark, across loading, empty, populated and error states.

Source of truth: **Frontend Redesign Plan V2** §2E (Dhikr audit), §3E (counter immersion), §3F (skeletons), §5C (accessibility), §5E (responsive), and the **approved Dashboard mockups** as the visual language.

Files: `index.html` (all frames, one page) and `01–18 *.png` (each frame at 2× device pixel ratio).

| File | Viewport | Theme | Screen | State |
|---|---|---|---|---|
| 01 | Mobile 390 | Light | Category browser | Populated |
| 02 | Mobile 390 | Dark | Category browser | Populated |
| 03 | Mobile 390 | Light | Category browser | Loading |
| 04 | Mobile 390 | Light | Category browser | Empty |
| 05 | Mobile 390 | Light | Session mode / counter | Counting |
| 06 | Mobile 390 | Dark | Session mode / counter | Counting, breathing halo |
| 07 | Mobile 390 | Dark | Guided mode | Auto-advancing |
| 08 | Mobile 390 | Light | Completion summary | Populated |
| 09 | Mobile 390 | Dark | Statistics | Populated |
| 10 | Mobile 390 | Light | History | Populated |
| 11 | Mobile 390 | Light | Category browser | Error / offline |
| 12 | Tablet 834 | Light | Category browser | Populated |
| 13 | Tablet 834 | Dark | Session mode | Counting |
| 14 | Tablet 834 | Light | Statistics + History | Loading |
| 15 | Desktop 1440 | Light | Category browser + rail | Populated |
| 16 | Desktop 1440 | Dark | Session focus view | Counting |
| 17 | Desktop 1440 | Light | Statistics + History | Empty |
| 18 | Desktop 1440 | Dark | Category browser | Error / offline |

Frames render the full scroll height rather than cropping at 844/1112/900, so nothing is hidden behind a fold in review.

---

## 1. The design language extracted from the approved Dashboard

Nothing below was re-derived. These values were read out of the approved mockup stylesheet and reused verbatim.

### Color tokens

| Token | Light | Dark | Meaning |
|---|---|---|---|
| `--bg` | `#faf7f1` | `#0d1211` | Warm parchment page ground |
| `--surface` | `#ffffff` | `#141a18` | Card fill |
| `--line` | `#e7e1d6` | `#232b28` | 1px hairline, also the "unfilled" track |
| `--ink` | `#1c1f1d` | `#eef2ef` | Primary text |
| `--mute` | `#6f7570` | `#8d9791` | Secondary text, labels |
| `--primary` | `#1f6b52` | `#4fae8b` | Progress, active nav, primary action |
| `--primary-soft` | `#e6f0ea` | `#16241f` | Active-state wash, glyph tiles, breathing halo |
| `--brass` | `#a8863f` | `#d3ad5f` | One accent, one meaning per screen |
| `--skel` | `#e7e2d8` | `#1e2724` | Skeleton fill |

The dashboard reserved brass exclusively for the khushoo rating. Here it is reserved exclusively for **completion** — the "Complete" pill on a finished dhikr and the single glyph on the completion summary. It is never used for progress, so a filled brass mark always means "this act is finished," not "you scored."

Time-of-day hero gradients are a **dashboard-only** device. Dhikr screens deliberately carry no gradient: the hero gradient is the dashboard's way of saying "the day is moving." A dhikr session is the opposite intention — the surface should stop moving.

### Typography

Plus Jakarta Sans (UI), Lora (translations, quotations), Amiri (Arabic, `dir="rtl"`, 20px/1.9). Scale carried over: 26/700 page title, 15/600 subheads, 13–14 body, 12/600 uppercase `.12em` card micro-headings, 12–11 meta. All counts, timers and durations use `font-variant-numeric: tabular-nums` so digits do not jitter as they increment — the single most visible source of "twitch" in a counter UI.

One extension: the session counter renders at 44px/700. This is not a new type style, it is the existing display weight at the size the screen needs from arm's length.

### Spacing and shape

Screen padding 22/20 mobile, 30/32 tablet, 34/40 desktop. 14–16px between cards, 16px inside cards, 22px between category sections. Radii unchanged: 18px card, 12px inline prompt, 11px button, 99px circles, 4px density cell (an extension of the 7px week cell, scaled down proportionally).

### Elevation

Flat, as on the dashboard. Cards are `surface` plus a 1px `line`. No drop shadows anywhere in the app surface; only the device frame in this document carries a shadow. Session mode adds no shadow or scrim — depth is expressed by removing everything else, not by stacking planes.

### Iconography

Thin geometric outline at 1.5–1.6px in rounded-square containers, matching the dashboard nav glyphs. No filled icons, no novelty tasbih bead illustrations, no mosque silhouettes. The one pictorial mark is the eight-point khatam star (`✦`), the same geometry as the dashboard's banner tessellation, used at small size as a session marker.

### Navigation

Mobile keeps the five bottom tabs with Dhikr active. Tablet keeps the tabs and moves to a two-column grid. Desktop keeps the 220px sidebar with the `primary-soft` active pill. Statistics and History are sub-views of Dhikr, not new tabs — adding tabs for analytics would elevate measurement to the same rank as the act itself.

### Motion

Skeletons pulse at 1.6s, identical to the dashboard. All other state changes are opacity and ring fill. No bounce, no spring, no confetti, no count-up animation. Two additions are documented in §4.

### Card patterns reused

Uppercase micro-heading, `.ring` conic progress, `.bar`, `.weekdots`, `.pill`, `.btn`, `.empty` (glyph + heading + copy + one action), `.sk` skeletons.

---

## 2. Screen-by-screen decisions

### Category browser (01, 02, 03, 04, 11, 12, 15, 18)

**A sectioned list, not a tile grid.** Adhkar have a natural time order — Morning, Evening, After Prayer, Before Sleep, General. A grid of equal tiles would flatten that order and force the user to read every tile to find the one that matches the current hour. The list preserves sequence and lets the section that matters right now sit at the top.

**One session button per section, above the cards.** V2 §3E requires "Start Session available for each category." Placing it at the section head — full width, 12px vertical padding — makes the primary intent ("do the morning adhkar as a set") the first thing in reach, and makes the individual cards the secondary path ("count just one thing"). The evening section uses the ghost variant so only one filled green button competes for attention at a time.

**Card anatomy.** Arabic (Amiri, RTL, right-aligned within the text column), Lora translation, then either `n of m` in muted meta or a brass "Complete" pill. The 44px ring on the right restates progress non-verbally so the list can be scanned without reading. Progress is shown as a ring, never a bar with a percentage label — percentages invite optimisation.

**Nothing is scored.** No streak flame, no badge, no level, no "you're on fire." Section headers say "87 of 100" or "Not started," which is a state, not a judgement.

**Desktop rail.** Today's total, the week strip, and the two most recent sessions. It is deliberately thin: the desktop layout is for reading and reviewing, and the session itself is a phone-shaped act.

### Session mode and the counter (05, 06, 13, 16)

**Full-bleed takeover on the app background, not black.** A pure black immersive mode is the games/video convention. Keeping `--bg` says "you are still inside the app, in a quieter room" rather than "a different application launched."

**Reading zone on top, working zone on bottom.** The Arabic and translation are optically centred in the upper two-thirds; the counter, hint and controls live below a hairline in the bottom third. The whole zone below that hairline is the tap target, so counting works with the thumb of the hand holding the phone, without looking. The visible ring is a *target indicator*, not the hit area — this is why the hint reads "Tap anywhere below to count."

**Long-press to undo.** Miscounts happen constantly with a physical tasbih and with an app. Long-press decrement means correction costs nothing and needs no separate always-visible minus button, which would otherwise sit next to the tap area and get hit accidentally.

**Progress dots, not a percentage.** Seven small bars at the top show item position in the session (item 3 of 7): completed solid, current at 55% opacity, remaining in `line`. It answers "how much longer?" without turning the session into a completion bar to be raced.

**Haptics.** `navigator.vibrate(10)` per count, off by default on desktop, user-toggleable in settings (gear, top-right). Ten milliseconds is felt as a click, not a buzz — it substitutes for the bead passing under the thumb, which is what makes physical tasbih usable eyes-free.

**Tabular numerals at 44px** so 9→10 and 29→30 do not shift the layout mid-count.

### Breathing rhythm (06, 13, 16)

A `primary-soft` halo behind the counter ring, animating scale 1.00 → 1.04 with opacity 0 → 0.5 over a **6-second cycle** (roughly 4s expand, 2s settle). Three reasons for these numbers:

1. **6s ≈ 10 breaths per minute**, the pace associated with parasympathetic calm. Headspace-style 4s cycles read as instruction; 6s reads as ambience.
2. **4% scale, not 15%.** The halo should be noticed peripherally and never compete with the digit. At 4% it is felt more than seen.
3. **Halo, not ring.** Animating the progress ring itself would make progress feel unstable. The halo is a separate, non-informational layer, so nothing meaningful moves.

Under `prefers-reduced-motion: reduce` the animation is removed entirely and the halo renders as a static, very low-contrast disc. The counter remains fully usable; nothing informational was carried by the motion.

### Guided mode (07)

The same surface with three differences: a transliteration line (`Sub-ḥān-Allāh`) for users who do not read Arabic, a thin top progress line for the whole session, and controls that become **Pause / Skip item** because advancing is automatic. On reaching the target the ring holds for 800ms, then the item cross-fades out over 400ms as the next fades in. The hold is important — instant advance feels like the app snatched the moment away.

No audio by default. Recitation audio in a dhikr counter creates a performance the user has to keep up with; it belongs behind an explicit opt-in.

### Completion summary (08)

A single centred card: a brass khatam glyph, "Morning adhkar complete," a relevant ayah set in Lora italic, then three quiet meta rows — total counts, time in session, items completed. A ghost "Done" button, and a small follow-on card stating when the next set opens.

Deliberately absent: score, rank, streak count, comparison to yesterday, and **any share affordance**. Publishing worship counts is the exact social-engagement pattern the brief rules out, and it also carries a religious concern about ostentation (*riyāʾ*). The numbers shown are descriptive facts about the session, presented at meta-text weight so the ayah is the loudest element on the screen — the closing note is scripture, not statistics.

### Statistics (09, 14, 17)

Modelled on Apple Health's restraint rather than a habit-tracker dashboard.

- **This week**: the dashboard's `.weekdots` strip verbatim, plus a plain-language sentence — "You have kept evening adhkar on 5 of the last 7 days." Insight, not raw numbers (V2's complaint about the consistency card).
- **Last 12 weeks**: a `.density` grid using the same colour ramp and cell radius as the week strip at a smaller size. Full, half-opacity and empty cells only — three levels, no continuous heat scale, because finer gradation invites optimisation.
- **Steadiest time** and **Average session**: two compact cards answering "when does this actually happen for me?"

Copy rules: descriptive, never congratulatory ("Well done!"), never comparative ("better than last week"), never loss-framed ("don't break your streak"). The empty state says outright that "nothing is scored or compared," which sets expectations before any data exists.

### History (10, 17)

Reverse-chronological, grouped by day, with the **Hijri date in primary and the Gregorian date muted** — the same hierarchy the dashboard greeting establishes. Each row: khatam glyph tile, session name, item count and clock time, then counts and duration right-aligned in tabular numerals. Rows are separated by hairlines inside one card rather than being individual cards, so a long history stays calm.

"Load earlier sessions" as an explicit ghost button, not infinite scroll. Infinite scroll is an engagement pattern; a person reviewing their own worship history should reach a natural end.

### States

**Loading (03, 14).** Content-shaped skeletons: the section button, then card silhouettes with three text lines and a 44px circle exactly where the ring will be. Same 1.6s pulse. No spinner — V2 §3F specifically calls out the star spinner as insufficient.

**Empty (04, 17).** The dashboard `.empty` pattern with warm, instructive copy: what to do, roughly how long it takes ("about four minutes"), and the reassurance that progress is kept if the user steps away. One action only.

**Error (11, 18).** No red. The glyph tile drops its `primary-soft` fill and becomes a neutral outline; the copy explains the situation in plain language, states that **counting still works offline** and will sync later, offers "Try again," and notes "Showing your last saved session · 09:12." Below it, the cached adhkar are still listed under "Available offline." A daily spiritual act must not be blocked by a network failure (V2 flags missing offline support as a red-severity issue), and an alarming error treatment during worship is a worse failure than the outage itself.

---

## 3. Accessibility

- **Targets**: every interactive element is ≥44px; the session tap zone is roughly 260px tall.
- **Screen reader**: the counter is an `aria-live="polite"` region throttled to announce every 10th count plus the completion event — announcing all 33 would flood the buffer. Announcements are descriptive: "Subhanallah, 30 of 33."
- **Keyboard**: Space increments, Backspace decrements, Enter advances, Escape exits the session. Focus ring is 2px `--primary` at 3px offset, visible on both grounds.
- **Contrast**: `--ink` on `--bg` and `--mute` on `--surface` both clear AA in light and dark; the white/near-black label on the filled primary button is checked in both themes (dark mode buttons use `#08120f` text on `#4fae8b`, carried from the dashboard).
- **Language and direction**: Arabic blocks are `lang="ar" dir="rtl"` per element, translations remain LTR, so mixed-direction lines never reorder.
- **Motion**: `prefers-reduced-motion` removes the breathing halo and the skeleton pulse; no information is motion-only.
- **Colour independence**: completion is signalled by a filled ring *and* the word "Complete"; the week strip is paired with a sentence.

## 4. One-handed usage

Every primary control on mobile sits within the bottom 40% of the frame: the session tap zone, Undo/Next, the section start buttons after a short scroll. Destructive or exiting controls (close, settings) sit top-right, out of easy thumb reach, where a mis-tap during counting is unlikely. The bottom tab bar is hidden during a session so the thumb cannot leave the app mid-count.

## 5. New styles introduced, and why

Only three. Everything else is a dashboard class reused unchanged.

1. **`.breath`** — the pulsing halo behind the counter. Required because the dashboard has no component representing a live, in-progress state; every dashboard element is a settled summary. Built from `--primary-soft` at existing values.
2. **`.session`** — the full-bleed focus surface. Required because the dashboard has no immersive mode; it is a browsing surface and every screen keeps its chrome. Introduces no new colour, radius or type — it only removes.
3. **`.density`** — the 12-week grid. A direct extension of `.weekdots`: same colours, same three levels, cell radius scaled 7px → 4px to match the smaller cell. Required because a 7-cell strip cannot express a seasonal pattern, which is the entire purpose of the statistics view.

No new colour token, no new font, no new radius scale, no shadow, and no new navigation pattern were introduced.
