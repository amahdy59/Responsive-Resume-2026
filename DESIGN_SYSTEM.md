# Design system

`styles/tokens.css` defines the public token contract: semantic colors, spacing, type sizes, radii, shadows, motion durations/easing, and z-index layers. Components consume semantic tokens so theme and high-contrast modes remain coherent.

The rest of `styles/*.css` is split by concern and built into a single fingerprinted `styles.css` bundle in this order (see `styleBundleOrder` in `build.mjs`): `base.css` (reset and shared elements) → `animations.css` (`@keyframes`) → `components.css` (buttons, copy-button, tooltips, toggles, the shared `.panel` shell — used on every page) → `home.css` (hero, projects, skills, certifications, timeline — homepage only) → `case-study.css` (case-study nav, mockup, narrative sections, lightbox — case-study pages only) → `responsive.css` (viewport breakpoints, both page types) → `accessibility-modes.css` (forced-colors, reduced-motion, high-contrast) → `print.css`. Load order matters: `components.css` must precede `home.css`/`case-study.css` so page-specific rules can override shared ones at equal specificity.

Core components are the resume shell, hero, toolbar controls, sticky section navigation, panels, timelines, project cards, case-study sections, mobile jump menu, preview controls, dialog/lightbox, global narration player, toast, and print layout. Every interactive component must define default, hover, focus-visible, active/pressed, disabled where applicable, dark-theme, high-contrast, RTL, reduced-motion, and print behavior.

Narration uses one controller and one player per page. Section triggers start the session; the global player owns pause/resume, stop, progress, seeking, playback speed, and previous/next navigation. Audio never autoplays and prerecorded R2 narration falls back to language-matched browser speech only after a user action.

Avoid `transition: all`, physical left/right positioning when a logical property works, and arbitrary new z-index or spacing values. Add a token when a repeated design decision is genuinely new.
