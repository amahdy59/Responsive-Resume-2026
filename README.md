# Ahmed Mahdy — Portfolio Resume (Production-Grade V2)

A highly optimized, production-grade responsive portfolio resume website for **Ahmed Mahdy**, a **UX Designer & Data Analyst** based in Cairo, Egypt. 

The application is structured to deliver an outstanding experience for both human recruiters and automated systems (ATS), featuring responsive design, multilingual support, advanced accessibility, and high performance.

[Live Site Demo](https://mahdy-resume.vercel.app/)

---

## Technical & UX Highlights (Manager Review Ready)

### 1. ATS Compatibility & Content Strategy
- **Scan-Optimized Formatting:** Structured with standard HTML heading hierarchies (`<h1>`, `<h2>`, `<h3>`), standard bullet points, and semantic tags (like `<time>`) to ensure 100% readability by automated Applicant Tracking Systems (ATS).
- **Core Industry Keywords:** Injected with critical industry terms for immediate parsing:
  - *UX Design:* Interaction Design, Information Architecture, User Research, Usability Testing, Wireframing, Prototyping, Figma, Design Systems, Accessibility.
  - *Data Analytics:* Microsoft Excel, Power BI, Tableau, Python, SQL, Dashboard Design, Data Storytelling, KPI Analysis.
- **Concise Narrative:** Restructured professional experience section to follow a strict maximum of **3 high-impact bullets per job**, utilizing the **STAR method** to detail measurable achievements (e.g., *25% turnaround speedup*, *30% engagement increases*).

### 2. Bilingual Architecture (Arabic / English)
- **Logical CSS Properties:** Shifted spacing, positioning, and borders from physical directions (`margin-left`, `padding-right`) to CSS Logical Properties (`margin-inline-start`, `padding-inline-end`). This allows the layout to seamlessly flip (RTL/LTR) without code duplication.
- **Dynamic Translation Dictionary:** Maintained a clean translation map in JavaScript that changes all headings, bullets, descriptions, and tag arrays in real-time.
- **Typography Swap:** Automatically swaps fonts depending on active language: **Inter** for English and **Cairo** for Arabic, maintaining premium legibility.
- **State Persistence:** User language selection is persisted in browser `localStorage`.

### 3. Advanced Accessibility (WCAG AA Compliant)
- **High Contrast Mode:** Includes a dedicated high contrast accessibility toggle (`HC`), which instantly maps custom CSS variables to stark contrast values (pure black backgrounds, white text, and neon yellow/green interactive states) for visually impaired users.
- **Skip-to-Content Navigation:** Integrated a keyboard-accessible "Skip to main content" skip-link at the top of the viewport to bypass header links.
- **Contrast Check:** Boosted body text contrast in standard light mode by darkening the secondary Slate color (`--muted`) to `#475569`.
- **Screen Reader Semantics:** Active components feature explicit `aria-label` tags, copy buttons are fully keyboard-navigable (`:focus-visible`), and icons are hidden using `aria-hidden="true"`.

### 4. Interactive Header Graphics ("Constellation Data Network")
- Enhances the header graphic with a dynamic SVG overlay mapping nodes (representing UX design systems) and connected lines (representing analytical data networks).
- Smooth CSS animations animate the line-dash offsets (simulating flow of data packet signals) and pulse the circles gently to create a deep, professional "living dashboard" aesthetic.

### 5. Performance Optimization
- **Asset Compression:** Resized and optimized the profile avatar `ahmed-mahdy.png` from **1.37 MB down to 81 KB (a 94% file size reduction)**. This dramatically decreases the page weight and ensures instantaneous load times on mobile networks.
- **Framework-free:** Built entirely using raw semantic HTML5, Vanilla CSS3, and modern ES6 JavaScript to ensure zero package overhead and a perfect Google Lighthouse performance score.

### 6. Functionality & Print Optimization
- **Print Stylesheet:** Custom-designed print styles (`@media print`) strip screen-only animations, toggle controls, particles, and copy buttons, refactoring the document into a pristine, structured single-page layout when printing or saving as a PDF from the browser.
- **Dynamic Copy-to-Clipboard:** Automatically attaches copy-to-clipboard functionality on links for recruiter ease, using the modern `navigator.clipboard` API.

---

## File Structure

```text
.
├── assets/
│   └── ahmed-mahdy.png      # Web-optimized profile avatar (81 KB)
├── index.html               # Main semantic, data-tagged HTML layout
├── styles.css               # Logical styling, animations, themes, print & HC modes
├── script.js                # Translation mapping, toggles, & clipboard functionality
├── build.mjs                # Production asset packager
├── package.json             # NPM dependencies & build commands
└── README.md                # Technical documentation (this file)
```

## Local Development & Compilation

To build and package the production artifacts locally:

```bash
# Install dependencies (none required, native node build)
npm install

# Run static assets packager (compiles build into dist/ folder)
npm run build
```
