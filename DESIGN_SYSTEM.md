# Design system

`styles.css` defines the public token contract: semantic colors, spacing, type sizes, radii, shadows, motion durations/easing, and z-index layers. Components consume semantic tokens so theme and high-contrast modes remain coherent.

Core components are the resume shell, hero, toolbar controls, sticky section navigation, panels, timelines, project cards, case-study sections, preview controls, dialog/lightbox, audio controls, toast, and print layout. Every interactive component must define default, hover, focus-visible, active/pressed, disabled where applicable, dark-theme, high-contrast, RTL, reduced-motion, and print behavior.

Avoid `transition: all`, physical left/right positioning when a logical property works, and arbitrary new z-index or spacing values. Add a token when a repeated design decision is genuinely new.
