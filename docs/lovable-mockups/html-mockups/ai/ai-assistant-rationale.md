# AI Assistant — UI/UX Rationale
Muslim Life OS · extends the approved Dashboard design language (no new design system)

## 1. Design language extracted from the approved Dashboard mockups

| Token group | Value carried over unchanged |
|---|---|
| Surface / background | Light `#faf7f1` page, `#ffffff` cards · Dark `#0d1211` page, `#141a18` cards |
| Ink / muted | Light `#1c1f1d` / `#6f7570` · Dark `#eef2ef` / `#8d9791` |
| Primary | Light `#1f6b52`, soft `#e6f0ea` · Dark `#4fae8b`, soft `#16241f` |
| Accent (restrained) | Brass `#a8863f` / `#d3ad5f` — used only for scholarly emphasis |
| Typography | Plus Jakarta Sans (UI, 600/500/400), Lora (translation & quotes), Amiri (Arabic) |
| Type scale | 22/17/15/13/12px, section labels 11px uppercase + 0.08em tracking |
| Spacing | 4pt base; 20px screen gutter (mobile), 32px (tablet), 40px (desktop); 12–20px card padding; 20px inter-block rhythm |
| Radius | 20px cards, 12px tiles/avatars, 10px controls, 99px pills |
| Elevation | One level only: `0 1px 2px` hairline + `1px` border. Modals/sheets get a single deeper shadow |
| Cards | White surface, 1px `--line` border, internal dividers instead of nested cards where possible |
| Navigation | Mobile bottom tab bar (5 items), tablet list+detail split, desktop left sidebar |
| Interaction | Tap targets ≥44pt, quiet pressed states, single accent per screen |
| Motion | 160–240ms ease-out opacity/translate only; no bounce, parallax, or celebratory motion |

Everything below is composed from these tokens. **No new colour, radius, shadow, or typeface was introduced.** Two new *layout* patterns were required and are justified in §9.

## 2. Conversation list
- Grouped **Today / This Week / Earlier** using the Dashboard's 11px uppercase section labels — the same rhythm as "Today's Prayers".
- Each row: 36px tile glyph, title (15px/600), one-line snippet (13px muted), right-aligned relative time. Rows live inside one card with hairline dividers — the Dashboard's list pattern, not a stack of floating cards, which keeps the page calm.
- **No unread badges, counters, or streaks.** Nothing pressures return visits; this is a reference tool, not a feed.
- Search sits above the list on every breakpoint, so retrieval is a first-class action rather than a hidden icon.

## 3. Chat
- **User turns**: right-aligned quiet card, hairline border, no filled colour bubble. Colour is reserved for meaning (primary = actionable, brass = scholarly), so a filled user bubble would be visual noise.
- **Assistant turns**: no bubble at all. A small `ASSISTANT` label plus body text on the page surface. This reads like a page in a book rather than a chat toy, is the main deliberate departure from ChatGPT-style UI, and improves long-form legibility.
- Answer measure capped at ~64ch; 1.65 line-height (Dashboard body setting).
- **Quote block**: left primary rule, Amiri Arabic line, Lora translation, muted attribution. Identical treatment to the Dashboard's Qur'an widget so scripture always looks the same everywhere in the app.
- Streaming state shows "Reading Surah Al-Mulk and two tafsir sources…" plus three skeleton lines, using the Dashboard skeleton token. Naming the work being done builds trust and replaces a spinner.

## 4. Suggested prompts
- Shown only on an empty conversation, under an 11px `A PLACE TO START` label, as four full-width rows with a chevron — the same affordance as Dashboard navigation rows.
- Prompts are study-shaped ("Explain the meaning of Surah Al-Mulk, verse 2", "I struggle to focus in prayer — where do I begin?"), never engagement bait.
- They disappear after the first message and are not re-injected mid-thread, keeping the thread free of clutter.

## 5. Voice
- Full-screen sheet, not an inline mic mode: speaking aloud is a modal act and deserves an undistracted surface.
- Three concentric **breathing rings** at 4s ease-in-out instead of a reactive waveform. A waveform is a performance metric; a slow ring reads as listening and matches the app's calm motion language.
- Live transcript is shown in Lora so the user can verify wording before sending; **Cancel / Send** are explicit — nothing is sent automatically.
- Footnote: "Audio is transcribed on your device and never stored." Privacy stated where the risk is felt.

## 6. Search
- One field, instant results, matched terms highlighted with `--primary-soft` (no new colour).
- Results reuse the conversation-row component exactly, so search feels like a filter on the list rather than a separate screen.
- Result count is stated ("3 results"); an empty query shows the normal grouped list instead of a blank screen.

## 7. History
- History *is* the conversation list — there is no second archive concept to learn. Relative dates (09:12, Yesterday, Thu, 12 Jul) match the Dashboard's time formatting.
- On desktop the list becomes a persistent 320px rail beside the thread, so context switching costs no navigation.

## 8. Sources — mandatory, collapsed by default
- Every assistant answer carries a `n sources` disclosure pill. Collapsed by default so the answer stays readable; expanded it lists one card per source with type tag (`QUR'AN`, `TAFSIR`, `SAHIH`) and a deep link (`Open in Reader`, `Open in Tafsir Explorer`, `Open in Hadith`).
- Grading tags use primary-soft, never green/red "score" chrome — authentication is information, not a badge to earn.
- Links route into the app's own reader modules, so verification never ends in a dead end.

## 9. Islamic guidance disclaimer
- **First run**: a `BEFORE YOU BEGIN` card, brass-ruled, stating plainly that the assistant helps you *study*, cites its sources, does not issue fatwa, does not weigh between madhāhib, and can be wrong — with a single `I understand` action.
- **Persistent**: a 12px muted footer under the composer on every breakpoint: "Guidance for study, not a religious ruling. For matters of fiqh, consult a qualified scholar." Quiet enough not to nag, present at the exact moment of asking.

## 10. States
- **Loading**: list skeletons (rows) and answer skeletons (lines) using the Dashboard skeleton fill and 1.6s pulse.
- **Empty**: centred glyph, "Ask, and study the answer", one explanatory line, then suggested prompts. No illustration, no mascot.
- **Populated**: as described above.
- **Error**: brass-ruled card, "The answer could not be completed", the reason ("stopped before its sources were verified, so nothing is shown"), and `Try again` / `Ask differently`. **A partial, unsourced answer is never displayed** — that is the module's core trust rule.
- **Offline**: a system note plus a `QUEUED` turn — "Waiting for a connection — nothing is lost." Past threads stay readable.

## 11. Responsive behaviour
- **Mobile 390×844**: single column, bottom tabs, sticky composer, sheets for voice.
- **Tablet 834×1112**: 320px conversation list + thread; suggested prompts go 2-up to use the width without stretching text.
- **Desktop 1440×900**: sidebar + conversation rail + thread; answer column stays at its reading measure rather than filling the viewport.

## 12. Accessibility
- Body text ≥13px, answers 15px; all foreground/background pairs meet WCAG AA in both themes (muted-on-surface ≥4.6:1).
- Tap targets ≥44pt; the sources disclosure is a real button with rotation + label change, not colour alone.
- State is always carried by text ("QUEUED", "3 sources", "LISTENING"), never by colour alone.
- Arabic set in Amiri at a larger optical size with generous line-height; translations always accompany scripture.

## 13. New patterns introduced (and why)
1. **Bubble-less assistant turn** — required because answers are long-form, quote-bearing study text; a bubble would break the Dashboard's card semantics (a card = one discrete widget) and reduce legibility.
2. **Source disclosure pill + source cards** — required because no Dashboard widget cites external evidence. It is built entirely from existing tokens (pill radius 99px, card radius 20px, tag styling from the Dashboard's status tags).

No other new visual style was added.
