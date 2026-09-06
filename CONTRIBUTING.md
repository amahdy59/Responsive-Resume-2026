# Contributing

Use Node 20 or later and install with `npm ci`. Run `npm test` before committing. It performs HTML, CSS, and JavaScript linting, content/asset validation, a production build, responsive browser checks, and Axe checks.

Keep English and Arabic dictionaries synchronized, use responsive local WebP images, and preserve the evidence rules in `CONTENT_GUIDE.md`. Do not add third-party tracking, remote fonts, credentials, or unsupported claims. Stage only intended files.

Deployment is complete only after the commit is pushed, the Pages workflow succeeds, and `npm run verify:deploy -- <commit>` confirms the production routes.


## Automatic release checks

`npm ci` installs the repository's `.githooks/pre-push` hook. Every normal `git push` runs `npm test` and stops if a check fails. GitHub Actions independently runs the same gate on every branch push and on pull requests to main, so CI still protects deployment when a local hook is absent. Only main can deploy, and the deploy job requires the quality job to succeed.

The gate covers HTML/CSS/JS linting, assets and bilingual content, browser functionality and keyboard UX, English/Arabic layouts from 320px to 1920px, Axe accessibility, no-JavaScript routes, theme/contrast preferences, reviewed visual baselines, and performance budgets (LCP <= 3500ms, CLS <= 0.1, transfer <= 1.5MB). Visual artifacts are retained for 14 days, including failures. Missing baselines fail; CI must never automatically approve screenshots. For intentional visual changes, inspect `artifacts/visual/`, run `node scripts/visual-regression.mjs --update` locally, and commit only reviewed baseline files. The comparator currently allows wider CI tolerance for platform rendering differences; it detects major visual regressions, not pixel-perfect cross-platform equivalence.

Commit intended files, then use `npm run ship` or `git push origin main`. The ship command relies on the pre-push gate and then monitors the exact deployment workflow. It no longer auto-stages files or accepts a commit message.

After Pages deploys the tested artifact, CI checks `release.json` against the expected commit and exercises live English/Arabic mobile layout, theme switching, resume downloads, keyboard dismissal, and narration CORS from the production browser origin. Local `npm run verify:deploy -- <commit>` also requires a successful matching Pages workflow. Timeouts and API errors fail verification rather than treating the previous healthy site as proof of deployment.

Automated UX checks cover explicit interaction contracts. Content clarity, screen-reader experience, and subjective design quality still require human review. Performance numbers are laboratory budgets, not field Core Web Vitals.
