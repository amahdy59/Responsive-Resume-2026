# Security and privacy

The site is static, uses self-hosted fonts and assets, and performs no analytics or third-party tracking by default. The build fingerprints deployable assets and injects a restrictive Content Security Policy plus referrer metadata. Netlify and Vercel configurations add CSP, referrer, MIME-sniffing, permissions, and long-lived asset-cache headers.

GitHub Pages controls response headers and does not apply repository-defined custom headers; defense-in-depth metadata remains in each document. The CSP permits inline JSON-LD only, because search engines require structured data in the document. Do not add inline executable JavaScript.

Report a security issue privately to the repository owner. Do not include credentials or sensitive client data in an issue.
