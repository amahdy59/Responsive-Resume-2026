# Ahmed Mahdy Portfolio Resume

Responsive portfolio resume site for Ahmed Mahdy, a UX Designer and Data Visualizer based in Cairo.

Live site: [creativemahdy.space](https://creativemahdy.space/)

## Stack

- Semantic HTML
- Vanilla CSS
- Vanilla JavaScript
- Node-based localized static-site build with fingerprinted assets
- GitHub Pages / static hosting friendly output in `dist/`

## Project Structure

```text
.
├── .github/workflows/deploy.yml
├── assets/
│   ├── case-*.webp
│   └── fonts/ (generated)
├── scripts/
│   ├── serve.mjs
│   ├── responsive-smoke.mjs
│   └── validate.mjs
├── build.mjs
├── preference-bootstrap.js
├── fonts.css
├── index.html
├── project-*.html
├── script.js
├── styles.css
├── CNAME
├── ACCESSIBILITY.md
├── CONTENT_GUIDE.md
├── DESIGN_SYSTEM.md
├── I18N.md
├── SECURITY.md
└── README.md
```

## Scripts

```bash
npm run check    # validate translations, docs, and external-link hygiene
npm run lint     # validate HTML, CSS, and JavaScript
npm run test     # validate, build, and run responsive browser smoke tests
npm run build    # create dist/
npm run test:browser # test the existing dist/ in Chromium
npm run dev      # build and serve dist/ locally on http://127.0.0.1:4173
npm run preview  # build and serve dist/ on http://127.0.0.1:4174
```

## Maintenance Notes

- Keep all UI copy in `script.js` translation dictionaries synchronized for `en` and `ar`.
- Treat `ACCESSIBILITY.md`, `CONTENT_GUIDE.md`, `DESIGN_SYSTEM.md`, and `I18N.md` as release contracts.
- If you add a new `data-translate` or `data-translate-attr-key` entry in `index.html`, run `npm run check` before committing.
- External links opened with `target="_blank"` should keep `rel="noopener noreferrer"`.
- Social preview metadata points to `assets/ahmed-mahdy.png`, so that file should remain available in production builds.
- Case-study pages use unique metadata, canonical URLs, previous/next navigation, and project-sized local images where verified captures exist.
- Case-study outcomes must distinguish verified evidence from future validation; do not publish unsupported performance claims.
- `assets/screenshots/` is intentionally excluded from Git and deployment; keep only optimized, referenced portfolio images in `assets/`.

## Deployment

`npm run build` creates the deployable output in `dist/`, including static `/en/` and `/ar/` routes, localized case-study routes, responsive/fingerprinted assets, `sitemap.xml`, and `robots.txt`. The GitHub Pages workflow lints, validates, builds, runs Chromium/Axe coverage, audits production dependencies, and publishes `dist/`.

Custom HTTP security headers in `netlify.toml` and `vercel.json` apply on those hosts. GitHub Pages controls its own response headers, so the generated documents also include CSP and referrer metadata.
