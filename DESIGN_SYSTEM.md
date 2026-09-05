# Design system

`styles/tokens.css` defines the public token contract: semantic colors, spacing, type sizes, radii, shadows, motion durations/easing, and z-index layers. Components consume semantic tokens so theme and high-contrast modes remain coherent.

The rest of `styles/*.css` is split by concern and built into a single fingerprinted `styles.css` bundle in this order (see `styleBundleOrder` in `build.mjs`): `base.css` (reset and shared elements) → `animations.css` (`@keyframes`) → `components.css` (buttons, copy-button, tooltips, toggles, the shared `.panel` shell — used on every page) → `home.css` (hero, projects, skills, certifications, timeline — homepage only) → `case-study.css` (case-study nav, mockup, narrative sections, lightbox — case-study pages only) → `responsive.css` (viewport breakpoints, both page types) → `accessibility-modes.css` (forced-colors, reduced-motion, high-contrast) → `print.css`. Load order matters: `components.css` must precede `home.css`/`case-study.css` so page-specific rules can override shared ones at equal specificity.

Core components are the resume shell, hero, toolbar controls, sticky section navigation, panels, timelines, project cards, case-study sections, mobile jump menu, preview controls, dialog/lightbox, global narration player, toast, and print layout. Every interactive component must define default, hover, focus-visible, active/pressed, disabled where applicable, dark-theme, high-contrast, RTL, reduced-motion, and print behavior.

Narration uses one controller and one player per page. Section triggers start the session; the global player owns pause/resume, stop, progress, seeking, playback speed, and previous/next navigation. Audio never autoplays and prerecorded R2 narration falls back to language-matched browser speech only after a user action.

Avoid `transition: all`, physical left/right positioning when a logical property works, and arbitrary new z-index or spacing values. Add a token when a repeated design decision is genuinely new.


## Icons and interaction guidance

Use the existing inline SVG symbols: a 24 × 24 viewBox, 2-unit rounded strokes, and `currentColor` for interface icons. Copy/check use the same outline geometry; the translation symbol identifies language switching. Preserve recognizable brand marks. Keep decorative SVGs hidden from assistive technology and put the accessible name on the control. Visible text remains preferable for primary actions; do not add an icon library for isolated glyphs.

Keep content visible on load. Avoid observers for purely decorative effects or persistent background animation. Use motion tokens for short control feedback, and check `prefers-reduced-motion` in JavaScript as well as CSS before scrolling. Menu disclosure uses native `details`/`summary`; Escape restores summary focus and leaving the disclosure closes it. Tooltips supplement existing labels, remain reachable by pointer, and dismiss with Escape without blurring the trigger. Touch layouts suppress redundant hover bubbles and keep copy controls visible.

Focus styling applies to all focusable elements, including summaries, selects, and image preview triggers. Scrollable navigation uses an inset ring to avoid clipping. Keep control targets at least 44 CSS pixels where practical, independently of glyph size.

Research references (reviewed 2026-09-05):

- [WCAG 2.2 additions: target size and unobscured focus](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)
- [W3C: hover/focus content must be dismissible, hoverable, and persistent](https://www.w3.org/WAI/WCAG21/Understanding/content-on-hover-or-focus)
- [W3C: decorative images](https://www.w3.org/WAI/tutorials/images/decorative/)
- [web.dev: respecting reduced motion](https://web.dev/articles/prefers-reduced-motion)
- [web.dev: animation performance](https://web.dev/articles/animations-guide)

Run `npm test` after changing these contracts. The browser suite checks bilingual tooltip dismissal, disclosure keyboard behavior, navigation focus styling, and reduced-motion preview scrolling alongside the existing responsive, Axe, narration, print, and no-JavaScript coverage. Automated checks do not establish complete WCAG conformance; screen-reader and real-device usability sessions remain valuable before broader redesigns.
