# Accessibility contract

The portfolio targets WCAG 2.2 AA. The automated release gate covers semantic HTML validation, Axe, keyboard operation, 320 px reflow (the 400% zoom equivalent for a 1280 px layout), English/Arabic directionality, reduced motion, print, named controls, dialogs, and a no-JavaScript baseline.

Automated checks cannot prove the whole standard. Before claiming conformance, record manual results for NVDA + Firefox, JAWS + Chrome, VoiceOver + Safari, keyboard-only use, 200% and 400% browser zoom, Windows High Contrast, and mobile screen readers. Use real devices where possible and record browser, assistive-technology version, date, route, result, and issue link. No conformance badge or unsupported accessibility claim may be published without that evidence.

Accessibility defects are release blockers when they prevent access to content or an essential action. Decorative animation must respect `prefers-reduced-motion`; all functionality must remain available without animation.

## Manual acceptance session (pending real devices and assistive technology)

Automated browser emulation is not a VoiceOver/NVDA or physical-device test.
Record each result with OS, browser and screen-reader version, date and route.

| Task (repeat in English and Arabic) | Expected result | Status |
| --- | --- | --- |
| NVDA + Firefox: traverse headings, landmarks and projects | Logical order, useful link names, decorative icons skipped | Pending |
| VoiceOver + Safari/iPhone: language and display controls | Labels, selected language and switch states announced; RTL order understandable | Pending |
| Keyboard: open/close résumé menu and image dialog | Visible focus, no trap after closing, focus returns to trigger | Automated; manual pending |
| Narration: start, pause, seek, stop, then simulate unavailable audio | Controls announced, errors understandable, page text remains usable | Automated; manual pending |
| Browser zoom 200%/400%, enlarged OS text, Windows High Contrast | No hidden content, clipped controls or obscured keyboard focus | Automated reflow/forced colors; manual pending |
| Physical iPhone/Android: read case study and download résumé | No horizontal page pan; controls usable by touch; download opens correctly | Pending |

Do not mark pending rows passed based only on automated assertions.
