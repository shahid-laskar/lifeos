# Muslim Life OS — Dashboard Mockups: Design Rationale

14 high-fidelity frames covering mobile, tablet and desktop, in light and dark, across loading, empty and populated states. Source of truth: Frontend Redesign Plan V2 §3A (dashboard), §3B (prayer logging), §3F (skeletons), §4A–4C (daily widgets, Hijri, fasting), §4G (Qibla), §5C/§5E (accessibility, responsive), §7C (time-of-day gradients).

Files: `index.html` (all frames, one page) and `01–14 *.png` (each frame at 2× device pixel ratio).

| File | Viewport | Theme | State | Time context |
|---|---|---|---|---|
| 01 | Mobile 390 | Light | Populated | Dhuhr / daytime gradient |
| 02 | Mobile 390 | Dark | Populated | Isha / night gradient |
| 03 | Mobile 390 | Light | Loading | — |
| 04 | Mobile 390 | Dark | Loading | — |
| 05 | Mobile 390 | Light | Empty | Fajr / dawn gradient |
| 06 | Mobile 390 | Dark | Empty | Fajr / dawn gradient |
| 07 | Tablet 834 | Light | Populated | Asr |
| 08 | Tablet 834 | Dark | Populated | Fajr |
| 09 | Tablet 834 | Light | Loading | — |
| 10 | Tablet 834 | Light | Empty | Fajr |
| 11 | Desktop 1440 | Light | Populated | Maghrib / sunset gradient |
| 12 | Desktop 1440 | Dark | Populated | Isha |
| 13 | Desktop 1440 | Dark | Loading | — |
| 14 | Desktop 1440 | Light | Empty | Fajr |

Frames render the full scroll height rather than cropping at 844/1112/900, so nothing important is hidden behind a fold in review.

---

## 1. Design philosophy

**Islamic, not "Islamic-themed."** The spec's core complaint is that the app "feels like a feature checklist, not a spiritual companion." The response is restraint plus one act of ornament: an eight-point star (khatam) tessellation carried only inside the prayer banner at 7% opacity. It reads as woven texture at arm's length and as geometry up close. No mosque silhouettes, no crescent clip-art, no ornamental borders around cards — those signal decoration rather than reverence.

**Calm, low-arousal palette.** Base is warm parchment (`#faf7f1`) rather than pure white; ink is a near-black with a green cast. Primary is a muted emerald (`#1f6b52`), chosen because green carries deep Islamic association without the saturated "mosque green" that dates instantly. Brass (`#a8863f`) is reserved exclusively for the khushoo rating — a single accent used once means completion reads as meaningful rather than as another coloured chip.

**Dark mode is night, not inverted day.** Surfaces are `#141a18` on a `#0d1211` ground: a slightly green-black that stays comfortable during Isha and Tahajjud, when this app is genuinely used in the dark. Emerald lightens to `#4fae8b` to hold contrast, and dark-mode buttons flip to dark text on the lighter primary rather than white-on-mid-green, which would fail contrast.

**Typography with three jobs.** Plus Jakarta Sans for interface (geometric, neutral, excellent numerals). Lora for scripture translation and hadith — a serif slows reading and gives quoted revelation a different voice from UI chrome. Amiri naskh for Arabic, set at a generous 1.9 line-height because Arabic diacritics need vertical room.

**Numerals are tabular everywhere.** The countdown and prayer times use tabular figures so digits don't jitter as the timer ticks — the same discipline Things 3 and Linear apply to any live-updating number.

---

## 2. Influences, and how they were used

- **Tarteel** — reverence for the text itself. Arabic is never shrunk to fit a card; the du'a widget gives it the largest type on the card and lets the translation recede.
- **Pillars** — prayer as intention, not a streak. Circles show status; they never show a flame, a score or a "don't break the chain" nudge.
- **Apple Health** — a modular card grid where each card owns exactly one metric and states it as a sentence, not a raw number.
- **Linear** — one accent colour, hairline borders instead of shadows, tight vertical rhythm, uppercase micro-labels at 12px/0.12em.
- **Things 3** — generous whitespace and a single unambiguous primary action per surface; empty states that talk to you like a person.

None of the five are copied structurally: the layout is a hero banner plus a modular grid, which is the plan's §3A ASCII wireframe rendered faithfully.

---

## 3. Component-by-component decisions

### Greeting block
Arabic `السلام عليكم` sits above the transliterated greeting so the Arabic is primary and the Latin is the accessible gloss. Hijri date is emerald and semibold, Gregorian is muted — the plan asks for Hijri (§4B), and giving it colour priority states which calendar this app is organised around. The separating dot is a 3px circle, not a slash, to avoid reading as a fraction.

### Hero prayer banner (§3A, §7C)
- Four gradient themes are shown across the frames rather than described: dawn (05/06/08/10/14), daytime (01/03/07), sunset (11), night (02/12/13). Seeing them side by side is the only way to judge whether the text stays legible on each.
- The prayer name is left, the countdown right, both on the same baseline. Eyes land on the name first (what), then the number (when) — reversing this makes the card read as a timer app.
- "remaining" is set small and low-opacity under the countdown so the number never needs a colon-heavy label.
- The five daily times sit under a hairline divider, with the current window at full opacity plus a 2px underline. Only one item is emphasised, so the strip reads at a glance.
- Text is white at 100/75/62% opacity tiers rather than several different colours — this survives all four gradients without per-theme overrides.

### Today's prayers (§3B)
- Five 44px circles: the minimum comfortable touch target, spaced evenly so no two can be mis-tapped. Unlogged is a dashed outline (an invitation), completed is a filled emerald disc with a check (a fact), missed is a solid outline with a dash (neutral, never red — the app does not scold).
- Labels are three-letter abbreviations so all five fit at 390pt without wrapping or rotating.
- The reflection prompt ("How was your Asr? · Reflect →") appears as a soft-tinted row only after a prayer window has passed, exactly as §3A asks. It is a row, not a modal, so it can be ignored.
- The khushoo micro-rating is five moon phases from new to full, with a plain-language caption ("Present, with effort"). Moons instead of stars: stars are gamified scoring; lunar phase is a culturally native metaphor for gradual presence, and the phase shape itself encodes the value for anyone who can't distinguish the brass fill.
- No tap-to-cycle affordance is drawn, because §3B replaces it with a bottom sheet — the circles are shown as targets that open a sheet, not as multi-state toggles.

### Du'a of the Day / Dhikr (§4A)
Presented as a two-up pair on mobile: real content, not links. The du'a card shows Arabic (RTL), translation, and citation — three tiers of decreasing weight. The dhikr card uses a conic-gradient ring rather than a bar, because a tasbih is circular and the count belongs in the centre. At 33/33 the ring is complete and the caption says "complete" rather than showing a badge.

### Qur'an this week, Consistency, Reflections
Each pairs a progress bar with a **sentence**, addressing the §2A finding that "12 / 30 days is data but not insight": "You've prayed Fajr on time 6 of the last 7 days — your steadiest week yet." The seven-day strip below uses rounded bars, with a half-opacity bar for partial days, so the week is legible without a legend.

### Fasting and Qibla (§4C, §4G)
Fasting states the next milestone in words ("6h 12m until Maghrib") and confirms today's log in a pill. Qibla gives the bearing as text ("118° SE") with an accuracy note before offering the compass — the spec requires a text fallback for screen readers, so the text is the primary rendering rather than an afterthought.

### Navigation (§5E)
Bottom tabs up to tablet width; a 220px left sidebar at ≥1024px with the full ten-destination map. Desktop keeps the sidebar always visible rather than collapsible — on a dashboard the nav is orientation, not chrome.

---

## 4. State design

### Loading (03, 04, 09, 13) — §3F
Content-shaped skeletons only; the star spinner is gone. The banner skeleton keeps the hero's exact height, radius and a faint gradient tint so there is zero layout shift and no colour pop when data lands. The prayer skeleton is five circles with stub labels; text skeletons use descending widths (92/76/58%) so they read as prose, not as bars. Everything pulses on `--skel` at 1.6s. The greeting renders immediately because it needs no network call — showing what you already know is faster than showing a placeholder for it.

### Empty (05, 06, 10, 14)
No zeroes, no fake charts, no "0/5 prayers" scoreboard on day one. Each card gets a small tinted glyph, one warm sentence and exactly one action: "Nothing logged yet today. Tap a circle when you pray — it takes one second." Copy names the effort honestly ("about four minutes", "a single ayah") because underselling effort is what makes habit apps feel manipulative. The hero still renders fully — prayer times are computed, not user-generated, so they are never empty.

### Populated (01, 02, 07, 08, 11, 12)
Deliberately mid-day and imperfect: three of five prayers logged, one week with a gap in it. A dashboard mocked at 100% completion hides every state the design has to handle.

---

## 5. Responsive strategy

- **Mobile 390** — single column, hero first, two-up only for the small du'a/dhikr pair. Primary actions sit in the lower 60% of the first screen for thumb reach.
- **Tablet 834** — hero spans full width; below it two columns split "act" (prayers, Qur'an, hadith, reflections) from "receive" (du'a, dhikr, fasting, consistency, qibla). Cards keep the same radius and padding, so it is a re-flow, not a redesign.
- **Desktop 1440** — sidebar plus a 3-column grid: the action column is 1.35fr so the hero and prayer row stay dominant, with a full-width analytics row at the bottom. Line length in the hadith card is capped by the column, not the viewport, so text never runs to 200 characters.

## 6. Accessibility notes

- All primary text meets 4.5:1 in both themes; muted text is used only for secondary content at ≥14px equivalent.
- Status is never colour-only: completed carries a check, missed a dash, unlogged a dashed ring.
- Touch targets are ≥44px; the moon rating is 26px visually but is specified to carry a 44px hit area.
- The star texture and skeleton pulse are the only motion; both are specified to disable under `prefers-reduced-motion`.
- Arabic runs are marked RTL individually while the shell stays LTR, matching the plan's dynamic-direction requirement.

---

## 7. QA performed

Every one of the 14 frames was rendered and inspected. Issues found and fixed:

1. **Mobile content clipped at 844px** — the Qur'an and hadith cards were cut off behind the tab bar. Frames now render at full scroll height.
2. **Duplicate "Today's prayers" card in the mobile empty state** — the empty copy is now folded into the single prayers card.
3. **Large dead space in the tablet empty and loading frames** — columns were rebalanced and completed with Reflections, Fasting and Qibla cards.
4. **Desktop populated frame bottom-heavy on the left** — Qibla and Reflections added to even out the analytics row.
5. **Low contrast on dark-mode buttons** (white on `#4fae8b`) — dark-mode buttons and completed check marks now use dark ink on the lighter primary.
6. **Loading hero read as a flat grey slab** — it now carries a faint primary-tinted gradient so it previews the banner it replaces.

Final pass: no overlapping elements, no clipped text, no text over texture at unreadable contrast, consistent 14–16px card gaps and 18px radii across all frames in both themes.
