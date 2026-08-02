# Settings mockups — elegance refinement (v2)

Same IA, same frames, same token palette. Only the visual register changed.

- **Serif page titles** — page titles and key names now set in Lora (already in the
  dashboard system for quotes/translation), 500 weight, -.015em. Gives quiet
  authority instead of UI-bold shouting.
- **Hairline borders** — new `--hair` token (72–85% of `--line`) on every card,
  row divider, field, rail and sidebar edge. Structure is felt, not drawn.
- **Airier cards** — radius 18 → 16, padding 18px, 16px gaps, rows at 56px min
  height with 13px vertical padding. More breathing room per decision.
- **Circular icon marks** — square placeholder glyphs replaced with 1.25px
  circular marks at 32% opacity (85% when active). Removes visual noise and
  echoes the dashboard's prayer circles.
- **Calmer switches** — 40×23 with a 17px thumb and a lighter shadow, so a
  screen full of toggles no longer reads as a wall of green.
- **Quieter section labels** — 10.5px / .18em uppercase, reduced weight presence;
  they index the page rather than compete with it.
- **Row labels at 500** — value text and label now sit in balance, with the
  primary emphasis carried by position rather than weight.
- **Wider reading rhythm** — detail pane inset 32px, capped at 720px so a control
  never floats far from the label it belongs to.

No new colours, no shadows inside the app, no gamification, no gradients. Motion
budget unchanged: the single 1.6s skeleton pulse, disabled under
`prefers-reduced-motion`.
