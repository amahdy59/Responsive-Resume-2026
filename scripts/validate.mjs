import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const html = readFileSync(resolve(root, "index.html"), "utf8");
const caseStudyFiles = [
  "project-haj-arafa.html",
  "project-cairo-airport.html",
  "project-hr-tool.html",
  "project-lego-explorer.html",
  "project-sales-dashboard.html",
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
  return [...new Set([...source.matchAll(pattern)].map((match) => match[1]))].sort();
}

function getDictionaryKeys(language) {
  const match = [...script.matchAll(translationKeyPattern)].find((item) => item[1] === language);

  if (!match) {
    throw new Error(`Missing translation dictionary for "${language}"`);
  }

  return [...new Set([...match[2].matchAll(dictionaryKeyPattern)].map((item) => item[1]))].sort();
}

const htmlKeys = [
  ...uniqueMatches(html, htmlTextKeyPattern),
  ...uniqueMatches(html, htmlAttrKeyPattern),
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
      errors.push(`${file} has an external link without rel="noopener noreferrer": ${match[0]}`);
    }
  }

  const ids = [...source.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    errors.push(`${file} has duplicate IDs: ${[...new Set(duplicateIds)].join(", ")}`);
  }

  if (source.includes("placehold.co")) {
    errors.push(`${file} still uses a placeholder image.`);
  }

  for (const match of source.matchAll(/\b(?:href|src)="((?:project-[^"]+\.html)|(?:assets\/[^"]+))"/g)) {
    if (!existsSync(resolve(root, match[1]))) {
      errors.push(`${file} references missing local resource: ${match[1]}`);
    }
  }
}

for (const assetPath of [
  resolve(root, "assets", "ahmed-mahdy.webp"),
  resolve(root, "assets", "ahmed-mahdy.png"),
  resolve(root, "assets", "favicon.svg"),
]) {
  if (!existsSync(assetPath)) {
    errors.push(`Missing required asset: ${assetPath}`);
  }
}

if (!html.includes('rel="canonical" href="https://creativemahdy.space/"')) {
  warnings.push("Canonical URL is missing or has changed from the expected production URL.");
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

console.log("Validation passed.");

if (warnings.length > 0) {
  console.log("\nWarnings:");
  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }
}
