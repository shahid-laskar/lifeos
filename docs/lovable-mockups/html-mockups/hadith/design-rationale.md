# Hadith Experience — Design Rationale

Muslim Life OS · Frontend Redesign Plan V2 §2G, §3E, §4A, §4.5
20 high-fidelity frames · mobile 390 / tablet 834 / desktop 1440 · light + dark · loading, empty, populated, error

---

## 1. The design language extracted from the approved Dashboard mockups

Nothing below was re-derived. These are the tokens and patterns read out of the approved dashboard set and carried into Hadith verbatim.

### Colour palette

| Token | Light | Dark | Meaning |
|---|---|---|---|
| bg | `#faf7f1` | `#0d1211` | page parchment |
| surface | `#ffffff` | `#141a18` | card |
| line | `#e7e1d6` | `#232b28` | 1px hairline |
| ink | `#1c1f1d` | `#eef2ef` | primary text |
| mute | `#6f7570` | `#8d9791` | secondary text |
| primary | `#1f6b52` | `#4fae8b` | actions, progress, active nav |
| primary-soft | `#e6f0ea` | `#16241f` | active pill, glyph plate |
| brass | `#a8863f` | `#d3ad5f` | one reserved meaning per screen |
| skeleton | `#e7e2d8` | `#1e2724` | loading |

Brass carries exactly one meaning in this feature: **saved / kept**. It marks the active star on a hadith and the star chip in the Saved list, and appears nowhere else. Grading (`Sahih`, `Hasan`) uses the neutral `primary-soft` pill rather than a colour-coded traffic-light system — grade is scholarly metadata, not a warning or reward.

### Typography scale

Plus Jakarta Sans (UI), Lora (hadith translation and quoted prose), Amiri (Arabic, RTL). Page title 26/700, card micro-heading 12/600 uppercase `.12em`, body 13–15, meta 11–12.5, tabular numerals on every count and reference number.

### Spacing, shape, elevation

20–22px screen padding on mobile, 32 tablet, 40 desktop. 14–16px between cards, 16px inside them. Radii: 18px card, 12px glyph plate, 11px button and input, 99px pill. Elevation is flat throughout: `surface` + 1px `line`, no shadows. Only the device frame in this document casts one.

### Icons, navigation, motion

Thin geometric outlines (1.5–1.6px) in rounded-square containers; no filled or novelty icons. Mobile keeps the five bottom tabs, desktop keeps the 220px sidebar with a `primary-soft` active pill. Motion is limited to the 1.6s skeleton pulse and opacity/ring state changes, disabled under `prefers-reduced-motion`.

---

## 2. What the Hadith feature adds — and why each addition was unavoidable

Five new classes. Everything else is a dashboard component reused unchanged.

1. **`.read`** — the long-form reading measure and type ramp (Lora 17/1.78 mobile, 18/1.8 desktop, capped at 62 characters). Required: no approved surface holds more than about three lines of prose, and hadith are the first genuinely long-form content in the product. Line length, not font size, is what makes a matn readable.
2. **`.mark`** — the inline search-match highlight. Required because the system had no emphasis token. It uses `primary-soft` with `primary` text, never yellow, so highlighting reads as part of the palette rather than as a browser artefact.
3. **`.crumb`** — collection › book › hadith. Required: hadith is the only three-level hierarchy in the product; the dashboard's flat card headers cannot express it.
4. **`.srch`** — the search field, built to `.btn`'s 11px radius and `.ico`'s 1.6px border weight so it is visually a sibling of existing controls, not a new one.
5. **`.rowlist` / `.lrow`** — the chapter and collection index row. Required because 97 books cannot be shown as 97 cards; a hairline-separated list is the Things 3 answer and it reuses the same hairline, radius and type scale.

`.toc` (the desktop right rail) reuses the sidebar's nav-pill behaviour at a narrower width and is a layout, not a new visual style.

---

## 3. Screen-by-screen decisions

### Collections (frames 01, 02, 12, 14)
A **Continue reading** card sits above the collection list because returning to where you stopped is the dominant repeat action in a reference corpus. Each collection shows English title, Arabic title, compiler with death year, and volume — the compiler line is what establishes trustworthiness in this genre, so it is given more weight than the raw hadith count. Progress bars appear only where progress exists; unstarted collections stay quiet rather than showing an empty 0% bar, which would read as a scoreboard. Tablet moves to the approved two-column `grid2`; desktop keeps a single column beside the reading pane.

### Chapters (frames 03, 15, 17)
A hairline row list, numbered with tabular numerals, English name over hadith count, Arabic book name right-aligned. Book numbers are shown as they exist in the source (note that 7 is absent from Bukhari's standard numbering) rather than renumbered — fidelity to the source is a trust property. Filter chips (`All books` / `Bookmarked` / `Unread`) reuse the pill. Paging is **Load more**, never infinite scroll: an infinite feed is the social-media pattern this product refuses.

### Navigation between collections and chapters
Three levels, three mechanisms sized to the viewport:
- **Mobile** — push navigation with a back affordance and a persistent breadcrumb line under the header, so the user always knows which of 7,563 hadith they are inside.
- **Tablet** — chapter list and reading pane side by side; tapping a chapter swaps the right pane without losing the index.
- **Desktop** — three panes: sidebar (module), chapter list (book), reading column, plus a right rail listing hadith within the current book and jump links within the current hadith. This is the Quran.com mental model — hierarchy always visible, never re-navigated.

### Reading (frames 04, 05, 15, 17, 18)
The reading column is the whole design. Arabic in Amiri at 22/2.05, right-aligned, `dir="rtl"`, with room for diacritics. Translation in Lora at 17/1.78 — a serif is used only here and in quoted prose, matching the dashboard's treatment of du'a translations. The **isnad** is present but demoted: 12.5px `mute` below a hairline, because the chain matters for authenticity and almost never for the first read. Reference line gives all three citation forms so the text can be quoted correctly. A 2px progress line at the top of the column reuses `.topline` from the session pattern.

Three actions only: **Save** (brass when active), **Aa Text** (size, translation and Arabic visibility), **Share**. Share is included here — unlike in Dhikr, where sharing worship counts risks *riyāʾ* — because sharing a hadith transmits the text itself, which is a virtue rather than a display of one's own practice.

Desktop frame 18 shows focus mode: same column, centred at 720px, rails withdrawn.

### Search (frames 06, 07, 16, 20)
Search sits at the top of the collections screen and as its own surface. Matches are highlighted inline with `.mark` (the §4.5 requirement) with enough surrounding text to judge relevance. Scope chips let the user narrow to a collection or to `Sahih only` without leaving the results. Result counts and references use tabular numerals. The empty state explains what search covers — translation, narrator, reference, not commentary — and offers a shorter query, because "no results" without a reason is the most common dead end in reference apps.

### Saved / favourites (frames 08, 09, 19)
Saved hadith keep the full reference and the save date; the brass star is the only accent. Filter chips mirror the chapter list. The empty state promises two concrete things — the full chain is kept, and saved hadith work offline — rather than exhorting the user to start collecting.

### Daily hadith (frame 10)
Arabic, translation, grade, source, and two actions: save, or read in context. A single reflection prompt sits below in Lora. There is no streak, no "day 14", no share-to-social affordance. The footnote — "A new hadith arrives after Fajr each day" — sets the rhythm without creating an obligation.

### Insights (frames 11, 19)
Apple Health restraint. A 7-day `.weekdots` strip, a 12-week `.density` grid, total hadith read, the usual time of day, and the most revisited chapter. Copy is descriptive ("You have read hadith on 5 of the last 7 days"), never congratulatory, never comparative, and the card closes by saying so explicitly. No streaks, no badges, no ranks — a streak counter turns a lapse in reading the Prophet's words into a punishment, which is precisely the wrong emotional contract.

### States
**Loading** uses content-shaped skeletons — a paragraph skeleton for a hadith, a row skeleton for a chapter list — with the approved 1.6s pulse, so the layout does not shift on arrival. **Empty** uses the dashboard's glyph + copy + one action pattern with instructive rather than motivational copy. **Error** is a `line`-bordered card with a plain explanation and a Retry button; where content is cached it says so ("Showing the last 12 hadith you opened, saved on this device") instead of raising a red alarm. Nothing in the error treatment uses `destructive` red — an unreachable library is an inconvenience, not a failure of the user.

---

## 4. Accessibility

- Minimum 44px targets on every row, chip, and action; the reading action bar is 44px tall.
- Arabic blocks carry `lang="ar" dir="rtl"`; translations carry `lang="en"`. Screen readers therefore switch voice rather than spelling out Arabic.
- AA contrast verified for both themes, including `mute` on `surface` and the `.mark` highlight.
- Full keyboard operation: arrow keys move between hadith, `S` saves, `/` focuses search, `Esc` leaves search. Visible focus ring in `primary` at 2px with 3px offset.
- Text scaling: `Aa Text` adjusts the reading column only; the measure stays capped at 62 characters so enlarged text never produces a single-word column.
- Every animation is behind `prefers-reduced-motion`.

## 5. One-handed usage

On mobile, search and filter chips sit near the top where they are used once, while the reading actions and Load more sit at the bottom of the scroll where the thumb rests. Back navigation is duplicated by an edge swipe. The reading column never places a control in the top-left corner where a one-handed reach is unsafe.

## 6. Files

- `index.html` — all 20 frames on one page, self-contained
- `01`–`20` PNG exports at 2×
