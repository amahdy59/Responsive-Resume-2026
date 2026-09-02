# Contributing

Use Node 20 or later and install with `npm ci`. Run `npm test` before committing. It performs HTML, CSS, and JavaScript linting, content/asset validation, a production build, responsive browser checks, and Axe checks.

Keep English and Arabic dictionaries synchronized, use responsive local WebP images, and preserve the evidence rules in `CONTENT_GUIDE.md`. Do not add third-party tracking, remote fonts, credentials, or unsupported claims. Stage only intended files.

Deployment is complete only after the commit is pushed, the Pages workflow succeeds, and `npm run verify:deploy -- <commit>` confirms the production routes.
