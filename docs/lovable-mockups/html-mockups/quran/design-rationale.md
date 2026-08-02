# Qur'an Experience — UI/UX Mockups & Design Rationale

**Deliverable:** 46 high-fidelity frames (`index.html` gallery + individual PNGs) covering 10 surfaces
across mobile / tablet / desktop, light / dark, and populated / empty / loading / error states.
No React code was written and no application file was modified.

---

## 1. Continuity with the existing visual language

Every token is inherited from the approved dashboard mockups rather than re-derived:

| Token | Light | Dark |
| --- | --- | --- |
| Canvas | `#faf7f1` | `#0d1211` |
| Surface | `#fffdf9` | `#141b19` |
| Ink | `#1c1f1d` | `#eef2ef` |
| Muted ink | `#6b736e` | `#98a29c` |
| Primary | `#1f6b52` | `#4fae8b` |
| Brass (attention) | `#a8863f` | `#d0aa5c` |
| Hairline | `rgba(28,31,29,.08)` | `rgba(238,242,239,.09)` |

Radii stay at 18–20px for cards, 12–14px for controls. Borders remain hairlines; elevation is
carried by tone, never by heavy shadow. Type: **Plus Jakarta Sans** for UI, **Lora** for translation
and reflective sentences, **Amiri** for scripture. Arabic runs at 1.9–2.05 line-height so
diacritics never collide, and is never letter-spaced or synthetically bolded.

The dashboard's "Next Prayer" banner — geometric star field, countdown, single action — is reused
verbatim as the **Continue Reading** banner. It is the one anchor a returning reader sees first on
the Qur'an home, which makes the module feel like a room in the same house rather than a new app.

**Philosophy applied, not decorated:** no star ratings (moon-phase and confidence bars instead),
no streak flames, no confetti, no gamified scores. Progress is stated as a sentence
("You read on 5 of the last 7 days"), and the absence of a target is named rather than nagged
("No target has been set"). Restraint is the reverence.

---

## 2. Surfaces and the decisions behind them

### 01 — Surah list
Search, script/juz filters, and a `Continue Reading` hero. Each row carries Arabic name, English
name, revelation place, and ayah count in one scannable line; the ayah number sits in a soft
hexagon rather than a badge so the list reads as a table of contents, not a feed.
*Empty:* first-run copy invites opening Al-Fatiha. *Loading:* tone-only skeletons, no spinners.
*Error:* a plain sentence plus one retry — no illustration, no apology theatre.

### 02 — Reader
Three view modes: **Arabic only**, **interleaved translation**, and **tafsir**. The header keeps
position ("Ayah 12 of 30 · Juz 29") with a thin progress rule under it, so scroll depth is legible
without a scrollbar. The active ayah is marked with a tinted block and a hairline rule on the
translation, not a highlight colour — the mark should feel like a thumb held on the page.
Long surahs assume windowed rendering; the design carries no visual dependency on total length.

### 03 — Immersive mode
Everything except scripture leaves. One escape affordance top-right, one keyboard hint at the
bottom. Maximum measure widens, translation drops to a quieter grey, chrome tone flattens to the
canvas. This is the only mode with no navigation at all — deliberately a dead end you step out of.

### 04 — Tafsir
Mobile uses a bottom sheet anchored to the ayah; desktop promotes it to a right-hand rail so
scripture and commentary stay co-visible. Source attribution is always shown above the commentary,
and multiple scholars are tabs rather than a merged block — the reader must always know who is
speaking.

### 05 — Audio
A recitation sheet with reciter identity, murattal style, scrubber, and three explicit toggles:
follow-along scroll, per-ayah repeat, and continue-to-next-surah. Playback state is a filled
primary circle; everything else is ghosted, so the eye lands on one control. Desktop collapses to a
mini-bar so audio survives navigation.

### 06/07 — Navigator, menu, and typography controls
Juz/surah/page jump, ayah actions (bookmark, copy, share, tafsir, play from here), and a reading
comfort sheet: Arabic size, translation size, script choice, and line spacing — all with live
sample text. Reading comfort is treated as a first-class setting, not a buried preference.

### 08 — Bookmarks & notes
Bookmarks and personal notes are one collection, sorted by recency, each carrying the ayah excerpt
so the list is readable without opening anything. Empty state explains the gesture that creates the
first one.

### 09 — Hifdh tracker
Confidence, not completion. Each memorised surah shows a four-step state (Not started / New /
Steady / Strong) with a review cadence attached to the legend, so the colour means a commitment
rather than a score. Today's review is stated in time ("about eleven minutes together"), and the
review-kept card explicitly says **No streak counted** — missing a day costs nothing.

### 10 — Reading insights
Insight, not numbers: the week is a sentence first and a chart second; habit timing ("almost always
after Fajr") is framed as self-knowledge; pace is translated into a khatam horizon; and the
"returning" card surfaces the ayah the reader keeps coming back to — the most personal metric in
the module and the one no counter can express.

---

## 3. Responsive strategy

- **Mobile (390px):** single column, bottom tab bar, sheets for every secondary surface, thumb-zone
  controls. Reader header collapses to title + position + three icons.
- **Tablet (834px):** two-column card grids; the reader gains margin instead of a second pane, since
  scripture should not compete with commentary at this width. Tafsir stays a sheet.
- **Desktop (1440px):** persistent left navigation matching the dashboard, content plus a right rail
  (tafsir / today / insight summaries). Reader keeps a fixed measure and centres — line length is
  capped for legibility rather than filled to the viewport.

Header rows use a `minmax(0,1fr) auto` grid on small widths so titles truncate instead of pushing
controls off-screen; icons never shrink.

## 4. State design

Every surface is specified in four states. Loading is tone-only skeletons that match final layout
geometry, so nothing jumps on arrival. Empty states always name the next action and never scold.
Errors are one sentence, one retry, and a preserved reading position — a failed recitation fetch
must never lose the reader's place.

## 5. Accessibility notes

Body text and muted text both clear WCAG AA on their respective canvases; brass is reserved for
attention states on surface tones only. Tap targets are ≥44px, including sheet toggles and the
audio transport. Arabic and translation carry explicit language direction. Colour is never the sole
carrier of meaning — every confidence tone is paired with a written state, and every playing ayah is
marked by both tint and rule.

## 6. Files

- `index.html` — annotated gallery of all 46 frames, grouped by surface.
- `01-…` → `10-…` PNGs — individual frames, named `NN-surface-viewport-theme-state.png`.
