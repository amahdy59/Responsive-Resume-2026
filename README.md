# Ahmed Mahdy — Portfolio Resume

A responsive portfolio resume website for **Ahmed Mahdy**, a **UX Designer & Data Analyst** based in Cairo, Egypt.

The site presents my professional profile, selected UX and data visualization projects, certifications, skills, employment history, and education in a clean, recruiter-friendly format.

## Live Site

[View Portfolio Resume](https://mahdy-resume.vercel.app/)

## UX & Design Principles (UX Visualization)

The portfolio is designed with modern UX principles to ensure high readability, accessibility, and visual appeal:

- **Glassmorphism & Depth:** Utilizes translucent panels (`backdrop-filter: blur`) over an ambient particle background to create depth without distracting from the text.
- **Visual Hierarchy:** Grid layouts separate core metadata (skills, contact) on the sidebar, drawing the eye directly to the main column for work experience and projects.
- **Unified Color Palette:** The design relies on a primary brand color (Blue `#0076a8`) and a secondary accent (Green `#2d7a4e`) to maintain a cohesive, professional aesthetic, avoiding visual fatigue.
- **Micro-Interactions:** Subtle hover states and micro-animations (e.g., hover lifts on project cards) provide immediate visual feedback, enhancing the premium feel of the resume.
- **Accessibility (a11y):** All interactive elements feature distinct focus states (`:focus-visible`), decorative icons are hidden from screen readers (`aria-hidden="true"`), and high contrast ratios are maintained for maximum readability.

## UX Writing Strategy

The content strategy focuses on clarity, scannability, and impact:

- **Impact-Oriented Bullet Points:** Instead of merely listing tasks, employment history bullet points use the **STAR** method (Situation, Task, Action, Result) to highlight the tangible value delivered (e.g., *“Designed interactive wireframes and prototypes that accelerated the development handoff process.”*).
- **Clear Value Proposition:** The "About Me" section immediately synthesizes dual expertise in UX Design and Data Analysis.
- **Scannable Tags & Pills:** Dense information like skills and software proficiencies are grouped into pill tags, allowing recruiters to quickly scan for keywords.
- **Semantic Dates:** All timeline dates are formatted consistently using standard abbreviations (e.g., *Jul 2018 - Jan 2023*) and wrapped in HTML5 semantic `<time>` tags.

## Code Structure & Quality

This project is built as a lightweight, performant static website without heavy frameworks. 

### Tech Stack
- **HTML5:** Highly semantic markup (`<main>`, `<section>`, `<article>`, `<aside>`, `<time>`).
- **CSS3:** Advanced modern CSS utilizing CSS Grid, Custom Properties (variables), `clamp()` for fluid typography, and `color-mix()` for dynamic shading. Supports both Light and Dark modes.
- **JavaScript (Vanilla):** Minimal JavaScript handles the theme toggle (with `localStorage` persistence) and the modern Clipboard API (`navigator.clipboard.writeText`) for copying contact details.
- **SVG Sprite:** Icons are stored in a single inline SVG sprite at the top of the body for optimal performance and easy recoloring via CSS.

### Project Directory

```text
.
├── assets/
│   └── ahmed-mahdy.png      # Profile picture
├── index.html               # Main semantic HTML structure
├── styles.css               # Styling, themes, responsive layout, and animations
├── script.js                # Theme toggle and clipboard functionality
├── build.mjs                # Build script (if applicable)
├── package.json             # NPM configuration
└── README.md                # Documentation
```

## Planned Portfolio Expansion

This portfolio will be expanded with more complete UX case studies and dashboard projects.

### UX Projects
- **Arabic-English Learning Companion:** A bilingual learning platform for Arabic-speaking adults learning English.
- **Halk Gym Community Wellness Platform:** A responsive Arabic fitness and wellness platform.
- **Zakat & Charity Impact Platform:** A trust-centered donation experience.

### Dashboard Projects
- **English Learning Progress Dashboard:** Power BI dashboard for tracking learner progress.
- **Egypt Wellness & Fitness Insights Dashboard:** Public-health dashboard exploring wellness indicators in Egypt.
- **Humanitarian Needs Dashboard:** A data storytelling dashboard using public humanitarian datasets.
