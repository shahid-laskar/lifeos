# Muslim Life OS — Du'as Experience: Design Rationale

41 high-fidelity frames covering **categories, Du'a of the Day, search, favourites, reading, audio, sharing and collections**, at mobile 390, tablet 834 and desktop 1440, in light and dark, across loading, empty, populated and error states.

Files: `index.html` (all frames on one review page). Source of truth: the approved Dashboard mockups and Frontend Redesign Plan V2 (§3A hierarchy, §3F skeletons, §4A daily widgets, §5C accessibility, §5E responsive).

| Group | Frames | Covers |
|---|---|---|
| A | A1–A10 | Du'as home: Du'a of the Day, search entry, categories, favourites/collections rows. Light + dark, populated, loading, error (offline), tablet empty, desktop |
| B | B1–B6 | Search: resting, typing + results, no-results empty, loading, error, desktop with keyboard map |
| C | C1–C5 | Category list, filter chips, loading, over-filtered empty, tablet |
| D | D1–D6 | Reading view, loading, reading-settings sheet, tablet, desktop |
| E | E1–E3 | Mini player, offline-audio error, expanded player sheet |
| F | F1–F3 | Favourites: populated with swipe-to-remove, empty, desktop |
| G | G1–G5 | Collections grid, empty, collection detail with reorder, create sheet, add-to-collection sheet |
| H | H1–H3 | Share sheet light, dark, error |

---

## 1. The design language extracted from the approved Dashboard

Nothing below was invented for this feature. Each token was read out of the approved mockups and reused verbatim.

**Colour.** Light: ground `#faf7f1`, surface `#ffffff`, hairline `#e7e1d6`, ink `#1c1f1d`, muted `#6f7570`, primary `#1f6b52`, primary-soft `#e6f0ea`, brass `#a8863f`, skeleton `#e7e2d8`. Dark: `#0d1211` / `#141a18` / `#232b28` / `#eef2ef` / `#8d9791` / `#4fae8b` / `#16241f` / `#d3ad5f` / `#1e2724`. Dark-mode filled buttons carry dark ink (`#08120f`), never white — the same contrast fix the dashboard made.

**Brass is still spent once.** On the dashboard brass belonged only to the khushoo rating. Here it belongs only to *saved state* — the filled favourite heart and the swipe-to-remove backdrop. One accent, one meaning per surface, so a saved du'a reads as personally marked rather than as another coloured chip.

**Typography.** Plus Jakarta Sans for interface, Lora for translations and quoted text, Amiri for Arabic. The dashboard's scale is carried through unchanged: 12px/0.12em uppercase card titles, 13px body, 13px Lora translation, 20px Amiri in cards, 11.5–12px muted citations. The reader adds one step up — 27px Amiri — for the single case where the du'a *is* the page (justified in §7).

**Spacing.** 22/20px screen padding on mobile, 30/32 tablet, 34/40 desktop. 16px card padding, 14px card gaps, 12px grid gaps, 8/10/12 internal rhythm. Unchanged.

**Radius and elevation.** Cards 18px, inner controls and chips 10–12px, pills and rings 99px, sheets 22px top corners. Hairline 1px borders carry all separation; there are no drop shadows inside the app frame, exactly as on the dashboard. Sheets are the only surface allowed to sit above another, and they earn it with a dim scrim rather than a shadow.

**Iconography.** 16–20px outline glyphs, 1.6px stroke, round caps and joins, `currentColor`. Where the dashboard used a plain rounded square as a placeholder glyph, this feature uses the same 34px `primary-soft` rounded container with a real outline glyph inside. No filled, duotone or multicolour icons.

**Cards.** Surface + 1px hairline + 18px radius + 16px padding + uppercase muted micro-title, content below. Every card in this feature is that card.

**Navigation.** Bottom tabs through tablet, 220px persistent left sidebar at desktop with a `primary-soft` active row. Sub-pages inside Du'as use a back chevron plus 17px title, so the tab bar never disappears and the user is never more than one tap from the section root.

**Interaction.** ≥44px targets, `primary-soft` pills for inline actions, tinted rows instead of modals for suggestions, bottom sheets for anything requiring input or choice, status never encoded in colour alone.

**Motion.** The 1.6s skeleton pulse plus 150–200ms tint/opacity transitions. Nothing else. No page transitions, no confetti on saving, no springy sheets. Everything disables under `prefers-reduced-motion`.

**Gradients.** On the dashboard, gradient is the exclusive signature of the prayer hero and encodes time of day. **The Du'as feature ships zero gradients** — extending them here would dilute the one place where a gradient carries meaning.

---

## 2. Screen-by-screen decisions

### A. Du'as home (A1–A10)

The section opens with **content, not a menu**. Du'a of the Day is the first card, in the exact composition of the dashboard widget — Arabic → translation → citation, three tiers of decreasing weight — plus two `primary-soft` pills (Listen, Save). Someone who opens Du'as with no plan has already received something.

The **category grid** is 2-up on mobile, 3-up on tablet, 4-up on desktop, with a glyph, name and count. The count is the honest scope signal ("28 du'as") that a bare label withholds. Categories are occasions, not taxonomies — *Morning & Evening, Protection, Distress & Anxiety, Within Salah* — because people arrive at du'a from a circumstance.

**Favourites and Collections are rows, not tabs.** They are personal and they grow, so they sit under the shared library rather than competing with it in the tab bar. Desktop promotes both into the right rail, where the dashboard already puts "receive" content.

On desktop the split follows the dashboard's own logic: left column is the library you act on, right column is what the app offers you. Same 1.5fr/1fr proportions, same 16px gutters.

### B. Search (B1–B6)

Resting state shows **recent searches and suggested topics** rather than a blank field. Suggestions are situational ("Before sleep", "Rain", "Exams", "Debt") because that is how the need is phrased in a person's head.

Results are grouped **Categories → Collections → Du'as** so a broad query lands the user on a curated set instead of 18 loose rows. Matches highlight in `primary-soft` with primary text — the tint already in the system, never a yellow highlighter.

**Filters are chips, and the result count is always stated** ("18 du'as · 2 categories", "12 of 28 shown · 2 filters"). An active chip flips to `primary-soft` and grows an × so it can be removed in one tap. The over-filtered empty state (C4) names the specific conflict and offers to drop one named filter rather than a generic "Clear all".

Desktop adds a keyboard card: `/` to search, `↑ ↓` through results, `S` to save, `C` to collect. Linear's discipline, without Linear's density.

### C. Category list (C1–C5)

Rows put **Arabic first**, translation second, citation third. This is the single most important ordering decision in the feature: a list that leads with English would make the Arabic an illustration of the translation rather than the other way round. Arabic runs are marked RTL individually inside an LTR shell, which is why the Arabic sits right and the translation left.

The favourite heart is a persistent trailing control at every list level, so saving never requires opening the du'a.

Tablet adds an "About this category" panel and a memorisation progress bar — the dashboard's rule that a metric is stated as a sentence, then optionally drawn.

### D. Reading (D1–D6)

One du'a, one card, maximum quiet. Amiri at 27px/2.0 gets the top of the card; the Lora translation follows at 15.5px in full ink (not muted — it is primary content here, unlike in a list); transliteration is 12.5px italic and toggleable; the citation names both source and narrator.

The **virtue note** sits in a `primary-soft` block — the dashboard's tinted prompt row, reused. It states why the du'a is recited and what was promised, which is the difference between a phrasebook and a companion.

A **four-up action row** (Saved / Collection / Share / Copy) uses equal-width bordered tiles rather than a floating action bar, so all four are visible without discovery and none of them is louder than the text. Saved is the only one that colours, in brass.

Prev/next footer keeps the sequence walkable inside a category. The reading-settings sheet (D4) exposes Arabic size, transliteration, translation source, reciter and keep-screen-awake — the five settings that actually change during a reading session, and nothing else.

### E. Audio (E1–E3)

The mini player is **docked above the tab bar**, sharing the tab bar's hairline top border and surface so it reads as one piece of chrome, not a floating widget. It carries reciter, a 4px emerald progress track, elapsed/remaining tabular numerals and the repeat state — "Repeat 3 of 7" — because repetition is a memorisation tool here, not a music feature.

The expanded sheet adds word-follow highlighting (the active word in `primary`, the rest in ink), repeat 1×/3×/7×/∞ and speed. Playback controls are a 52px primary circle flanked by two 36px icon buttons: one unambiguous primary action per surface.

Offline audio failure (E2) replaces the player row in place, keeping the same height so nothing shifts, and offers Retry.

### F. Favourites (F1–F3)

Sorting is chips, not a dropdown, so the current sort is visible without a tap. Swipe-to-remove reveals a brass-tinted "Remove" — brass again meaning *saved state*, and warm rather than destructive-red because unsaving is not a destructive act.

The empty state (F2) tells the truth about the benefit — favourites work offline — and then shows two commonly saved du'as so the state is not a dead end.

Desktop adds bulk "Add selected to" and an offline-status card confirming 34 du'as and 21 recitations are downloaded.

### G. Collections (G1–G5)

Collections use the **category card, extended by one line** of user description. Same 18px radius, same glyph container; the only difference is that the subtitle is the user's own words. That equivalence is deliberate: a personal list should look as legitimate as a curated category.

Collection detail exposes reorder handles inline rather than behind an "Edit" mode — Things 3's model, and the reason the drag glyph replaces the leading gutter rather than pushing content.

The create sheet asks for exactly three things (name, optional description, icon) and previews the icon in the same `primary-soft` container it will live in. Add-to-collection is a sheet from the reader, with checks on lists already containing the du'a.

### H. Sharing (H1–H3)

The share sheet previews the **actual artefact** before offering destinations. The share card is the app's own parchment/night ground with Arabic, translation, citation and a single small "Muslim Life OS" wordmark at 10.5px muted — attribution, not branding. No app-store badge, no gradient, no decorative frame; the du'a is not a promotional surface.

Four output chips (Image / Text / Arabic only / Link) cover the real cases: pasting into a family chat, sending Arabic to someone who reads it, and linking back. The error state (H3) fails to text-sharing rather than blocking the whole sheet.

---

## 3. State design

**Loading (A3, A4, B4, C3, D3).** Content-shaped skeletons at the exact final geometry — the Du'a of the Day skeleton is 30px tall where Arabic will be, and its two text lines are 92% and 58% wide so they read as prose. List skeletons place a right-aligned bar where the Arabic will land, which is why the loading list already looks bilingual. Pulse is the dashboard's 1.6s on `--skel`. No spinners anywhere.

**Empty (A8, B3, F2, G2).** Every empty state is a tinted glyph, one warm sentence and exactly one action. Copy is honest about effort and benefit ("Saved du'as stay on your device, so they are there when the signal isn't"). No zero counters, no fake charts, no "0 of 28" scoreboard.

**Error (A5, B5, E2, H3).** A new pattern was required — see §7. Errors render as an inline hairline card with a brass-tinted glyph, a plain-language cause, a statement of what *still works*, and one ghost-button recovery. Never a red banner, never a blocking dialog, never an error code. The palette has no alarm red and this feature did not introduce one: an app used at Fajr should not shout.

**Populated.** Mocked imperfect on purpose — partially filtered lists, a category 7 of 28 memorised, three of five collections in use.

---

## 4. Interaction specifications

- **Filtering** — chip tap toggles `primary-soft` fill and reveals an ×; the result count line updates in the same frame; filters persist per category for the session. Zero-result filtering names the conflicting filter.
- **Bookmarking** — heart fills brass with a 160ms tint transition and no toast. The count on Favourites updates silently. Undo lives in the swipe gesture, not a snackbar.
- **Reading flow** — Home → category → list → reader → (audio) → Next. Prev/next stays inside the filtered set, so filtering also shapes the reading sequence.
- **Collections** — add via reader action or bulk from Favourites; both open the same sheet, so the mental model is one.
- **Sharing** — preview first, destination second.
- **Keyboard (desktop)** — 2px `primary` focus ring at 2px offset, shown on the sidebar in B6; full shortcut map surfaced in-product rather than hidden in settings.
- **RTL** — Arabic runs are individually `direction: rtl` inside an LTR shell, at every level from list row to reader to share card.

---

## 5. Responsive strategy

- **Mobile 390** — single column, 2-up category grid, actions inside thumb reach, sheets for all input, mini player docked above the tabs.
- **Tablet 834** — same components, 3-up category grid, and a 1.6fr/1fr split that puts the list left and context (about, progress, related) right. A reflow, not a redesign: identical radii, padding and type sizes.
- **Desktop 1440** — 220px sidebar plus a 1.5fr/1fr two-column body. Reading measure is capped by the column, never the viewport, so translation lines stay in the 60–75 character range.

## 6. Accessibility

- Body and primary text meet 4.5:1 in both themes; muted text is confined to secondary content.
- Saved state carries a filled shape *and* colour; active filters carry a fill *and* an × affordance; audio state carries an icon change, not just colour.
- All tap targets ≥44px, including the 36px icon buttons, which are specified with a 44px hit area.
- Arabic line-height 1.85–2.0 to give diacritics vertical room; transliteration is available for every du'a.
- Skeleton pulse is the only ambient motion and is disabled under `prefers-reduced-motion`.
- Audio has a visible text transcript path (translation + transliteration) so it is never the sole channel.

---

## 7. New patterns introduced, and why

Three, all built from existing tokens, none introducing a new colour, radius, shadow or font:

1. **Inline audio player** — the dashboard had no audio surface. It is composed from the existing progress track, the pill/primary circle and the tab-bar surface, and is docked to the tab bar so it introduces no new elevation layer.
2. **Error card** — the dashboard mockups covered loading, empty and populated only. This feature is network- and audio-dependent, so an error pattern was unavoidable. It reuses the card, glyph container and ghost button; the only new value is a brass tint at 16% for the glyph, chosen over inventing a red so the palette stays intact.
3. **Reader Arabic step (27px)** — one step above the 20px card Arabic. Required because the reader is the only surface where a single du'a is the entire page; keeping card-sized Arabic there would make reading feel like previewing.

Two further deliberate *non*-additions: no gradients (reserved for the prayer hero), and no streaks, badges, levels or progress celebrations anywhere — memorisation progress is stated as a sentence and a hairline bar, and that is the ceiling.

---

## 8. Influences, and how they were used

- **Tarteel** — the Arabic is never subordinate. It leads every list row and owns the top of the reader.
- **Quran.com** — source transparency: every entry names its reference and narrator inline, not behind an info icon.
- **Pillars** — practice without scoring. Memorisation is reported, never gamified.
- **Apple Health** — one card, one idea, stated as a sentence before it is drawn.
- **Things 3** — one unambiguous primary action per surface; sheets for input; empty states that speak like a person.
- **Linear** — hairline separation, a single accent, uppercase 12px/0.12em micro-labels, and a visible keyboard model on desktop.

None is copied structurally. The layout is the approved dashboard's card grid, applied to a library.

---

## 9. QA performed

All 41 frames were rendered and inspected individually. Issues found and fixed:

1. Tablet and desktop frames rendered with large dead space below the content — frame minimum heights were retuned so each frame ends at its content.
2. The desktop right-rail cards inherited a card top margin inside a flex column, producing an uneven first gutter — normalised to the 16px grid gap.
3. Verified per-run RTL at every level: Arabic sits right and its translation left in list rows, reader, skeletons and the share card.
4. Verified the dashboard's dark-mode contrast fix is carried through: filled buttons, the play control and completed checks use dark ink on `#4fae8b`, never white.
5. Verified skeleton list rows preview the real bilingual layout — the Arabic placeholder is right-aligned at 52% width rather than a full-width bar.

Final pass: no clipped or overlapping text, no orphaned controls behind the tab bar or player, consistent 18px radii, 14–16px gaps and 1px hairlines across all 41 frames in both themes.
