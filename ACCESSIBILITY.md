# Accessibility contract

The portfolio targets WCAG 2.2 AA. The automated release gate covers semantic HTML validation, Axe, keyboard operation, 320 px reflow (the 400% zoom equivalent for a 1280 px layout), English/Arabic directionality, reduced motion, print, named controls, dialogs, and a no-JavaScript baseline.

Automated checks cannot prove the whole standard. Before claiming conformance, record manual results for NVDA + Firefox, JAWS + Chrome, VoiceOver + Safari, keyboard-only use, 200% and 400% browser zoom, Windows High Contrast, and mobile screen readers. Use real devices where possible and record browser, assistive-technology version, date, route, result, and issue link. No conformance badge or unsupported accessibility claim may be published without that evidence.

Accessibility defects are release blockers when they prevent access to content or an essential action. Decorative animation must respect `prefers-reduced-motion`; all functionality must remain available without animation.
