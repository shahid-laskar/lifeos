# Family Module — UI/UX Rationale

The Family module is an extension of the approved Dashboard design system. No new visual language was introduced.

## 1. Design language extracted from the approved Dashboard

**Colour.** Light: bg `#faf7f1`, surface `#ffffff`, hairline `#e7e1d6`, ink `#1c1f1d`, primary `#1f6b52`. Dark: bg `#0d1211`, surface `#141a18`, hairline `#232b28`, ink `#eef2ef`, primary `#4fae8b`. Primary is used for one action per surface; everything else is ink or muted ink. No gradients other than the single flat deep-green hero already approved.

**Typography.** Plus Jakarta Sans for UI (page title 30/34 semibold, card title 15 semibold, body 14, meta 13, section label 11 uppercase with 0.09em tracking), Lora for reflective quotes, Amiri for Arabic. The scale is unchanged; the Family module only reuses existing steps.

**Spacing.** 4pt base, 8/12/16/20/24/32 rhythm. Card padding 20 (mobile) / 24 (tablet, desktop), gaps 16 (mobile) / 20 (tablet) / 24 (desktop), page gutters 20/32/40.

**Radius & elevation.** Cards 20px, hero 24px, pills 999px, inner wells 14px. One elevation only: `0 1px 2px rgba(28,31,29,.04)` plus a hairline border. Dark mode drops the shadow and relies on the border, exactly as the Dashboard does.

**Iconography.** Thin, geometric, monoline glyphs at 1.5px stroke inside a 40px tinted square (`primary @ 10%`). No filled or multicolour icons, no emoji, no mascots.

**Cards & navigation.** Section-label header, optional single quiet text action on the right, hairline-separated rows. Mobile keeps the 5-item bottom tab bar with Family living under *More*; tablet keeps the same tab bar with a two-column grid; desktop keeps the left sidebar and a 2/1 column split. Module sections use the existing quiet pill segmented control rather than a new nav pattern.

**Interaction & motion.** Tap targets ≥44pt. Motion is limited to 160–220ms opacity and 4–6px translate, plus the existing skeleton shimmer. No spring, bounce, confetti or celebratory animation.

## 2. Frames delivered (24)

Mobile 390pt, Tablet 834pt, Desktop 1440pt — each in light and dark:
Overview (populated), Shared goals, Prayer participation, Children, Shared reminders, Activity history, plus Loading (skeleton), Empty (household set up, nothing shared), Restricted (privacy-withheld member data) and Offline/Error states.

## 3. Section decisions

**Family overview.** The hero repeats the Dashboard prayer banner but aggregates the household (`23 of 25 prayers`) instead of ranking people. Members list shows name, role and a single shared summary — never a streak or score — because household awareness should not become surveillance.

**Shared goals.** Goals are collective intentions with one shared progress bar ("Read Surah Al-Mulk each night — 5 of 7 nights"). Contribution is shown as presence, not per-person totals, so no member can be identified as the weak link. No badges, levels or points.

**Prayer participation.** Aggregate by default: counts per prayer for the household. Per-member detail appears only where that member has opted in, otherwise the Restricted state explains what is hidden and why. Khushoo ratings and reflections are never shared under any setting — they belong to the individual.

**Children.** Guardian-scoped and encouragement-led. Younger children see qualitative progress ("Learning Fajr") instead of numbers, and guardians see gentle guidance copy rather than compliance charts. Guardian controls are grouped in one card so permissions are legible in a single glance.

**Shared reminders.** One reminder, one notification, silent inside quiet hours (22:30–04:00). Audience is stated on every row ("everyone", "Aisha only") so a reminder can never be sent to more people than intended by accident.

**Activity history.** Explicitly labelled "a record, not a feed", grouped by day, with no likes, reactions or comments. This prevents the module from drifting into social-media engagement patterns.

## 4. States

Loading uses the Dashboard skeleton geometry so layout does not shift. Empty states are instructive and calm, with exactly one primary action. Restricted states explain the privacy rule instead of showing a lock without context. Offline shows the last saved copy with its timestamp and reassures the user that personal logging still works and will sync.

## 5. Accessibility & responsive behaviour

All text meets WCAG AA in both themes (body ink on surface ≥ 7:1; muted ink ≥ 4.6:1). Status is never colour-only — counts and words accompany every indicator. Focus rings use a 2px primary outline with offset. Layout reflows from single column (mobile) to 2 columns (tablet) to 2/1 with sidebar (desktop); header rows use a min-width-0 text column with fixed-size trailing widgets so long names truncate rather than clip.

## 6. New styles introduced

None beyond two compositions built entirely from existing tokens: the aggregate prayer-participation column strip (a reuse of the Dashboard prayer row at card scale) and the audience chip on reminder rows (the existing pill at meta size). Both were required to express audience and aggregation, which the Dashboard had no equivalent for.
