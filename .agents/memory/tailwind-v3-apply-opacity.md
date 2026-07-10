---
name: Tailwind v3 @apply opacity modifier gotcha
description: Why custom-color opacity modifiers inside @apply blank the PulseBoard frontend, and how to avoid it
---

In Tailwind v3, using an opacity modifier on a custom (theme-extended) color inside an
`@apply` directive fails PostCSS compilation. Examples that break:
`@apply focus:ring-brand-red/50`, `@apply shadow-brand-red/25`.

Error: `The `focus:ring-brand-red/50` class does not exist.` The failure is on the CSS
transform, so the whole stylesheet 500s and the app renders a BLANK WHITE page (React
never mounts). Symptom in the browser: `Failed to load resource: 500` for `src/index.css`.

**Why:** Tailwind v3 cannot resolve the `/<alpha>` slash-opacity syntax for arbitrary
theme colors when expanding `@apply` (works fine as a direct class in JSX, not via @apply).

**How to apply:** In `pulseboard/frontend/src/index.css` component classes, do NOT put
`<color>/<opacity>` on `ring-*`/`shadow-*`/`border-*` custom colors inside `@apply`.
Instead set the concrete value in plain CSS on the next line, e.g.
`--tw-ring-color: rgba(232,23,61,0.5);` or an explicit `box-shadow: ... rgba(...)`.
Slash-opacity is fine in JSX className attributes (e.g. `bg-bg-border/50`), just not in @apply.
