# Prayer Experience — Design Rationale

Companion to the 38 mockups in `/prayer` (`index.html` + numbered PNGs).
Source of truth: **Frontend Redesign Plan V2** + the approved **Dashboard Mockups**.
Nothing here introduces a new design language; every token, radius, and rhythm is
inherited from the dashboard.

---

## 1. Design principles carried over from the dashboard

| Principle | How the Prayer experience applies it |
|---|---|
| **Islamic, not Islamic-themed** | No mosque silhouettes, no crescent clip-art. Sacredness comes from typographic quality (Lora for scripture, Amiri for Arabic), generous margins, and geometric restraint. The only ornament is the 7% khatam texture already used in the dashboard hero. |
| **Calm over dense** | One idea per card. Cards state an insight as a sentence before showing any number. |
| **Trustworthy** | Times, methods, and sources are always labelled (calculation method, madhhab, adhan vs iqamah). Nothing spiritual is asserted without provenance. |
| **Never gamified** | No streak flames, no scores, no "perfect week" confetti. Presence is described, never ranked. |
| **Quiet accountability** | Missed prayers are shown plainly, with a route to make them up — never with red alarm styling or shame language. |

### Tokens (unchanged from the dashboard)
- Light base `#faf7f1` parchment · Dark base `#0d1211` green-black
- Emerald primary `#1f6b52` (light) / `#4fae8b` (dark)
- Brass `#a8863f` reserved **exclusively** for khushoo markers and completion glyphs
- Radii 18–20px cards, 14–16px gaps, hairline borders, no drop shadows
- Plus Jakarta Sans (UI) · Lora (scripture, reflections, hadith) · Amiri (Arabic)
- Tabular numerals on every time and countdown so live updates never shift layout

---

## 2. Prayer Times

**Frames:** 01–08 (mobile light/dark populated, mobile loading, mobile error, tablet light/dark, desktop light/dark)

### Rationale
- **The hero is the answer to one question:** *what is next, and how long do I have?* Prayer name, countdown, and time sit in a single visual group; everything else is secondary.
- **Time-of-day gradients** (Dawn, Day, Sunset, Night) let the user orient in a glance without reading. They are derived from the dashboard hero, not invented: same geometry, same texture opacity, shifted hue.
- **Adhan and Iqamah are separate columns**, because for a mosque-attending user they are genuinely different commitments. Where iqamah is unknown, the column reads "—" rather than guessing.
- **Qibla is text-first** — "118° SE" is stated before any compass is drawn, so the value survives a broken sensor, a screen reader, or a reduced-motion preference.
- **Method transparency:** the footer line always names the calculation method and madhhab, with a tap target to change it. Prayer times are a fiqh judgement, not a fact; the UI says so.

### States
- **Loading** — skeletons preserve the exact final layout so nothing jumps. No spinners: a spinner communicates "waiting", a skeleton communicates "this is what will be here".
- **Error (location unavailable)** — the screen never becomes empty. It explains what failed, offers "Use last known location" and "Enter city manually", and continues to show yesterday's cached schedule marked as cached. Guidance, not a dead end.
- **Empty** — pre-permission state explains *why* location is needed in one sentence before asking.

### Responsive
- Mobile: hero, then a single vertical schedule.
- Tablet: hero spans full width; schedule and Qibla/method cards form two columns.
- Desktop: persistent sidebar (matching the dashboard), hero spans the content column, then a three-column grid with a Weekly Rhythm card added so the row does not feel under-filled.

---

## 3. Prayer Logging

**Frames:** 09–14 (bottom sheet light/dark, undo, khushoo step, tablet sheet, desktop)

### Rationale
- **Tap-to-cycle was replaced with a bottom sheet.** Cycling through states is fast but mechanical, and it makes mis-taps invisible. A sheet costs one extra tap and buys deliberateness — which matches the product's intent far better than speed.
- **The sheet asks a plain question** ("How did you pray Asr?") and offers explicit options: *On time · Late · In jama'ah · Not yet*. Each is a sentence-legible state, not an icon the user must decode.
- **Khushoo is optional and secondary.** It appears after logging, never as a gate. Skipping is a first-class button, not a dismissal X.
- **Moon phases, not stars.** Stars are a rating idiom borrowed from commerce and imply performance scoring. Moon phases (🌑→🌕) are culturally native, non-numeric, and read as *degree of presence* rather than *score*. Each phase carries a word — Distracted, Present with effort, Settled, Deep presence — so meaning never depends on the glyph alone.
- **Undo is always available for 10 seconds** as an inline toast inside the card, not a floating snackbar. Logging worship should feel reversible; an accidental "missed" mark should never require navigating to a history screen.

### Responsive
- Mobile: true bottom sheet with drag handle, thumb-reachable actions.
- Tablet: the same component as a centred sheet, max-width constrained so the options do not stretch.
- Desktop: an inline popover anchored to the prayer row — a bottom sheet on a 1440pt screen would be a mobile idiom transplanted.

---

## 4. Prayer Status & Insights

**Frames:** 15–19 (status), 31–38 (insights: populated, empty, loading, error, all viewports and themes)

### Rationale
- **Modular cards, Apple Health lineage.** Each card is independently comprehensible and reorderable; no card depends on the one above it.
- **Insight before data.** Every card opens with a full sentence — "Fajr is your calmest prayer" — and only then shows the sparkline or figure that supports it. Users should leave with a takeaway, not with homework.
- **Sparklines, not bar charts.** A sparkline reads as a rhythm; a bar chart reads as a scoreboard. Axes are omitted deliberately; where precision matters, the value is written in text below.
- **No aggregate spiritual score.** There is deliberately no single "khushoo score" or percentage of prayers completed as a headline metric. Reducing worship to one number is exactly the gamification the plan forbids.
- **Time ranges (7 / 30 / 90 days)** rather than "all time", because meaningful reflection is seasonal and an all-time view invites comparison against one's own past self in an unhelpful way.

### States
- **Empty** — "Not enough logged yet" with a plain statement of what unlocks insight (about a week of logs). No fake sample charts, which would teach the user to distrust the data.
- **Loading** — five skeleton cards matching the real card heights, so the page does not visibly grow as data lands.
- **Error** — the range selector stays interactive, the failed card explains itself and offers Retry; the rest of the page continues to render whatever is cached.

---

## 5. Prayer Journal & Reflection

**Frames:** 20–23 (reflection), 24–30 (journal: entry, history, empty, all viewports)

### Rationale
- **Reflection is offered, never demanded.** It appears as a gentle prompt after a logged prayer and can be skipped without friction. The card states plainly: *"Reflection is always optional, and always private to you."* Privacy has to be visible at the moment of writing, not buried in settings.
- **Lora for the user's own words.** Reflections are rendered in the same serif used for scripture and hadith — a quiet signal that what the user writes about their prayer belongs to the same register as what they read.
- **Structured-but-optional inputs.** Khushoo (moon phases) → distraction chips (Rushing, Phone, Tiredness, Noise, Worry, *Nothing alhamdulillah*) → a free line. The chips exist so that a tired user can still leave a useful trace in three taps; the free line exists so the structure never becomes a cage.
- **"Nothing, alhamdulillah" is a first-class chip.** Without it, the distraction list quietly implies something always went wrong.
- **"If words are hard"** offers three prompts and states that one sentence is a complete reflection — removing the blank-page barrier that kills journalling features.
- **History is grouped by day with Hijri dates**, filtered by prayer, and paired with a khushoo trend so the user can read themselves back over time — the stated payoff in the empty state ("In a month you'll be able to read yourself back").

### States
- **Empty** — subtitle correctly reads "No reflections yet"; the card explains the future value and offers a single primary action.
- **Entry** — composer with explicit Discard / Save; no autosave ambiguity on private spiritual content.
- **History** — reverse-chronological, hairline separators, no card-per-entry (which would fragment a reading experience).

---

## 6. Accessibility & motion

- **Contrast:** all body text meets WCAG AA on both parchment and green-black surfaces; brass is never used for body copy, only for markers that also carry a text label.
- **Never colour-only:** khushoo levels always pair the moon glyph with a word; prayer status always pairs the circle with a label.
- **Tap targets:** minimum 44×44pt for every prayer circle, chip, and sheet action.
- **Screen readers:** countdowns are announced politely and not more than once a minute; Qibla is a text value first.
- **Motion:** sheet slide, toast fade, and sparkline draw only. All respect `prefers-reduced-motion`, degrading to instant state changes. No parallax, no ambient animation — the product's calm depends on stillness.
- **Dark mode is a real design**, not an inversion: the night gradients, brass, and emerald were each re-tuned for the green-black base rather than algorithmically flipped.

---

## 7. Frame index

| # | Screen | Viewport | Theme | State |
|---|---|---|---|---|
| 01–02 | Prayer times | Mobile | Light / Dark | Populated |
| 03 | Prayer times | Mobile | Light | Loading |
| 04 | Prayer times | Mobile | Dark | Error (location) |
| 05–06 | Prayer times | Tablet | Light / Dark | Populated / Loading |
| 07–08 | Prayer times | Desktop | Light / Dark | Populated |
| 09–10 | Logging sheet | Mobile | Light / Dark | Sheet open |
| 11 | Logging | Mobile | Light | Undo toast |
| 12 | Logging | Mobile | Dark | Khushoo step |
| 13–14 | Logging | Tablet / Desktop | Light | Sheet / inline |
| 15–16 | Prayer status | Mobile | Light / Dark | Populated |
| 17–19 | Prayer status | Tablet / Desktop | Light / Dark | Populated |
| 20–21 | Reflection | Mobile | Light / Dark | Populated |
| 22–23 | Reflection | Tablet / Desktop | Light / Dark | Populated |
| 24–25 | Journal entry | Mobile | Light / Dark | Composer |
| 26 | Journal | Mobile | Light | Empty |
| 27 | Journal | Mobile | Dark | History |
| 28–29 | Journal | Tablet / Desktop | Light | History |
| 30 | Journal | Desktop | Dark | Empty |
| 31–32 | Insights | Mobile | Light / Dark | Populated |
| 33–34 | Insights | Mobile | Light / Dark | Empty / Loading |
| 35–37 | Insights | Tablet / Desktop | Light / Dark | Populated |
| 38 | Insights | Desktop | Dark | Error |
