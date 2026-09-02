import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const html = readFileSync(resolve(root, "index.html"), "utf8");
const caseStudyFiles = [
  "project-haj-arafa.html",
  "project-cairo-airport.html",
  "project-hr-tool.html",
  "project-azkar-app.html",
  "project-lego-explorer.html",
];
const htmlDocuments = [
  { file: "index.html", source: html },
  ...caseStudyFiles.map((file) => ({
    file,
    source: readFileSync(resolve(root, file), "utf8"),
  })),
];
const script = readFileSync(resolve(root, "script.js"), "utf8");
const readme = readFileSync(resolve(root, "README.md"), "utf8");

const translationKeyPattern = /\b(ar|en):\s*\{([\s\S]*?)\n\s*\}/g;
const dictionaryKeyPattern = /\b([a-zA-Z0-9_]+)\s*:/g;
const htmlTextKeyPattern = /data-translate="([^"]+)"/g;
const htmlAttrKeyPattern = /data-translate-attr-key="([^"]+)"/g;
const blankLinkPattern = /<a\b[^>]*target="_blank"[^>]*rel="([^"]*)"[^>]*>/g;

function uniqueMatches(source, pattern) {
  return [
    ...new Set([...source.matchAll(pattern)].map((match) => match[1])),
  ].sort();
}

function getDictionaryKeys(language) {
  const match = [...script.matchAll(translationKeyPattern)].find(
    (item) => item[1] === language,
  );

  if (!match) {
    throw new Error(`Missing translation dictionary for "${language}"`);
  }

  return [
    ...new Set(
      [...match[2].matchAll(dictionaryKeyPattern)].map((item) => item[1]),
    ),
  ].sort();
}

const allHtmlSource = htmlDocuments.map(({ source }) => source).join("\n");
const htmlKeys = [
  ...uniqueMatches(allHtmlSource, htmlTextKeyPattern),
  ...uniqueMatches(allHtmlSource, htmlAttrKeyPattern),
].sort();

const errors = [];
const warnings = [];

for (const language of ["ar", "en"]) {
  const dictionaryKeys = getDictionaryKeys(language);
  const missingKeys = htmlKeys.filter((key) => !dictionaryKeys.includes(key));

  if (missingKeys.length > 0) {
    errors.push(
      `${language} dictionary is missing keys: ${missingKeys.join(", ")}`,
    );
  }
}

if (readme.includes("file:///")) {
  errors.push("README.md still contains local file:/// links.");
}

for (const { file, source } of htmlDocuments) {
  for (const match of source.matchAll(blankLinkPattern)) {
    const relValue = match[1];

    if (!relValue.includes("noopener") || !relValue.includes("noreferrer")) {
      errors.push(
        `${file} has an external link without rel="noopener noreferrer": ${match[0]}`,
      );
    }
  }

  const ids = [...source.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    errors.push(
      `${file} has duplicate IDs: ${[...new Set(duplicateIds)].join(", ")}`,
    );
  }

  if (source.includes("placehold.co")) {
    errors.push(`${file} still uses a placeholder image.`);
  }

  for (const match of source.matchAll(
    /\b(?:href|src)="((?:project-[^"]+\.html)|(?:assets\/[^"]+))"/g,
  )) {
    if (!existsSync(resolve(root, match[1]))) {
      errors.push(`${file} references missing local resource: ${match[1]}`);
    }
  }

  for (const match of source.matchAll(/\bsrcset="([^"]+)"/g)) {
    for (const candidate of match[1].split(",")) {
      const resource = candidate.trim().split(/\s+/)[0];
      if (
        resource.startsWith("assets/") &&
        !existsSync(resolve(root, resource))
      ) {
        errors.push(`${file} references missing responsive image: ${resource}`);
      }
    }
  }
}

if (htmlDocuments.some(({ source }) => source.includes('rel="manifest"'))) {
  errors.push("HTML still references a removed web app manifest.");
}

if (/serviceWorker\.register|event\.key\.toLowerCase\(\)/.test(script)) {
  errors.push(
    "Removed PWA registration or global character shortcuts were reintroduced.",
  );
}

if (
  htmlDocuments.some(({ source }) => /assets\/case-[^"]+\.jpg/.test(source))
) {
  errors.push("A case study still references a superseded JPEG asset.");
}

if (!html.includes('<script src="audio-player.js"></script>')) {
  errors.push("Homepage audio controls exist without loading audio-player.js.");
}

if (
  html.includes("data-skill-filter") ||
  /role="listitem"[^>]*tabindex/.test(html)
) {
  errors.push(
    "Informational skill chips must not behave as keyboard controls.",
  );
}

if (
  html.includes("project-toggle") ||
  script.includes("project-toggle") ||
  script.includes("initCollapsibleProjectCards")
) {
  errors.push(
    "Project cards must expose their essential content without collapse controls.",
  );
}

if (
  html.includes("project-filter-pill") ||
  script.includes("initProjectFilters")
) {
  errors.push(
    "The small project set must remain directly scannable without filters.",
  );
}

if (
  (html.match(/project-card-featured/g) || []).length !== 3 ||
  (html.match(/project-card-compact/g) || []).length !== 2
) {
  errors.push("Projects must keep a three-featured, two-compact hierarchy.");
}

if (
  (html.match(/data-copy=/g) || []).length !== 1 ||
  /data-copy="https:\/\/(?:www\.)?(?:linkedin|dribbble)/.test(html)
) {
  errors.push(
    "Only the email action should expose a copy control in the hero.",
  );
}

for (const { file, source } of htmlDocuments.filter(
  ({ file }) => file !== "index.html",
)) {
  if (!/data-project-key="cs_[^"]+"/.test(source)) {
    errors.push(
      `${file} is missing its project-specific localization metadata key.`,
    );
  }
  if (!/data-toggle-embed[^>]*aria-controls="live-embed-viewer"/.test(source)) {
    errors.push(`${file} preview toggle is missing aria-controls.`);
  }
  if (!/class="live-embed-iframe"[^>]*sandbox=/.test(source)) {
    errors.push(`${file} live preview iframe is not sandboxed.`);
  }
}

if (
  /WCAG 2\.2 AAA|Analytics show high daily retention|Reduced average request turnaround from 3 days|reducing HR ticket turnaround by 60%|maximize user conversion and engagement|45m Early Warning|<4h Request Turnaround|Real-time interactive operational dashboard/.test(
    allHtmlSource + script,
  )
) {
  errors.push(
    "Unsupported accessibility or outcome claims remain in published content.",
  );
}

for (const assetPath of [
  resolve(root, "assets", "ahmed-mahdy.webp"),
  resolve(root, "assets", "ahmed-mahdy.png"),
  resolve(root, "assets", "og-card.png"),
  resolve(root, "assets", "og-haj-arafa.png"),
  resolve(root, "assets", "og-cairo-airport.png"),
  resolve(root, "assets", "og-hr-tool.png"),
  resolve(root, "assets", "og-azkar-app.png"),
  resolve(root, "assets", "og-lego-explorer.png"),
  resolve(root, "assets", "case-cairo-airport.webp"),
  resolve(root, "assets", "case-haj-arafa.webp"),
  resolve(root, "assets", "case-hr-tool.webp"),
  resolve(root, "assets", "case-azkar-app.webp"),
  resolve(root, "assets", "case-lego-explorer.webp"),
  resolve(root, "assets", "favicon.svg"),
]) {
  if (!existsSync(assetPath)) {
    errors.push(`Missing required asset: ${assetPath}`);
  }
}

if (!html.includes('rel="canonical" href="https://creativemahdy.space/"')) {
  warnings.push(
    "Canonical URL is missing or has changed from the expected production URL.",
  );
}

if (errors.length > 0) {
  console.error("Validation failed:\n");
  for (const error of errors) {
    console.error(`- ${error}`);
  }

  if (warnings.length > 0) {
    console.error("\nWarnings:\n");
    for (const warning of warnings) {
      console.error(`- ${warning}`);
    }
  }

  process.exit(1);
}

console.log(
  "Validation passed: all assets, translation dictionaries, and case study links verified.",
);

if (warnings.length > 0) {
  console.log("\nWarnings:");
  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }
}
