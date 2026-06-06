# Ahmed Mahdy — Portfolio Resume (Production-Grade V2)

A highly optimized, production-grade responsive portfolio resume website for **Ahmed Mahdy**, a **UX Designer & Data Visualizer** based in Cairo, Egypt. 

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

---

## How to Update This Resume (No AI Needed)

You can easily maintain and update your resume by directly editing the files. Follow this quick guide to make content updates without using AI:

### 1. Updating Text Content (Bilingual Support)
All user-facing text strings are mapped inside the `translations` object inside [script.js](file:///c:/Users/AhmedMahdy/OneDrive%20-%20Advansys%20IS/Documents/Antigravity/Responsive%20Resume/script.js).
- Open `script.js` and locate `const translations = { ar: { ... }, en: { ... } };`.
- To edit any text (e.g., job bullet points, titles, education details), update **both** the English (`en`) and Arabic (`ar`) key-value pairs.
- For example, to change your job title:
  ```javascript
  // Inside script.js:
  ar: {
    title: "مطور واجهات ومصمم تجربة مستخدم", // Arabic update
  },
  en: {
    title: "Front-end Developer & UX Designer", // English update
  }
  ```

### 2. Updating Contact Links (Email, LinkedIn, Dribbble)
Contact links are defined in [index.html](file:///c:/Users/AhmedMahdy/OneDrive%20-%20Advansys%20IS/Documents/Antigravity/Responsive%20Resume/index.html) in the `<ul class="contact-list">` section.
If you need to change your email or profile URLs:
- Edit the `href` attribute on the `<a>` tag:
  ```html
  <a href="mailto:new-email@gmail.com">new-email@gmail.com</a>
  ```
- Update the `data-copy` attribute on the neighboring copy button so the click-to-copy feature copies the correct value:
  ```html
  <button class="copy-button" type="button" data-copy="new-email@gmail.com" ...>
  ```

### 3. Adding or Editing a Job or Project
Jobs and projects are structured as semantic HTML blocks inside [index.html](file:///c:/Users/AhmedMahdy/OneDrive%20-%20Advansys%20IS/Documents/Antigravity/Responsive%20Resume/index.html).
- **Step A:** Duplicate an existing article block in the HTML:
  ```html
  <!-- Project Example -->
  <article>
    <h4><a href="https://yourlink.com" target="_blank" rel="noreferrer"><span data-translate="proj_new_title">New Project Name</span></a></h4>
    <p data-translate="proj_new_desc">Short description of your project.</p>
  </article>
  ```
- **Step B:** Add your new translation keys (`proj_new_title` and `proj_new_desc`) to the `translations` object inside `script.js` in both the `ar` and `en` blocks:
  ```javascript
  // Inside script.js ar:
  proj_new_title: "مشروعي الجديد",
  proj_new_desc: "وصف مشروعي الجديد بالتفصيل.",

  // Inside script.js en:
  proj_new_title: "My New Project",
  proj_new_desc: "Detailed description of my new project.",
  ```

### 4. Compiling Your Changes
After editing the files:
- Run the build command in your terminal:
  ```bash
  npm run build
  ```
- This compiles `index.html`, `styles.css`, `script.js`, and copies your `assets` into the `dist/` directory.
- The contents of the `dist/` folder represent the final production-ready site. Upload the files inside `dist/` to Vercel, Netlify, or your host to deploy the changes.

