# Ahmed Mahdy Portfolio Resume

Responsive portfolio resume site for Ahmed Mahdy, a UX Designer and Data Visualizer based in Cairo.

Live site: [creativemahdy.space](https://creativemahdy.space/)

## Stack

- Semantic HTML
- Vanilla CSS
- Vanilla JavaScript
- Node-based static build copy step
- GitHub Pages / static hosting friendly output in `dist/`

## Project Structure

```text
.
├── .github/workflows/deploy.yml
├── assets/
├── scripts/
│   ├── serve.mjs
│   └── validate.mjs
├── build.mjs
├── index.html
├── script.js
├── styles.css
├── CNAME
└── README.md
```

## Scripts

```bash
npm run check    # validate translations, docs, and external-link hygiene
npm run test     # validate, build, and run responsive browser smoke tests
npm run build    # create dist/
npm run test:browser # test the existing dist/ in Chromium
npm run dev      # serve the repo root locally on http://127.0.0.1:4173
npm run preview  # build and serve dist/ on http://127.0.0.1:4174
```

## Maintenance Notes

- Keep all UI copy in `script.js` translation dictionaries synchronized for `en` and `ar`.
- If you add a new `data-translate` or `data-translate-attr-key` entry in `index.html`, run `npm run check` before committing.
- External links opened with `target="_blank"` should keep `rel="noopener noreferrer"`.
- Social preview metadata points to `assets/ahmed-mahdy.png`, so that file should remain available in production builds.

## Deployment

`npm run build` creates the deployable static output in `dist/`. The GitHub Pages workflow validates the source, builds the site, and publishes `dist/`.
